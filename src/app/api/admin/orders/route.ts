import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const orders = await prisma.order.findMany({
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
            orderBy: { createdAt: 'desc' }
        });

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

        return NextResponse.json(safe);
    } catch (error) {
        console.error('GET /api/admin/orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
