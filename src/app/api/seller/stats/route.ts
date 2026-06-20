import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { parseCommissionRate } from '@/lib/commission';

export const dynamic = 'force-dynamic';

// 주문 상태 라이프사이클 (결제 연동 후에도 동일 구조 유지):
//   PENDING=결제/결산 대기(미입금) → CONFIRMED=결제완료/출하대상 → SHIPPING → DELIVERED=정산기준
// 상품 출하 주체: supplierId IS NULL → 플랫폼(어드민), supplierId NOT NULL → 해당 셀러
// 추후 KHQR 결산 로직은 어드민의 PENDING→CONFIRMED 수동 전환 자리에 그대로 들어온다.

// GET /api/seller/stats
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({
        where: { userId: session.user.id },
        include: { products: { select: { id: true } } },
    });
    if (!supplier) return NextResponse.json({ error: 'No supplier profile' }, { status: 404 });

    const productIds = (supplier.products as { id: bigint }[]).map(p => p.id);

    // parseCommissionRate: Prisma Decimal → number 안전 변환 (commission.ts SSOT)
    const commissionRate = parseCommissionRate(supplier.commissionRate);

    // 최근 30일 기준점
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const [
        totalProducts,
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        totalOrders,
        awaitingPaymentOrders,
        readyToShipOrders,
        revenueItems,
    ] = await Promise.all([
        prisma.product.count({ where: { supplierId: supplier.id } }),
        prisma.product.count({ where: { supplierId: supplier.id, approvalStatus: 'PENDING' } }),
        prisma.product.count({ where: { supplierId: supplier.id, approvalStatus: 'APPROVED' } }),
        prisma.product.count({ where: { supplierId: supplier.id, approvalStatus: 'REJECTED' } }),
        prisma.order.count({
            where: { items: { some: { product: { supplierId: supplier.id } } } },
        }),
        // PENDING = 결제 대기 (미입금) — 출하 대상 아님
        productIds.length > 0
            ? prisma.order.count({
                where: {
                    status: 'PENDING',
                    items:  { some: { productId: { in: productIds } } },
                },
              })
            : Promise.resolve(0),
        // CONFIRMED = 결제 완료 → 출하 대상
        productIds.length > 0
            ? prisma.order.count({
                where: {
                    status: 'CONFIRMED',
                    items:  { some: { productId: { in: productIds } } },
                },
              })
            : Promise.resolve(0),
        // 최근 30일 DELIVERED 아이템 — 수익 계산용 (payouts/route.ts와 동일 로직)
        productIds.length > 0
            ? prisma.orderItem.findMany({
                where: {
                    productId: { in: productIds },
                    order:     { status: 'DELIVERED', createdAt: { gte: since30 } },
                },
                select: { priceUsd: true, quantity: true },
              })
            : Promise.resolve([]),
    ]);

    // 수익 계산 — payouts/route.ts와 완전 동일 로직
    const grossRevenue30d = (revenueItems as { priceUsd: unknown; quantity: unknown }[]).reduce(
        (s, item) => s + Number(item.priceUsd) * Number(item.quantity), 0
    );
    const commission30d = grossRevenue30d * (commissionRate / 100);
    const netPayout30d  = grossRevenue30d - commission30d;

    return NextResponse.json({
        totalProducts,
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        totalOrders,
        // 결제 대기 (PENDING) — 출하 대상 아님, 표시 전용
        awaitingPaymentOrders,
        // 출하 대상 (CONFIRMED) — 결제 완료
        readyToShipOrders,
        // 수익 요약 (최근 30일, DELIVERED 기준)
        grossRevenue30d,
        commission30d,
        netPayout30d,
        commissionRate,
    });
}
