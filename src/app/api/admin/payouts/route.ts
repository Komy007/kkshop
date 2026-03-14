import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

function requireSuperAdmin(session: any) {
    if (session?.user?.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    const denied  = requireSuperAdmin(session);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get('period') ?? '30');

    const since = new Date();
    since.setDate(since.getDate() - period);

    const suppliers: any[] = await prisma.supplier.findMany({
        where:   { status: 'APPROVED' },
        include: {
            user:     { select: { email: true, name: true } },
            products: { select: { id: true } },
        },
    }) as any[];

    const payouts = await Promise.all(
        suppliers.map(async (supplier: any) => {
            const productIds: bigint[] = supplier.products.map((p: any) => p.id as bigint);

            const items: any[] = await prisma.orderItem.findMany({
                where: {
                    productId: { in: productIds },
                    order: {
                        status:    'DELIVERED',
                        createdAt: { gte: since },
                    },
                },
            }) as any[];

            const grossRevenue   = items.reduce((s: number, i: any) => s + Number(i.priceUsd) * Number(i.quantity), 0);
            const commissionRate = supplier.commissionRate / 100;
            const commission     = grossRevenue * commissionRate;
            const netPayout      = grossRevenue - commission;

            return {
                supplierId:     supplier.id,
                companyName:    supplier.companyName,
                brandName:      supplier.brandName ?? null,
                contactEmail:   supplier.contactEmail,
                commissionRate: supplier.commissionRate,
                grossRevenue,
                commission,
                netPayout,
                orderCount:     items.length,
                status:         'PENDING',
            };
        })
    );

    const summary = {
        totalGross:      payouts.reduce((s, p) => s + p.grossRevenue, 0),
        totalCommission: payouts.reduce((s, p) => s + p.commission, 0),
        totalPayout:     payouts.reduce((s, p) => s + p.netPayout, 0),
        supplierCount:   payouts.length,
    };

    return NextResponse.json({ payouts, summary });
}
