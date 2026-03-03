import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

// GET: List all suppliers (ADMIN/SUPERADMIN only)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes((session.user as any).role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const suppliers = await prisma.supplier.findMany({
        where: status ? { status } : {},
        include: {
            user: { select: { email: true, name: true } },
            _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suppliers);
}

// PATCH: Approve / Reject / Suspend a supplier (SUPERADMIN only)
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, commissionRate, adminNote } = body;

    if (!id || !status) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supplier = await prisma.supplier.update({
        where: { id },
        data: {
            status,
            ...(commissionRate !== undefined && { commissionRate }),
            ...(adminNote !== undefined && { adminNote }),
        },
        include: { user: { select: { email: true } } },
    });

    // If approved, update the user's role to SUPPLIER
    if (status === 'APPROVED') {
        await prisma.user.update({
            where: { id: supplier.userId },
            data: { role: 'SUPPLIER' },
        });
    }

    // If rejected/suspended, downgrade role back to USER
    if (status === 'REJECTED' || status === 'SUSPENDED') {
        await prisma.user.update({
            where: { id: supplier.userId },
            data: { role: 'USER' },
        });
    }

    return NextResponse.json(supplier);
}
