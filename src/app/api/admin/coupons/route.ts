import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(coupons);
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

        // Check format
        const existing = await prisma.coupon.findUnique({
            where: { code }
        });

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

        return NextResponse.json(coupon);
    } catch (error) {
        console.error('Failed to create coupon:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
