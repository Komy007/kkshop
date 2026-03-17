import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

// GET /api/seller/stats
// Returns real counts from DB for the seller dashboard — no pagination issues
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'No supplier profile' }, { status: 404 });

    const [totalProducts, pendingProducts, approvedProducts, rejectedProducts, totalOrders] =
        await Promise.all([
            prisma.product.count({ where: { supplierId: supplier.id } }),
            prisma.product.count({ where: { supplierId: supplier.id, approvalStatus: 'PENDING' } }),
            prisma.product.count({ where: { supplierId: supplier.id, approvalStatus: 'APPROVED' } }),
            prisma.product.count({ where: { supplierId: supplier.id, approvalStatus: 'REJECTED' } }),
            prisma.order.count({
                where: { items: { some: { product: { supplierId: supplier.id } } } },
            }),
        ]);

    return NextResponse.json({
        totalProducts,
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        totalOrders,
    });
}
