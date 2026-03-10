import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const order = await prisma.order.findFirst({
            where: { id: params.id, userId: session.user.id },
            include: {
                shipment: true,
                coupon: { select: { code: true, discountType: true, discountValue: true } },
                items: {
                    include: {
                        product: {
                            select: {
                                imageUrl: true,
                                sku: true,
                                translations: {
                                    where: { langCode: 'en' },
                                    select: { name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const safe = {
            ...order,
            subtotalUsd: order.subtotalUsd.toString(),
            shippingFee: order.shippingFee.toString(),
            discountAmount: order.discountAmount.toString(),
            totalUsd: order.totalUsd.toString(),
            items: order.items.map(i => ({
                ...i,
                productId: i.productId.toString(),
                optionId: i.optionId?.toString() ?? null,
                priceUsd: i.priceUsd.toString(),
                name: i.product.translations[0]?.name ?? i.product.sku,
                imageUrl: i.product.imageUrl,
                sku: i.product.sku,
            })),
        };

        return NextResponse.json(safe);
    } catch (error) {
        console.error('Failed to fetch order detail:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}
