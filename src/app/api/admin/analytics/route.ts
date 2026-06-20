export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

function isAdminOrSuperAdmin(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

function parsePeriodDays(period: string | null): number {
  switch (period) {
    case '7d':
      return 7;
    case '90d':
      return 90;
    case '30d':
    default:
      return 30;
  }
}

// GET /api/admin/analytics?period=30d
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminOrSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period');
    const days = parsePeriodDays(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 직전 동일 기간 (이전 기간 비교용)
    const prevEndDate   = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    prevStartDate.setHours(0, 0, 0, 0);

    const excludedStatuses = ['CANCELLED', 'REFUNDED'];

    // -----------------------------------------------------------------------
    // 1. Revenue by day (raw SQL for date truncation)
    // -----------------------------------------------------------------------
    type RevenueRow = {
      date: Date;
      revenue: string;
      order_count: bigint;
    };

    const revenueRows = await prisma.$queryRaw<RevenueRow[]>`
      SELECT
        DATE_TRUNC('day', created_at) AS date,
        SUM(total_usd)::text           AS revenue,
        COUNT(*)                       AS order_count
      FROM orders
      WHERE
        status NOT IN (${excludedStatuses[0]}, ${excludedStatuses[1]})
        AND created_at >= ${startDate}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `;

    const dailyRevenue = revenueRows.map((row) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      revenue: parseFloat(row.revenue ?? '0'),
      orders: Number(row.order_count),
    }));

    // -----------------------------------------------------------------------
    // 2. Top products by revenue (raw SQL for aggregated join)
    // -----------------------------------------------------------------------
    type TopProductRow = {
      product_id: bigint;
      total_qty: bigint;
      total_revenue: string;
      name: string | null;
      image_url: string | null;
    };

    const topProductRows = await prisma.$queryRaw<TopProductRow[]>`
      SELECT
        oi.product_id,
        SUM(oi.quantity)                AS total_qty,
        SUM(oi.quantity * oi.price_usd)::text AS total_revenue,
        pt.name,
        (
          SELECT url FROM product_images pi2
          WHERE pi2.product_id = oi.product_id
          ORDER BY pi2.sort_order ASC
          LIMIT 1
        ) AS image_url
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN product_translations pt
        ON pt.product_id = oi.product_id AND pt.lang_code = 'en'
      WHERE
        o.status NOT IN (${excludedStatuses[0]}, ${excludedStatuses[1]})
        AND o.created_at >= ${startDate}
      GROUP BY oi.product_id, pt.name
      ORDER BY SUM(oi.quantity * oi.price_usd) DESC
      LIMIT 10
    `;

    const topProducts = topProductRows.map((row, idx) => ({
      rank: idx + 1,
      productId: row.product_id.toString(),
      name: row.name ?? '',
      imageUrl: row.image_url ?? null,
      qtySold: Number(row.total_qty),
      revenue: parseFloat(row.total_revenue ?? '0'),
    }));

    // -----------------------------------------------------------------------
    // 3. Category revenue (raw SQL)
    // -----------------------------------------------------------------------
    type CategoryRow = {
      category_name: string | null;
      revenue: string;
    };

    const categoryRows = await prisma.$queryRaw<CategoryRow[]>`
      SELECT
        c.name_en                                   AS category_name,
        SUM(oi.quantity * oi.price_usd)::text       AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE
        o.status NOT IN (${excludedStatuses[0]}, ${excludedStatuses[1]})
        AND o.created_at >= ${startDate}
      GROUP BY c.name_en
      ORDER BY SUM(oi.quantity * oi.price_usd) DESC
    `;

    const categoryRevenue = categoryRows.map((row) => ({
      name: row.category_name ?? 'Uncategorized',
      revenue: parseFloat(row.revenue ?? '0'),
    }));

    // -----------------------------------------------------------------------
    // 4. Member growth by day (raw SQL)
    // -----------------------------------------------------------------------
    type MemberGrowthRow = {
      date: Date;
      new_members: bigint;
    };

    const memberGrowthRows = await prisma.$queryRaw<MemberGrowthRow[]>`
      SELECT
        DATE_TRUNC('day', created_at) AS date,
        COUNT(*)                      AS new_members
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `;

    const memberGrowth = memberGrowthRows.map((row) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      newMembers: Number(row.new_members),
    }));

    // -----------------------------------------------------------------------
    // 5. Summary
    // -----------------------------------------------------------------------
    type SummaryRow = {
      total_revenue: string | null;
      total_orders: bigint;
      avg_order_value: string | null;
    };

    const summaryRows = await prisma.$queryRaw<SummaryRow[]>`
      SELECT
        SUM(total_usd)::text      AS total_revenue,
        COUNT(*)                  AS total_orders,
        AVG(total_usd)::text      AS avg_order_value
      FROM orders
      WHERE
        status NOT IN (${excludedStatuses[0]}, ${excludedStatuses[1]})
        AND created_at >= ${startDate}
    `;

    const newMembersCount = await prisma.user.count({
      where: { createdAt: { gte: startDate } },
    });

    // -----------------------------------------------------------------------
    // 6. 직전 동일 기간 매출/주문 (이전 기간 비교)
    // -----------------------------------------------------------------------
    const prevSummaryRows = await prisma.$queryRaw<SummaryRow[]>`
      SELECT
        SUM(total_usd)::text      AS total_revenue,
        COUNT(*)                  AS total_orders,
        AVG(total_usd)::text      AS avg_order_value
      FROM orders
      WHERE
        status NOT IN (${excludedStatuses[0]}, ${excludedStatuses[1]})
        AND created_at >= ${prevStartDate}
        AND created_at <  ${prevEndDate}
    `;

    const prevRevenue = parseFloat(prevSummaryRows[0]?.total_revenue ?? '0');
    const prevOrders  = Number(prevSummaryRows[0]?.total_orders ?? 0);

    const summaryRow = summaryRows[0];
    const curRevenue = parseFloat(summaryRow?.total_revenue ?? '0');
    const curOrders  = Number(summaryRow?.total_orders ?? 0);

    // 직전 기간이 0이면 변화율 계산 불가 → undefined
    const revenueChange = prevRevenue > 0
      ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 100)
      : undefined;
    const ordersChange = prevOrders > 0
      ? Math.round(((curOrders - prevOrders) / prevOrders) * 100)
      : undefined;

    const summary = {
      totalRevenue:  curRevenue,
      totalOrders:   curOrders,
      avgOrderValue: parseFloat(summaryRow?.avg_order_value ?? '0'),
      newUsers:      newMembersCount,
      revenueChange,
      ordersChange,
    };

    return NextResponse.json({
      period: `${days}d`,
      summary,
      dailyRevenue,
      topProducts,
      categoryRevenue,
      memberGrowth,
    });
  } catch (error) {
    console.error('GET /api/admin/analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
