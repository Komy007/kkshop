import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const status = searchParams.get('status') || '';
        const search = searchParams.get('search')?.trim() || '';

        const where: any = {};
        if (status && ['PENDING','CONFIRMED','SHIPPING','DELIVERED','CANCELLED'].includes(status)) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { id:             { contains: search, mode: 'insensitive' } },
                { customerName:   { contains: search, mode: 'insensitive' } },
                { customerEmail:  { contains: search, mode: 'insensitive' } },
                { customerPhone:  { contains: search, mode: 'insensitive' } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    translations: {
                                        where: { langCode: 'ko' },
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    },
                    user: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
            }),
            prisma.order.count({ where }),
        ]);

        // Serialize BigInt (productId, optionId, product.id, product.categoryId) and Decimal
        const safe = orders.map(o => ({
            ...o,
            totalUsd: o.totalUsd.toString(),
            subtotalUsd: o.subtotalUsd.toString(),
            shippingFee: o.shippingFee.toString(),
            discountAmount: o.discountAmount.toString(),
            items: o.items.map(i => ({
                ...i,
                priceUsd: i.priceUsd.toString(),
                productId: i.productId.toString(),
                optionId: i.optionId?.toString() ?? null,
                product: i.product ? {
                    ...i.product,
                    id: i.product.id.toString(),
                    categoryId: i.product.categoryId?.toString() ?? null,
                    priceUsd: i.product.priceUsd.toString(),
                    reviewAvg: i.product.reviewAvg.toString(),
                    hotSalePrice: i.product.hotSalePrice?.toString() ?? null,
                    costPrice: i.product.costPrice?.toString() ?? null,
                } : null,
            }))
        }));

        return NextResponse.json({ orders: safe, total, page, pageSize: PAGE_SIZE });
    } catch (error) {
        console.error('GET /api/admin/orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
