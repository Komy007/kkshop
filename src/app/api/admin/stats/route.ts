import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * 어드민 대시보드 통계 — 클라이언트 측 .length 집계가 아닌 DB COUNT로 정확한 숫자 반환
 */
export async function GET() {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
        totalProducts,
        activeProducts,
        newProductsCount,
        hotSaleCount,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippingOrders,
        totalMembers,
        totalSuppliers,
        pendingSuppliers,
        lowStockCount,
        soldOutCount,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.product.count({ where: { isNew: true, status: 'ACTIVE' } }),
        prisma.product.count({ where: { isHotSale: true, status: 'ACTIVE' } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'CONFIRMED' } }),
        prisma.order.count({ where: { status: 'SHIPPING' } }),
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.supplier.count(),
        prisma.supplier.count({ where: { status: 'PENDING' } }),
        // 재고 경보: stockQty가 stockAlertQty 이하이고 0 초과
        // Prisma는 동일 테이블 컬럼 간 비교를 지원하지 않으므로 raw query 사용
        prisma.$queryRaw<[{ count: number }]>`
            SELECT COUNT(*)::int AS count FROM "Product"
            WHERE status = 'ACTIVE' AND "stockQty" > 0 AND "stockQty" <= "stockAlertQty"
        `.then(r => Number(r[0]?.count ?? 0)).catch(() => 0),
        prisma.product.count({ where: { stockQty: 0 } }),
    ]);

    return NextResponse.json({
        totalProducts,
        activeProducts,
        newProductsCount,
        hotSaleCount,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippingOrders,
        totalMembers,
        totalSuppliers,
        pendingSuppliers,
        lowStockCount: typeof lowStockCount === 'number' ? lowStockCount : 0,
        soldOutCount,
    });
}
