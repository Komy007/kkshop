import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (session?.user?.role !== 'SUPPLIER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id as string;
    const { searchParams } = new URL(req.url);
    const ALLOWED_PERIODS = [7, 30, 90, 365];
    const rawPeriod = parseInt(searchParams.get('period') ?? '30');
    const period = ALLOWED_PERIODS.includes(rawPeriod) ? rawPeriod : 30;

    const since = new Date();
    since.setDate(since.getDate() - period);

    const supplier: any = await prisma.supplier.findUnique({
        where: { userId },
        include: { products: { select: { id: true } } },
    }) as any;

    if (!supplier) {
        return NextResponse.json({ summary: null, items: [] });
    }

    const productIds: bigint[] = (supplier.products as any[]).map((p: any) => p.id as bigint);
    const commissionRate: number = supplier.commissionRate;

    const orderItems: any[] = await prisma.orderItem.findMany({
        where: {
            productId: { in: productIds },
            order: {
                status:    'DELIVERED',
                createdAt: { gte: since },
            },
        },
        include: {
            product: { select: { imageUrl: true, translations: { where: { langCode: 'en' }, select: { name: true }, take: 1 } } },
            order:   { select: { id: true, createdAt: true } },
        },
        orderBy: { order: { createdAt: 'desc' } },
    }) as any[];

    const items = orderItems.map((item: any) => {
        const subtotal   = Number(item.priceUsd) * Number(item.quantity);
        const commission = subtotal * (commissionRate / 100);
        return {
            orderId:     item.order?.id ?? item.orderId,
            productName: (item.product?.translations?.[0] as any)?.name ?? 'Product',
            orderDate:   item.order?.createdAt?.toISOString() ?? new Date().toISOString(),
            qty:         Number(item.quantity),
            priceUsd:    Number(item.priceUsd),
            subtotal,
            commission,
            net:         subtotal - commission,
        };
    });

    const grossRevenue = items.reduce((s, i) => s + i.subtotal, 0);
    const commission   = items.reduce((s, i) => s + i.commission, 0);

    const summary = {
        period:         `${period}d`,
        grossRevenue,
        commissionRate,
        commission,
        netPayout:      grossRevenue - commission,
        orderCount:     items.length,
        productCount:   productIds.length,
    };

    return NextResponse.json({ summary, items });
}
