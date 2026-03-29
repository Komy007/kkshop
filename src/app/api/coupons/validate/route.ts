import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

// Simple in-memory rate limiter: 10 attempts per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

// Periodically clean up expired entries to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
}, WINDOW_MS);

export async function POST(request: Request) {
    try {
        // Rate limiting by IP
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = (forwarded ? forwarded.split(',')[0].trim() : null)
            || request.headers.get('x-real-ip')
            || 'unknown';

        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { code, subtotal } = body;

        if (!code) {
            return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon || !coupon.isActive) {
            return NextResponse.json({ error: '유효하지 않거나 만료된 쿠폰입니다.' }, { status: 400 });
        }

        const now = new Date();
        if (now < coupon.startAt || now > coupon.expireAt) {
            return NextResponse.json({ error: '사용 기간이 아닙니다.' }, { status: 400 });
        }

        if (Number(coupon.minOrderAmount) > (subtotal || 0)) {
            return NextResponse.json({ error: `최소 주문금액 $${coupon.minOrderAmount} 이상 시 사용 가능합니다.` }, { status: 400 });
        }

        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ error: '선착순 사용이 마감되었습니다.' }, { status: 400 });
        }

        // 로그인 사용자라면 이미 사용한 쿠폰인지 체크 (UX: 주문 제출 전에 미리 알림)
        const session = await auth();
        if (session?.user?.id) {
            const alreadyUsed = await prisma.userCoupon.findUnique({
                where: {
                    userId_couponId: {
                        userId: session.user.id,
                        couponId: coupon.id,
                    },
                },
            });
            if (alreadyUsed) {
                return NextResponse.json(
                    { error: 'You have already used this coupon.' },
                    { status: 400 }
                );
            }
        }

        // Calculate actual discount, capped to subtotal to prevent negative totals
        const sub = Number(subtotal) || 0;
        let discount = Number(coupon.discountValue);
        if (coupon.type === 'PERCENT') {
            discount = Math.round(Math.min(sub * (discount / 100), sub) * 100) / 100;
        } else if (coupon.type === 'FIXED') {
            discount = Math.min(Math.round(discount * 100) / 100, sub);
        } else if (coupon.type === 'FREE_SHIPPING') {
            discount = 0; // shipping handled separately
        }

        return NextResponse.json({
            ok: true,
            discount,
            type: coupon.type
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
    }
}
