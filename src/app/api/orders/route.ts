import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function POST(request: Request) {
    const session = await auth();
    // Allow guest checkout or require login based on business rule.
    // Assuming checkout requires login for Points & Coupons to work properly.
    if (!session?.user) {
        return NextResponse.json({ error: 'Login required for checkout' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            items, // { productId, optionId, quantity, priceUsd }[]
            customerName, customerPhone, customerEmail,
            address, detailAddress, notes,
            couponCode, pointsUsed
        } = body;

        const userId = session.user.id;

        // Verify User & Points
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const pts = parseInt(pointsUsed) || 0;
        if (pts > user.pointBalance) {
            return NextResponse.json({ error: 'Not enough points' }, { status: 400 });
        }

        // Calculate subtotal
        let subtotalUsd = 0;
        for (const item of items) {
            subtotalUsd += Number(item.priceUsd) * Number(item.quantity);
        }

        // Verify & Calculate Coupon
        let discountAmount = 0;
        let appliedCouponId = null;
        let shippingFee = 0; // Default shipping fee could be 0 or 5 etc.

        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
            if (!coupon || !coupon.isActive) {
                return NextResponse.json({ error: 'Invalid or inactive coupon' }, { status: 400 });
            }
            if (new Date() < coupon.startAt || new Date() > coupon.expireAt) {
                return NextResponse.json({ error: 'Coupon is expired or not yet active' }, { status: 400 });
            }
            if (Number(coupon.minOrderAmount) > subtotalUsd) {
                return NextResponse.json({ error: `Minimum order amount is $${coupon.minOrderAmount}` }, { status: 400 });
            }
            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
            }

            appliedCouponId = coupon.id;

            if (coupon.type === 'PERCENT') {
                discountAmount = subtotalUsd * (Number(coupon.discountValue) / 100);
            } else if (coupon.type === 'FIXED') {
                discountAmount = Number(coupon.discountValue);
            } else if (coupon.type === 'FREE_SHIPPING') {
                shippingFee = 0;
            }
        }

        // Calculate Total
        // Total = Subtotal + Shipping - Discount - Points (Assuming 1 point = 1 cent or $1. Let's assume 1 point = $1 for simplicity, or 100 points = $1. Let's assume 1 point = $0.01)
        // Adjust point logic according to requirements. Assuming 1 point = $1 USD.
        // Actually, usually points are tracked as integer representing cents or integer representing $1. Let's assume 1 point = $1 USD discount.
        const pointDiscountUsd = pts;

        let totalUsd = subtotalUsd + shippingFee - discountAmount - pointDiscountUsd;
        if (totalUsd < 0) totalUsd = 0;

        // Transaction for Order Creation + Stock Decrement + Point Deduction + Coupon Update
        const order = await prisma.$transaction(async (tx) => {
            // 1. Validate stock & decrement
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: BigInt(item.productId) },
                    select: { id: true, stockQty: true, sku: true }
                });
                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }
                const qty = Number(item.quantity);
                if (product.stockQty < qty) {
                    throw new Error(`Insufficient stock for SKU ${product.sku} (available: ${product.stockQty})`);
                }
                const newStock = product.stockQty - qty;
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stockQty: newStock,
                        // Auto-mark SOLDOUT when stock hits 0
                        ...(newStock === 0 ? { status: 'SOLDOUT' } : {}),
                    }
                });
                // Stock log entry
                await (tx as any).stockLog.create({
                    data: {
                        productId: product.id,
                        changeQty: -qty,
                        balanceAfter: newStock,
                        reason: 'SOLD',
                        memo: null,
                        orderId: null, // will be updated after order creation if needed
                        createdBy: session.user.email ?? null,
                    }
                });
            }

            // 2. Create Order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    customerName,
                    customerPhone,
                    customerEmail,
                    address,
                    detailAddress,
                    notes,
                    subtotalUsd,
                    shippingFee,
                    discountAmount,
                    pointsUsed: pts,
                    totalUsd,
                    couponId: appliedCouponId,
                    status: 'PENDING',
                    items: {
                        create: items.map((i: any) => ({
                            productId: BigInt(i.productId),
                            optionId: i.optionId ? BigInt(i.optionId) : null,
                            quantity: Number(i.quantity),
                            priceUsd: Number(i.priceUsd)
                        }))
                    }
                }
            });

            // 2. Deduct Points if used
            if (pts > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: { pointBalance: { decrement: pts } }
                });
                await tx.userPoint.create({
                    data: {
                        userId,
                        amount: -pts,
                        reason: `주문 결제 사용 (Order #${newOrder.id})`,
                        balanceAfter: user.pointBalance - pts,
                        orderId: newOrder.id
                    }
                });
            }

            // 3. Mark Coupon as used
            if (appliedCouponId) {
                await tx.coupon.update({
                    where: { id: appliedCouponId },
                    data: { usedCount: { increment: 1 } }
                });
                await tx.userCoupon.create({
                    data: {
                        userId,
                        couponId: appliedCouponId,
                        orderId: newOrder.id,
                        usedAt: new Date()
                    }
                });
            }

            // 4. Reward new points (e.g. 1% of final payment amount)
            // Example: totalUsd $100 -> reward 1 point.
            const rewardPoints = Math.floor(totalUsd * 0.01);
            if (rewardPoints > 0) {
                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: { pointBalance: { increment: rewardPoints } }
                });
                await tx.userPoint.create({
                    data: {
                        userId,
                        amount: rewardPoints,
                        reason: `주문 완료 적립 (Order #${newOrder.id})`,
                        balanceAfter: updatedUser.pointBalance,
                        orderId: newOrder.id
                    }
                });
            }

            return newOrder;
        });

        // Convert BigInts before returning
        return NextResponse.json({
            success: true,
            orderId: order.id
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
    }
}
