import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { sendEmail, sendLowStockAlert } from '@/lib/mail';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { CreateOrderSchema } from '@/lib/validators';

/** HTML-escape user input to prevent XSS in email templates */
function escHtml(s: string | null | undefined): string {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

export async function POST(request: Request) {
    // --- Rate Limiting (IP당 분당 10회) ---
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'orders', 10, 60_000);
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Login required for checkout' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // --- Zod 입력 검증 ---
        const parsed = CreateOrderSchema.safeParse(body);
        if (!parsed.success) {
            const msg = parsed.error.errors[0]?.message ?? '주문 정보가 올바르지 않습니다.';
            return NextResponse.json({ error: msg }, { status: 400 });
        }
        const {
            items,
            customerName, customerPhone, customerEmail,
            province, address, detailAddress, notes,
            couponCode, pointsUsed,
        } = parsed.data;

        const userId = session.user.id;

        // Verify User & Points + DB에서 포인트 적립률 조회
        const [user, pointsSetting] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.siteSetting.findUnique({ where: { key: 'points_rate' } }),
        ]);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // points_rate: { earnRate: 0.01, ... } 형식 — 기본값 1%
        const pointsConfig = (pointsSetting?.value as any) ?? {};
        const earnRate: number = typeof pointsConfig.earnRate === 'number'
            ? Math.min(Math.max(pointsConfig.earnRate, 0), 0.5) // 0~50% 범위 클램프
            : 0.01;

        const pts = parseInt(pointsUsed) || 0;
        if (pts > 0 && pts > user.pointBalance) {
            return NextResponse.json({ error: 'Not enough points' }, { status: 400 });
        }

        // ── 서버측 가격 검증: DB 가격으로 강제 대체 (클라이언트 가격 조작 방지) ──
        const uniqueProductIds = [...new Set(items.map(i => i.productId))];
        const dbProducts = await prisma.product.findMany({
            where: { id: { in: uniqueProductIds.map(pid => BigInt(pid)) } },
            select: { id: true, priceUsd: true, hotSalePrice: true, isHotSale: true, status: true },
        });
        const productPriceMap = new Map(dbProducts.map(p => [p.id.toString(), p]));

        // 바리에이션이 있는 아이템의 가격도 조회
        const variantItemIds = items.filter(i => i.variantId).map(i => BigInt(i.variantId!));
        const dbVariants = variantItemIds.length > 0
            ? await prisma.productVariant.findMany({
                where: { id: { in: variantItemIds } },
                select: { id: true, priceUsd: true },
            })
            : [];
        const variantPriceMap = new Map(dbVariants.map(v => [v.id.toString(), v]));

        // 각 아이템에 대해 DB 가격으로 검증 및 서버 가격 적용
        const verifiedItems: Array<typeof items[0] & { priceUsd: number }> = [];
        let subtotalUsd = 0;
        for (const item of items) {
            const dbProduct = productPriceMap.get(item.productId);
            if (!dbProduct) {
                return NextResponse.json({ error: `상품을 찾을 수 없습니다 (ID: ${item.productId})` }, { status: 400 });
            }
            if (dbProduct.status !== 'ACTIVE') {
                return NextResponse.json({ error: `현재 판매 중이 아닌 상품이 포함되어 있습니다.` }, { status: 400 });
            }

            // 서버측 단가 결정: 바리에이션 > 핫세일 > 정가 우선순위
            let serverPrice: number;
            if (item.variantId) {
                const variant = variantPriceMap.get(item.variantId);
                serverPrice = variant?.priceUsd ? Number(variant.priceUsd) : Number(dbProduct.priceUsd);
            } else if (dbProduct.isHotSale && dbProduct.hotSalePrice) {
                serverPrice = Number(dbProduct.hotSalePrice);
            } else {
                serverPrice = Number(dbProduct.priceUsd);
            }

            verifiedItems.push({ ...item, priceUsd: serverPrice });
            subtotalUsd += serverPrice * Number(item.quantity);
        }

        // ── Bulk Discount (ProductOption) 적용 ──
        // 각 상품의 수량별 할인 옵션을 조회하여 적용
        const productOptionsMap = new Map<string, { minQty: number; maxQty: number | null; discountPct: number; freeShipping: boolean }[]>();
        const productIdsForOptions = [...new Set(verifiedItems.map(i => i.productId))];
        if (productIdsForOptions.length > 0) {
            const allOptions = await prisma.productOption.findMany({
                where: { productId: { in: productIdsForOptions.map(pid => BigInt(pid)) } },
                select: { productId: true, minQty: true, maxQty: true, discountPct: true, freeShipping: true },
                orderBy: { minQty: 'desc' }, // 높은 수량부터 매칭
            });
            for (const opt of allOptions) {
                const pid = opt.productId.toString();
                if (!productOptionsMap.has(pid)) productOptionsMap.set(pid, []);
                productOptionsMap.get(pid)!.push({
                    minQty: opt.minQty,
                    maxQty: opt.maxQty,
                    discountPct: Number(opt.discountPct),
                    freeShipping: opt.freeShipping,
                });
            }
        }

        // 수량별 할인 적용하여 subtotal 재계산
        let bulkFreeShipping = false;
        subtotalUsd = 0;
        for (const item of verifiedItems) {
            const qty = Number(item.quantity);
            const opts = productOptionsMap.get(item.productId) || [];
            // 수량에 맞는 최적 할인 옵션 찾기 (내림차순이므로 첫 매칭이 최대 할인)
            const matchedOpt = opts.find(o => qty >= o.minQty && (o.maxQty === null || qty <= o.maxQty));
            if (matchedOpt && matchedOpt.discountPct > 0) {
                const discounted = item.priceUsd * (1 - matchedOpt.discountPct / 100);
                subtotalUsd += Math.round(discounted * qty * 100) / 100;
            } else {
                subtotalUsd += item.priceUsd * qty;
            }
            if (matchedOpt?.freeShipping) bulkFreeShipping = true;
        }

        // Verify & Calculate Coupon
        let discountAmount = 0;
        let appliedCouponId = null;
        let appliedCouponMaxUses: number | null = null;

        // Look up shipping fee from DB by province (server-side, tamper-proof)
        let shippingFee = 0;
        if (province) {
            const provinceRecord = await prisma.shippingProvince.findFirst({
                where: { nameEn: { equals: province, mode: 'insensitive' } },
                select: { shippingFee: true },
            });
            if (provinceRecord) {
                shippingFee = bulkFreeShipping ? 0 : Number(provinceRecord.shippingFee);
            } else {
                // Province name not found in DB — reject to prevent $0 shipping
                return NextResponse.json({ error: 'Invalid province selected. Please refresh and select again.' }, { status: 400 });
            }
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

            // CRITICAL: per-user coupon reuse prevention
            const alreadyUsed = await prisma.userCoupon.findFirst({
                where: { userId, couponId: coupon.id },
            });
            if (alreadyUsed) {
                return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
            }

            appliedCouponId = coupon.id;
            appliedCouponMaxUses = coupon.maxUses ?? null;

            if (coupon.type === 'PERCENT') {
                // Cap percent discount to subtotal, rounded to 2 decimal places
                const raw = subtotalUsd * (Number(coupon.discountValue) / 100);
                discountAmount = Math.round(Math.min(raw, subtotalUsd) * 100) / 100;
            } else if (coupon.type === 'FIXED') {
                // CRITICAL: cap fixed discount to subtotal — prevents negative totals
                discountAmount = Math.min(Math.round(Number(coupon.discountValue) * 100) / 100, subtotalUsd);
            } else if (coupon.type === 'FREE_SHIPPING') {
                shippingFee = 0;
            }
        }

        // Calculate Total
        // CRITICAL: cap points to max useful amount — cannot redeem more than the remaining total
        const maxUsablePoints = Math.max(0, Math.round(subtotalUsd + shippingFee - discountAmount));
        const effectivePts = Math.min(pts, maxUsablePoints);

        const totalUsd = Math.max(0, subtotalUsd + shippingFee - discountAmount - effectivePts);

        // Transaction for Order Creation + Stock Decrement + Point Deduction + Coupon Update
        const order = await prisma.$transaction(async (tx) => {
            // 1. Create Order first (so we have orderId for StockLog audit trail)
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
                    pointsUsed: effectivePts,
                    totalUsd,
                    couponId: appliedCouponId,
                    status: 'PENDING',
                    paymentMethod: 'COD',    // Phase 7에서 ABA/KHQR로 교체
                    paymentStatus: 'PENDING',
                    items: {
                        create: verifiedItems.map((i: any) => ({
                            productId: BigInt(i.productId),
                            optionId: i.optionId ? BigInt(i.optionId) : null,
                            variantId: i.variantId ? BigInt(i.variantId) : null,
                            quantity: Number(i.quantity),
                            priceUsd: Number(i.priceUsd)
                        }))
                    }
                }
            });

            // 2. Validate stock & decrement (orderId 연결 가능)
            for (const item of verifiedItems) {
                const qty = Number(item.quantity);

                if (item.variantId) {
                    // --- Variant stock path ---
                    const variant = await tx.productVariant.findUnique({
                        where: { id: BigInt(item.variantId) },
                        select: { id: true, sku: true, productId: true }
                    });
                    if (!variant) {
                        throw new Error(`Variant ${item.variantId} not found`);
                    }
                    // Atomic: decrement only if stockQty >= qty (race condition safe)
                    const variantUpdate = await tx.productVariant.updateMany({
                        where: { id: variant.id, stockQty: { gte: qty } },
                        data: { stockQty: { decrement: qty } }
                    });
                    if (variantUpdate.count === 0) {
                        throw new Error(`Insufficient stock for variant SKU ${variant.sku ?? item.variantId}`);
                    }
                    // Also deduct parent product stock atomically
                    const product = await tx.product.findUnique({
                        where: { id: variant.productId },
                        select: { id: true, sku: true }
                    });
                    if (!product) {
                        throw new Error(`Product for variant ${item.variantId} not found`);
                    }
                    const productVarUpdate = await tx.product.updateMany({
                        where: { id: product.id, stockQty: { gte: qty } },
                        data: { stockQty: { decrement: qty } }
                    });
                    if (productVarUpdate.count === 0) {
                        throw new Error(`Insufficient product stock for SKU ${product.sku}`);
                    }
                    const updatedVarProduct = await tx.product.findUnique({
                        where: { id: product.id }, select: { stockQty: true }
                    });
                    if (updatedVarProduct?.stockQty === 0) {
                        await tx.product.update({ where: { id: product.id }, data: { status: 'SOLDOUT' } });
                    }
                    await (tx as any).stockLog.create({
                        data: {
                            productId: product.id,
                            changeQty: -qty,
                            balanceAfter: updatedVarProduct?.stockQty ?? 0,
                            reason: 'SOLD',
                            memo: `Variant ID: ${variant.id}`,
                            orderId: newOrder.id,
                            createdBy: session.user.email ?? null,
                        }
                    });
                } else {
                    // --- Product-level stock path (no variant) ---
                    const product = await tx.product.findUnique({
                        where: { id: BigInt(item.productId) },
                        select: { id: true, sku: true }
                    });
                    if (!product) {
                        throw new Error(`Product ${item.productId} not found`);
                    }
                    const productUpdate = await tx.product.updateMany({
                        where: { id: product.id, stockQty: { gte: qty } },
                        data: { stockQty: { decrement: qty } }
                    });
                    if (productUpdate.count === 0) {
                        throw new Error(`Insufficient stock for SKU ${product.sku}`);
                    }
                    const updatedProduct = await tx.product.findUnique({
                        where: { id: product.id }, select: { stockQty: true }
                    });
                    if (updatedProduct?.stockQty === 0) {
                        await tx.product.update({ where: { id: product.id }, data: { status: 'SOLDOUT' } });
                    }
                    await (tx as any).stockLog.create({
                        data: {
                            productId: product.id,
                            changeQty: -qty,
                            balanceAfter: updatedProduct?.stockQty ?? 0,
                            reason: 'SOLD',
                            memo: null,
                            orderId: newOrder.id,
                            createdBy: session.user.email ?? null,
                        }
                    });
                }
            }

            // 3. Deduct Points if used (atomic decrement + negative balance guard)
            if (effectivePts > 0) {
                const afterDeduct = await tx.user.update({
                    where: { id: userId },
                    data: { pointBalance: { decrement: effectivePts } }
                });
                // Race condition guard: if concurrent orders depleted points, rollback
                if (afterDeduct.pointBalance < 0) {
                    throw new Error('Insufficient points (concurrent deduction detected)');
                }
                await tx.userPoint.create({
                    data: {
                        userId,
                        amount: -effectivePts,
                        reason: `주문 결제 사용 (Order #${newOrder.id})`,
                        balanceAfter: afterDeduct.pointBalance,
                        orderId: newOrder.id
                    }
                });
            }

            // 4. Mark Coupon as used (atomic: guard against concurrent reuse)
            if (appliedCouponId) {
                if (appliedCouponMaxUses !== null) {
                    // Atomic increment only if still below the limit
                    const couponUpdate = await tx.coupon.updateMany({
                        where: { id: appliedCouponId, usedCount: { lt: appliedCouponMaxUses } },
                        data: { usedCount: { increment: 1 } }
                    });
                    if (couponUpdate.count === 0) throw new Error('Coupon usage limit reached');
                } else {
                    await tx.coupon.update({
                        where: { id: appliedCouponId },
                        data: { usedCount: { increment: 1 } }
                    });
                }
                await tx.userCoupon.create({
                    data: {
                        userId,
                        couponId: appliedCouponId,
                        orderId: newOrder.id,
                        usedAt: new Date()
                    }
                });
            }

            // 5. Reward new points (DB 설정 적립률 적용 — 기본 1%)
            const rewardPoints = Math.floor(totalUsd * earnRate);
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
            const orderedProductIds = verifiedItems.map((i: any) => BigInt(i.productId));
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

                // Escape all user-supplied strings before embedding in HTML (XSS prevention)
                const safeName = escHtml(customerName);
                const safeEmail = escHtml(customerEmail);
                const safePhone = escHtml(customerPhone);
                const safeAddress = escHtml(address);
                const safeDetail = escHtml(detailAddress);
                const safeNotes = escHtml(notes);

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
                                <h2 style="color:#333;margin-top:0;">Hello, ${safeName}!</h2>
                                <p style="color:#555;">Thank you for shopping at KKShop. We have received your order and will process it shortly.</p>
                                <div style="background:#fff0f8;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #f9a8d4;">
                                    <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
                                    <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#e91e8c;">#${shortId}</p>
                                </div>
                                ${orderSummaryHtml}
                                <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;">
                                    <p style="margin:0 0 6px;font-weight:bold;color:#333;">Delivery Address</p>
                                    <p style="margin:0;color:#555;">${safeAddress}${safeDetail ? ', ' + safeDetail : ''}</p>
                                </div>
                                <p style="color:#999;font-size:13px;margin-top:24px;">Questions? Contact us at <a href="https://kkshop.cc" style="color:#e91e8c;">kkshop.cc</a></p>
                            </div>
                            <div style="background:#f5f5f5;padding:12px;text-align:center;">
                                <p style="color:#bbb;font-size:11px;margin:0;">© ${new Date().getFullYear()} KKShop · Cambodia K-Beauty</p>
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
                                    <p style="margin:0 0 6px;"><strong>Order:</strong> #${shortId}</p>
                                    <p style="margin:0 0 6px;"><strong>Customer:</strong> ${safeName}</p>
                                    <p style="margin:0 0 6px;"><strong>Email:</strong> ${safeEmail}</p>
                                    <p style="margin:0 0 6px;"><strong>Phone:</strong> ${safePhone}</p>
                                    <p style="margin:0 0 6px;"><strong>Address:</strong> ${safeAddress}${safeDetail ? ', ' + safeDetail : ''}</p>
                                    ${safeNotes ? `<p style="margin:0 0 6px;"><strong>Notes:</strong> ${safeNotes}</p>` : ''}
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
