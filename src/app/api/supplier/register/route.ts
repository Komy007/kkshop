import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { sendSupplierReceivedEmail } from '@/lib/mail';

// POST: Supplier registers their info (public, user must be logged in)
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if already registered
    const existing = await prisma.supplier.findUnique({ where: { userId } });
    if (existing) {
        return NextResponse.json({ error: '이미 공급자 신청이 되어 있습니다', status: existing.status }, { status: 400 });
    }

    const body = await req.json();
    const { companyName, brandName, country, phone, contactEmail, description } = body;

    if (!companyName || !contactEmail) {
        return NextResponse.json({ error: '회사명과 이메일은 필수입니다' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
        data: {
            userId,
            companyName,
            brandName: brandName || null,
            country: country || null,
            phone: phone || null,
            contactEmail,
            description: description || null,
            commissionRate: 30, // Default 30%
            status: 'PENDING',
        },
    });

    // 공급자 신청 확인 이메일 (non-blocking)
    sendSupplierReceivedEmail(contactEmail, companyName).catch(err =>
        console.error('Supplier confirmation email failed (non-critical):', err)
    );

    return NextResponse.json({ success: true, supplier }, { status: 201 });
}

// GET: Get current user's supplier status
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const supplier = await prisma.supplier.findUnique({
        where: { userId },
        include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(supplier || null);
}
