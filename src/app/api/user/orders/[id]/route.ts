import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await context.params;

        const order = await prisma.order.findFirst({
            where: { id, userId: session.user.id },
            include: {
                shipment: true,
                // ✅ 'type' is the correct Coupon field name (not 'discountType')
                coupon: { select: { code: true, type: true, discountValue: true } },
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
            id: order.id,
            userId: order.userId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail ?? null,
            province: order.province ?? null,
            address: order.address,
            detailAddress: order.detailAddress ?? null,
            notes: order.notes ?? null,
            status: order.status,
            couponId: order.couponId ?? null,
            pointsUsed: order.pointsUsed,
            // ✅ Explicit Decimal serialization
            subtotalUsd: order.subtotalUsd.toString(),
            shippingFee: order.shippingFee.toString(),
            discountAmount: order.discountAmount.toString(),
            totalUsd: order.totalUsd.toString(),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            shipment: order.shipment ?? null,
            coupon: order.coupon ? {
                code: order.coupon.code,
                type: order.coupon.type,
                discountValue: order.coupon.discountValue.toString(),
            } : null,
            items: order.items.map(i => ({
                id: i.id,
                orderId: i.orderId,
                quantity: i.quantity,
                // ✅ BigInt serialization for all BigInt fields
                productId: i.productId.toString(),
                optionId: i.optionId?.toString() ?? null,
                variantId: i.variantId?.toString() ?? null,
                // ✅ Decimal serialization
                priceUsd: i.priceUsd.toString(),
                // Product info
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
