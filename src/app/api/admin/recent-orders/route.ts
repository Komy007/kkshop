import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/recent-orders
 * 대시보드 위젯용 — 최근 주문 5건 (경량, DB 1회 쿼리)
 */
export async function GET() {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id:            true,
            customerName:  true,
            customerEmail: true,
            totalUsd:      true,
            status:        true,
            createdAt:     true,
        },
    });

    return NextResponse.json(
        orders.map(o => ({
            id:           o.id,
            customerName: o.customerName,
            email:        o.customerEmail ?? '',
            totalUsd:     Number(o.totalUsd),
            status:       o.status,
            createdAt:    o.createdAt.toISOString(),
        }))
    );
}
