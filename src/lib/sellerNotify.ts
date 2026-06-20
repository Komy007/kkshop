import { prisma } from '@/lib/api';
import { parseCommissionRate } from '@/lib/commission';
import { sendSellerOrderEmail } from '@/lib/mail';


/**
 * 주문이 CONFIRMED(결제완료) 전환 시 셀러 상품이 포함된 공급사들에게 알림 + 이메일 발송.
 * - supplierId=null 자체상품은 완전히 무시.
 * - 한 주문에 여러 공급사가 있으면 각자에게 독립적으로 1건씩.
 * - @@unique([orderId, supplierId, type]) upsert로 중복 발송 방지(멱등).
 * - 전체 try/catch — 알림 실패가 주문 처리를 깨면 안 됨.
 *
 * KHQR 웹훅 연동 시: 결산 완료 콜백에서 이 함수를 await 없이 .catch()로 호출하면 됨.
 */
export async function notifySuppliersOfOrder(orderId: string): Promise<void> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                supplierId: true,
                                supplier: {
                                    select: {
                                        id:             true,
                                        companyName:    true,
                                        contactEmail:   true,
                                        commissionRate: true,
                                    },
                                },
                                translations: {
                                    where:  { langCode: 'en' },
                                    select: { name: true },
                                    take:   1,
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!order) return;

        // 공급사별 아이템 그룹핑
        type SupplierGroup = {
            supplier: { id: string; companyName: string; contactEmail: string; commissionRate: unknown };
            items:    { productName: string; qty: number; priceUsd: number }[];
        };
        const bySupplier = new Map<string, SupplierGroup>();

        for (const item of order.items) {
            const { product } = item;
            if (!product?.supplier || !product.supplierId) continue; // 자체상품 제외

            const sid = product.supplier.id;
            if (!bySupplier.has(sid)) {
                bySupplier.set(sid, { supplier: product.supplier, items: [] });
            }
            bySupplier.get(sid)!.items.push({
                productName: (product.translations as { name: string }[])[0]?.name ?? 'Product',
                qty:         Number(item.quantity),
                priceUsd:    Number(item.priceUsd),
            });
        }

        for (const [, group] of bySupplier) {
            const { supplier, items } = group;
            const commissionRate = parseCommissionRate(supplier.commissionRate);
            const amountUsd      = items.reduce((s, i) => s + i.priceUsd * i.qty, 0);
            const shortId        = orderId.slice(0, 8).toUpperCase();

            // @@unique upsert — 이미 있으면 update: {} (no-op), 없으면 create
            const notif = await prisma.sellerNotification.upsert({
                where: {
                    orderId_supplierId_type: {
                        orderId,
                        supplierId: supplier.id,
                        type:       'NEW_ORDER',
                    },
                },
                update: {}, // 중복 발송 방지 — 기존 레코드는 건드리지 않음
                create: {
                    supplierId:  supplier.id,
                    orderId,
                    type:        'NEW_ORDER',
                    title:       `New Order #${shortId} — Payment Confirmed · 주문 확정`,
                    body:        `Order #${shortId} has been paid and confirmed. ${items.length} product type(s) from your store. Amount: $${amountUsd.toFixed(2)}. Please prepare for shipment. 결제 완료 — 출하 준비해 주세요.`,
                    itemsJson:   items,
                    amountUsd,
                },
            });

            // emailSent=false인 경우만 발송 (새로 생성 or 아직 미발송)
            if (!notif.emailSent) {
                try {
                    await sendSellerOrderEmail(
                        supplier.contactEmail,
                        supplier.companyName,
                        { orderId, items, amountUsd, commissionRate }
                    );
                    await prisma.sellerNotification.update({
                        where: { id: notif.id },
                        data:  { emailSent: true },
                    });
                } catch (emailErr) {
                    console.error(`Seller order email failed (${supplier.contactEmail}):`, emailErr);
                }
            }
        }
    } catch (e) {
        // 알림 실패가 주문 처리를 깨면 안 됨 — 여기서 삼킴
        console.error('notifySuppliersOfOrder failed (non-critical):', e);
    }
}
