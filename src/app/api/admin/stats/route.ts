import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * 어드민 대시보드 통계 — DB COUNT/SUM 기반으로 정확한 숫자 반환
 *
 * 매출 집계 정책:
 *   현재 결제는 Mock(COD 방식)이라 PENDING 상태도 DB에 쌓임.
 *   "결제 완료" 기준 = CONFIRMED | SHIPPING | DELIVERED 만 매출로 집계.
 *   CANCELLED / REFUNDED / PENDING은 매출에서 제외.
 */
export async function GET() {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 날짜 기준점
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    type RevenueRow = { total: string; avg_val: string };

    const [
        totalProducts,
        activeProducts,
        newProductsCount,
        hotSaleCount,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippingOrders,
        deliveredOrders,
        totalMembers,
        totalSuppliers,
        pendingSuppliers,
        lowStockCount,
        soldOutCount,
        // ── 처리 대기 큐 ──────────────────────────────────────
        pendingQaCount,
        pendingReviewCount,
        pendingReturnCount,
        // ── 매출 KPI ─────────────────────────────────────────
        todayRevenueRows,
        monthRevenueRows,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.product.count({ where: { isNew: true, status: 'ACTIVE' } }),
        prisma.product.count({ where: { isHotSale: true, status: 'ACTIVE' } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'CONFIRMED' } }),
        prisma.order.count({ where: { status: 'SHIPPING' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.supplier.count(),
        prisma.supplier.count({ where: { status: 'PENDING' } }),
        prisma.$queryRaw<[{ count: number }]>`
            SELECT COUNT(*)::int AS count FROM "Product"
            WHERE status = 'ACTIVE' AND "stockQty" > 0 AND "stockQty" <= "stockAlertQty"
        `.then(r => Number(r[0]?.count ?? 0)).catch(() => 0),
        prisma.product.count({ where: { stockQty: 0 } }),
        // 미답변 Q&A (status = 'PENDING')
        prisma.productQA.count({ where: { status: 'PENDING' } }),
        // 승인 대기 리뷰 (status = 'PENDING')
        prisma.productReview.count({ where: { status: 'PENDING' } }),
        // 반품 요청 대기 (status = 'PENDING')
        prisma.returnRequest.count({ where: { status: 'PENDING' } }),
        // 오늘 매출 (결제 완료 기준)
        prisma.$queryRaw<RevenueRow[]>`
            SELECT
                COALESCE(SUM(total_usd), 0)::text AS total,
                '0' AS avg_val
            FROM orders
            WHERE status IN ('CONFIRMED', 'SHIPPING', 'DELIVERED')
              AND created_at >= ${todayStart}
        `.catch((): RevenueRow[] => [{ total: '0', avg_val: '0' }]),
        // 이번달 매출 + 평균 객단가
        prisma.$queryRaw<RevenueRow[]>`
            SELECT
                COALESCE(SUM(total_usd), 0)::text AS total,
                COALESCE(AVG(total_usd), 0)::text AS avg_val
            FROM orders
            WHERE status IN ('CONFIRMED', 'SHIPPING', 'DELIVERED')
              AND created_at >= ${monthStart}
        `.catch((): RevenueRow[] => [{ total: '0', avg_val: '0' }]),
    ]);

    const todayRevenue  = parseFloat((todayRevenueRows as RevenueRow[])[0]?.total  ?? '0');
    const monthRevenue  = parseFloat((monthRevenueRows  as RevenueRow[])[0]?.total  ?? '0');
    const avgOrderValue = parseFloat((monthRevenueRows  as RevenueRow[])[0]?.avg_val ?? '0');

    return NextResponse.json({
        // 기본 카운트
        totalProducts,
        activeProducts,
        newProductsCount,
        hotSaleCount,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippingOrders,
        deliveredOrders,
        totalMembers,
        totalSuppliers,
        pendingSuppliers,
        lowStockCount: typeof lowStockCount === 'number' ? lowStockCount : 0,
        soldOutCount,
        // 매출 KPI
        todayRevenue,
        monthRevenue,
        avgOrderValue,
        // 처리 대기 큐
        pendingQaCount,
        pendingReviewCount,
        pendingReturnCount,
    });
}
