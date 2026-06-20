import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { isValidCommission, clampCommission, parseCommissionRate } from '@/lib/commission';

export const dynamic = 'force-dynamic';

// Next.js 16: 동적 라우트 params는 Promise — 반드시 await 후 사용 (다른 라우트와 동일 패턴)
type RouteCtx = { params: Promise<{ id: string }> };

// GET: fetch single supplier with product stats
export async function GET(_req: Request, { params }: RouteCtx) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
        where: { id },
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
        prisma.product.count({ where: { supplierId: id, approvalStatus: 'APPROVED' } }),
        prisma.product.count({ where: { supplierId: id, approvalStatus: 'PENDING' } }),
        prisma.product.count({ where: { supplierId: id, approvalStatus: 'REJECTED' } }),
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

    const { id } = await params;
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
        const rate = parseCommissionRate(commissionRate);
        if (!isValidCommission(rate)) {
            return NextResponse.json({ error: '커미션 비율은 9~30% 사이여야 합니다. (Commission must be 9–30%)' }, { status: 400 });
        }
        data.commissionRate = clampCommission(rate);
    }

    const updated = await prisma.supplier.update({
        where: { id },
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

    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Deactivate all products first
    await prisma.product.updateMany({
        where: { supplierId: id },
        data: { status: 'INACTIVE', approvalStatus: 'REJECTED' },
    });

    // Delete supplier (cascades to user via schema)
    await prisma.supplier.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
