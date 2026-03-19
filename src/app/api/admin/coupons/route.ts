import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

// ✅ Serialize a Coupon row — Decimal fields must be converted to strings for JSON
function serializeCoupon(c: any) {
    return {
        id: c.id,
        code: c.code,
        descriptionKo: c.descriptionKo ?? null,
        descriptionEn: c.descriptionEn ?? null,
        type: c.type,
        // Decimal fields → string
        discountValue: c.discountValue.toString(),
        minOrderAmount: c.minOrderAmount.toString(),
        maxUses: c.maxUses ?? null,
        usedCount: c.usedCount,
        startAt: c.startAt,
        expireAt: c.expireAt,
        isActive: c.isActive,
        createdAt: c.createdAt,
    };
}

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(coupons.map(serializeCoupon));
    } catch (error) {
        console.error('Failed to fetch coupons:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { code, descriptionKo, descriptionEn, type, discountValue, minOrderAmount, maxUses, startAt, expireAt } = body;

        // Basic validation
        if (!code || !type || discountValue === undefined || !startAt || !expireAt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 쿠폰 타입 화이트리스트 검증
        const VALID_COUPON_TYPES = ['PERCENT', 'FIXED', 'FREE_SHIPPING'];
        if (!VALID_COUPON_TYPES.includes(type)) {
            return NextResponse.json({ error: `Invalid coupon type. Must be: ${VALID_COUPON_TYPES.join(', ')}` }, { status: 400 });
        }

        // 할인 값 범위 검증
        const parsedDiscount = parseFloat(discountValue);
        if (isNaN(parsedDiscount) || parsedDiscount < 0) {
            return NextResponse.json({ error: 'Discount value must be a positive number' }, { status: 400 });
        }
        if (type === 'PERCENT' && parsedDiscount > 100) {
            return NextResponse.json({ error: 'Percent discount cannot exceed 100%' }, { status: 400 });
        }
        if (type === 'FIXED' && parsedDiscount <= 0) {
            return NextResponse.json({ error: 'Fixed discount must be greater than 0' }, { status: 400 });
        }

        // 기간 유효성 검증
        if (new Date(startAt) >= new Date(expireAt)) {
            return NextResponse.json({ error: 'Start date must be before expiration date' }, { status: 400 });
        }

        // Check for duplicate code
        const existing = await prisma.coupon.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                descriptionKo,
                descriptionEn,
                type,
                discountValue,
                minOrderAmount: minOrderAmount || 0,
                maxUses: maxUses ? parseInt(maxUses) : null,
                startAt: new Date(startAt),
                expireAt: new Date(expireAt),
                isActive: true
            }
        });

        return NextResponse.json(serializeCoupon(coupon));
    } catch (error) {
        console.error('Failed to create coupon:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
