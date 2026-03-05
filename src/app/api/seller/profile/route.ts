import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({
        where: { userId: session.user.id },
        select: {
            id: true, companyName: true, brandName: true, businessNumber: true,
            ceoName: true, businessAddress: true, phone: true, contactEmail: true,
            logoUrl: true, description: true, commissionRate: true, status: true,
            country: true, createdAt: true,
        },
    });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    return NextResponse.json(supplier);
}
