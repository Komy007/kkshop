import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                shipment: true,
                items: {
                    include: {
                        product: { select: { imageUrl: true, sku: true } }
                    }
                }
            }
        });

        // ✅ Explicit serialization for all BigInt and Decimal fields
        const safe = orders.map(o => ({
            id: o.id,
            userId: o.userId,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerEmail: o.customerEmail ?? null,
            province: o.province ?? null,
            address: o.address,
            detailAddress: o.detailAddress ?? null,
            notes: o.notes ?? null,
            status: o.status,
            couponId: o.couponId ?? null,
            pointsUsed: o.pointsUsed,
            // Decimal → string
            subtotalUsd: o.subtotalUsd.toString(),
            shippingFee: o.shippingFee.toString(),
            discountAmount: o.discountAmount.toString(),
            totalUsd: o.totalUsd.toString(),
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            shipment: o.shipment ?? null,
            items: o.items.map(i => ({
                id: i.id,
                orderId: i.orderId,
                quantity: i.quantity,
                // BigInt → string
                productId: i.productId.toString(),
                optionId: i.optionId?.toString() ?? null,
                variantId: i.variantId?.toString() ?? null,
                // Decimal → string
                priceUsd: i.priceUsd.toString(),
                // Product info
                imageUrl: i.product.imageUrl ?? null,
                sku: i.product.sku,
            })),
        }));

        return NextResponse.json(safe);
    } catch (error) {
        console.error('Failed to fetch user orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
