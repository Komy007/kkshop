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

// ── PATCH: Cancel order (user can only cancel PENDING orders) ─────────────
export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const body = await req.json();
        const { action } = body;

        if (action !== 'cancel') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Fetch order and verify ownership
        const order = await prisma.order.findFirst({
            where: { id, userId: session.user.id },
            include: {
                items: {
                    select: { productId: true, variantId: true, quantity: true }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Only PENDING orders can be cancelled by the customer
        if (order.status !== 'PENDING') {
            return NextResponse.json({
                error: `주문 취소는 PENDING 상태일 때만 가능합니다. 현재 상태: ${order.status}`
            }, { status: 409 });
        }

        // Transaction: cancel order + restore stock + refund points/coupon
        await prisma.$transaction(async (tx) => {
            // 1. Update order status to CANCELLED
            await tx.order.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });

            // 2. Restore stock for each item
            for (const item of order.items) {
                if (item.variantId) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stockQty: { increment: item.quantity } }
                    });
                }
                // Always restore product-level stock
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, status: true, stockQty: true }
                });
                if (product) {
                    await tx.product.update({
                        where: { id: product.id },
                        data: {
                            stockQty: { increment: item.quantity },
                            // Reactivate if was soldout
                            ...(product.status === 'SOLDOUT' ? { status: 'ACTIVE' } : {}),
                        }
                    });
                }
            }

            // 3. Refund points if used
            if (order.pointsUsed > 0) {
                const updatedUser = await tx.user.update({
                    where: { id: session.user!.id },
                    data: { pointBalance: { increment: order.pointsUsed } }
                });
                await tx.userPoint.create({
                    data: {
                        userId: session.user!.id,
                        amount: order.pointsUsed,
                        reason: `주문 취소 환불 (Order #${id.slice(0, 8).toUpperCase()})`,
                        balanceAfter: updatedUser.pointBalance,
                        orderId: id,
                    }
                });
            }

            // 4. Refund coupon usage (decrement usedCount, delete UserCoupon record)
            if (order.couponId) {
                await tx.coupon.update({
                    where: { id: order.couponId },
                    data: { usedCount: { decrement: 1 } }
                });
                await tx.userCoupon.deleteMany({
                    where: { orderId: id, userId: session.user!.id }
                });
            }
        });

        return NextResponse.json({ success: true, message: '주문이 취소되었습니다.' });

    } catch (error) {
        console.error('Failed to cancel order:', error);
        return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
}
