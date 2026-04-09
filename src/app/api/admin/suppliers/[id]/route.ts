import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: { id: string } };

// GET: fetch single supplier with product stats
export async function GET(_req: Request, { params }: RouteCtx) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supplier = await prisma.supplier.findUnique({
        where: { id: params.id },
        include: {
            user: { select: { email: true, name: true, emailVerified: true } },
            _count: { select: { products: true } },
        },
    });

    if (!supplier) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Product stats by approval status
    const [approved, pending, rejected] = await Promise.all([
        prisma.product.count({ where: { supplierId: params.id, approvalStatus: 'APPROVED' } }),
        prisma.product.count({ where: { supplierId: params.id, approvalStatus: 'PENDING' } }),
        prisma.product.count({ where: { supplierId: params.id, approvalStatus: 'REJECTED' } }),
    ]);

    return NextResponse.json({
        ...supplier,
        commissionRate: supplier.commissionRate?.toString(),
        stats: { total: supplier._count.products, approved, pending, rejected },
    });
}

// PUT: update supplier details (SUPERADMIN only)
export async function PUT(req: Request, { params }: RouteCtx) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { companyName, brandName, businessNumber, ceoName, businessAddress,
            country, phone, contactEmail, commissionRate, description, adminNote, logoUrl } = body;

    const data: any = {};
    if (companyName !== undefined) data.companyName = companyName;
    if (brandName !== undefined) data.brandName = brandName || null;
    if (businessNumber !== undefined) data.businessNumber = businessNumber || null;
    if (ceoName !== undefined) data.ceoName = ceoName || null;
    if (businessAddress !== undefined) data.businessAddress = businessAddress || null;
    if (country !== undefined) data.country = country || null;
    if (phone !== undefined) data.phone = phone || null;
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (logoUrl !== undefined) data.logoUrl = logoUrl || null;
    if (description !== undefined) data.description = description || null;
    if (adminNote !== undefined) data.adminNote = adminNote || null;
    if (commissionRate !== undefined) {
        const rate = parseFloat(commissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            return NextResponse.json({ error: 'Commission rate must be 0-100' }, { status: 400 });
        }
        data.commissionRate = rate;
    }

    const updated = await prisma.supplier.update({
        where: { id: params.id },
        data,
        include: { user: { select: { email: true, name: true } } },
    });

    return NextResponse.json({ ...updated, commissionRate: updated.commissionRate?.toString() });
}

// DELETE: remove supplier + user (SUPERADMIN only)
export async function DELETE(_req: Request, { params }: RouteCtx) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!supplier) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Deactivate all products first
    await prisma.product.updateMany({
        where: { supplierId: params.id },
        data: { status: 'INACTIVE', approvalStatus: 'REJECTED' },
    });

    // Delete supplier (cascades to user via schema)
    await prisma.supplier.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
}
