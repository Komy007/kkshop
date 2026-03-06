import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export async function POST(request: Request) {
    try {
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

        return NextResponse.json({
            ok: true,
            discount: Number(coupon.discountValue),
            type: coupon.type
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
    }
}
