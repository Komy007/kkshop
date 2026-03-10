import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { sendEmail, sendLowStockAlert } from '@/lib/mail';

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
            items, // { productId, optionId, variantId?, quantity, priceUsd }[]
            customerName, customerPhone, customerEmail,
            province, address, detailAddress, notes,
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

        // Look up shipping fee from DB by province (server-side, tamper-proof)
        let shippingFee = 0;
        if (province) {
            const provinceRecord = await prisma.shippingProvince.findFirst({
                where: { nameEn: province },
                select: { shippingFee: true },
            });
            if (provinceRecord) shippingFee = Number(provinceRecord.shippingFee);
        }

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
        // Total = Subtotal + Shipping - Discount - Points (1 point = $1 USD discount)
        const pointDiscountUsd = pts;

        let totalUsd = subtotalUsd + shippingFee - discountAmount - pointDiscountUsd;
        if (totalUsd < 0) totalUsd = 0;

        // Transaction for Order Creation + Stock Decrement + Point Deduction + Coupon Update
        const order = await prisma.$transaction(async (tx) => {
            // 1. Validate stock & decrement
            for (const item of items) {
                const qty = Number(item.quantity);

                if (item.variantId) {
                    // --- Variant stock path ---
                    const variant = await tx.productVariant.findUnique({
                        where: { id: BigInt(item.variantId) },
                        select: { id: true, stockQty: true, sku: true, productId: true }
                    });
                    if (!variant) {
                        throw new Error(`Variant ${item.variantId} not found`);
                    }
                    if (variant.stockQty < qty) {
                        throw new Error(`Insufficient stock for variant SKU ${variant.sku ?? item.variantId} (available: ${variant.stockQty})`);
                    }
                    // Deduct variant stock
                    await tx.productVariant.update({
                        where: { id: variant.id },
                        data: { stockQty: { decrement: qty } }
                    });
                    // Also deduct parent product stock
                    const product = await tx.product.findUnique({
                        where: { id: variant.productId },
                        select: { id: true, stockQty: true, sku: true }
                    });
                    if (!product) {
                        throw new Error(`Product for variant ${item.variantId} not found`);
                    }
                    if (product.stockQty < qty) {
                        throw new Error(`Insufficient product stock for SKU ${product.sku} (available: ${product.stockQty})`);
                    }
                    const newProductStock = product.stockQty - qty;
                    await tx.product.update({
                        where: { id: product.id },
                        data: {
                            stockQty: newProductStock,
                            ...(newProductStock === 0 ? { status: 'SOLDOUT' } : {}),
                        }
                    });
                    await (tx as any).stockLog.create({
                        data: {
                            productId: product.id,
                            changeQty: -qty,
                            balanceAfter: newProductStock,
                            reason: 'SOLD',
                            memo: `Variant ID: ${variant.id}`,
                            orderId: null,
                            createdBy: session.user.email ?? null,
                        }
                    });
                } else {
                    // --- Product-level stock path (no variant) ---
                    const product = await tx.product.findUnique({
                        where: { id: BigInt(item.productId) },
                        select: { id: true, stockQty: true, sku: true }
                    });
                    if (!product) {
                        throw new Error(`Product ${item.productId} not found`);
                    }
                    if (product.stockQty < qty) {
                        throw new Error(`Insufficient stock for SKU ${product.sku} (available: ${product.stockQty})`);
                    }
                    const newStock = product.stockQty - qty;
                    await tx.product.update({
                        where: { id: product.id },
                        data: {
                            stockQty: newStock,
                            ...(newStock === 0 ? { status: 'SOLDOUT' } : {}),
                        }
                    });
                    await (tx as any).stockLog.create({
                        data: {
                            productId: product.id,
                            changeQty: -qty,
                            balanceAfter: newStock,
                            reason: 'SOLD',
                            memo: null,
                            orderId: null,
                            createdBy: session.user.email ?? null,
                        }
                    });
                }
            }

            // 2. Create Order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    customerName,
                    customerPhone,
                    customerEmail,
                    province: province ?? null,
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
                            variantId: i.variantId ? BigInt(i.variantId) : null,
                            quantity: Number(i.quantity),
                            priceUsd: Number(i.priceUsd)
                        }))
                    }
                }
            });

            // 3. Deduct Points if used
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

            // 4. Mark Coupon as used
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

            // 5. Reward new points (1% of final payment amount)
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

        // ── Post-transaction: check for low stock and send alert ──
        try {
            const orderedProductIds = items.map((i: any) => BigInt(i.productId));
            const productsToCheck = await prisma.product.findMany({
                where: { id: { in: orderedProductIds } },
                select: {
                    id: true,
                    sku: true,
                    stockQty: true,
                    stockAlertQty: true,
                    translations: {
                        where: { langCode: 'en' },
                        select: { name: true }
                    }
                }
            });

            const lowStockProducts = productsToCheck
                .filter(p => p.stockQty <= p.stockAlertQty)
                .map(p => ({
                    sku: p.sku,
                    name: p.translations[0]?.name ?? p.sku,
                    stockQty: p.stockQty,
                    alertQty: p.stockAlertQty,
                }));

            if (lowStockProducts.length > 0) {
                // Non-blocking — do not await
                sendLowStockAlert(lowStockProducts).catch(err =>
                    console.error('Low stock alert email failed (non-critical):', err)
                );
            }
        } catch (stockCheckErr) {
            // Stock check failure is non-critical — order is already created
            console.error('Post-order low stock check failed (non-critical):', stockCheckErr);
        }

        // ── Send confirmation emails (non-blocking: failure won't break order) ──
        try {
            const orderDetail = await prisma.order.findUnique({
                where: { id: order.id },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    translations: { where: { langCode: 'en' }, select: { name: true } },
                                },
                                select: { id: true, sku: true, translations: true },
                            },
                        },
                    },
                },
            });

            if (orderDetail) {
                const itemsHtml = orderDetail.items.map(item => {
                    const pName = (item.product as any)?.translations?.[0]?.name ?? (item.product as any)?.sku ?? 'Unknown';
                    return `<tr>
                        <td style="padding:8px;border-bottom:1px solid #eee;">${pName}</td>
                        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
                        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.priceUsd).toFixed(2)}</td>
                    </tr>`;
                }).join('');

                const discountRow = Number(orderDetail.discountAmount) > 0
                    ? `<tr><td style="padding:4px;color:#e53e3e;">Coupon Discount</td><td style="padding:4px;text-align:right;color:#e53e3e;">-$${Number(orderDetail.discountAmount).toFixed(2)}</td></tr>` : '';
                const pointsRow = orderDetail.pointsUsed > 0
                    ? `<tr><td style="padding:4px;color:#e53e3e;">Points Used</td><td style="padding:4px;text-align:right;color:#e53e3e;">-$${orderDetail.pointsUsed}.00</td></tr>` : '';

                const orderSummaryHtml = `
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                        <thead><tr style="background:#f5f5f5;">
                            <th style="padding:8px;text-align:left;">Product</th>
                            <th style="padding:8px;text-align:center;">Qty</th>
                            <th style="padding:8px;text-align:right;">Price</th>
                        </tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="padding:4px;">Subtotal</td><td style="padding:4px;text-align:right;">$${Number(orderDetail.subtotalUsd).toFixed(2)}</td></tr>
                        ${discountRow}${pointsRow}
                        <tr style="font-weight:bold;border-top:2px solid #333;">
                            <td style="padding:8px;">Total</td>
                            <td style="padding:8px;text-align:right;">$${Number(orderDetail.totalUsd).toFixed(2)}</td>
                        </tr>
                    </table>`;

                const shortId = order.id.slice(0, 8).toUpperCase();

                // 1. Customer confirmation email
                if (customerEmail) {
                    await sendEmail({
                        to: customerEmail,
                        subject: `[KKShop] Order Confirmed #${shortId}`,
                        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                            <div style="background:#e91e8c;padding:24px;text-align:center;">
                                <h1 style="color:white;margin:0;font-size:24px;">KKShop</h1>
                                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Your Order is Confirmed!</p>
                            </div>
                            <div style="padding:24px;background:#fff;">
                                <h2 style="color:#333;margin-top:0;">Hello, ${customerName}!</h2>
                                <p style="color:#555;">Thank you for shopping at KKShop. We have received your order and will process it shortly.</p>
                                <div style="background:#fff0f8;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #f9a8d4;">
                                    <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
                                    <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#e91e8c;">#${shortId}</p>
                                </div>
                                ${orderSummaryHtml}
                                <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;">
                                    <p style="margin:0 0 6px;font-weight:bold;color:#333;">Delivery Address</p>
                                    <p style="margin:0;color:#555;">${address}${detailAddress ? ', ' + detailAddress : ''}</p>
                                </div>
                                <p style="color:#999;font-size:13px;margin-top:24px;">Questions? Contact us at <a href="https://kkshop.cc" style="color:#e91e8c;">kkshop.cc</a></p>
                            </div>
                            <div style="background:#f5f5f5;padding:12px;text-align:center;">
                                <p style="color:#bbb;font-size:11px;margin:0;">© 2025 KKShop · Cambodia K-Beauty</p>
                            </div>
                        </div>`,
                    });
                }

                // 2. Admin notification email
                const smtpSetting = await prisma.siteSetting.findUnique({ where: { key: 'email_smtp_settings' } });
                const adminEmail = smtpSetting?.value
                    ? ((smtpSetting.value as any).fromEmail ?? (smtpSetting.value as any).user ?? null)
                    : null;

                if (adminEmail) {
                    await sendEmail({
                        to: adminEmail,
                        subject: `[KKShop Admin] New Order #${shortId} — $${Number(orderDetail.totalUsd).toFixed(2)}`,
                        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                            <div style="background:#1a1a2e;padding:20px;text-align:center;">
                                <h1 style="color:white;margin:0;font-size:20px;">New Order Received</h1>
                            </div>
                            <div style="padding:24px;background:#fff;">
                                <div style="background:#f0f9ff;padding:16px;border-radius:8px;border-left:4px solid #0ea5e9;margin-bottom:20px;">
                                    <p style="margin:0 0 6px;"><strong>Order:</strong> #${order.id}</p>
                                    <p style="margin:0 0 6px;"><strong>Customer:</strong> ${customerName}</p>
                                    <p style="margin:0 0 6px;"><strong>Email:</strong> ${customerEmail}</p>
                                    <p style="margin:0 0 6px;"><strong>Phone:</strong> ${customerPhone}</p>
                                    <p style="margin:0 0 6px;"><strong>Address:</strong> ${address}${detailAddress ? ', ' + detailAddress : ''}</p>
                                    ${notes ? `<p style="margin:0 0 6px;"><strong>Notes:</strong> ${notes}</p>` : ''}
                                    <p style="margin:0;font-size:18px;font-weight:bold;color:#0ea5e9;"><strong>Total: $${Number(orderDetail.totalUsd).toFixed(2)}</strong></p>
                                </div>
                                ${orderSummaryHtml}
                                <a href="https://kkshop.cc/admin/orders"
                                   style="display:inline-block;background:#e91e8c;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:8px;">
                                    View in Admin Panel →
                                </a>
                            </div>
                        </div>`,
                    });
                }
            }
        } catch (emailErr) {
            // Email failure is non-critical — order is already created
            console.error('Order email send failed (non-critical):', emailErr);
        }

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
