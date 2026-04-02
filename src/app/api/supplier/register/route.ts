import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { sendSupplierReceivedEmail } from '@/lib/mail';
import { SupplierRegisterSchema } from '@/lib/validators';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// POST: Supplier registers their info (public, user must be logged in)
export async function POST(req: NextRequest) {
    // Rate limit: 5 requests per 10 minutes per IP
    const ip = getClientIp(req);
    const rl = checkRateLimit(ip, 'supplier-register', 5, 10 * 60_000);
    if (!rl.allowed) {
        return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' }, { status: 429 });
    }

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
    const parsed = SupplierRegisterSchema.safeParse(body);
    if (!parsed.success) {
        const msg = parsed.error.errors[0]?.message ?? '입력 정보를 확인해 주세요.';
        return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { companyName, brandName, country, phone, contactEmail, description, ceoName, businessNumber, businessAddress } = parsed.data;

    const supplier = await prisma.supplier.create({
        data: {
            userId,
            companyName,
            brandName: brandName || null,
            country: country || null,
            phone: phone || null,
            contactEmail,
            description: description || null,
            ceoName: ceoName || null,
            businessNumber: businessNumber || null,
            businessAddress: businessAddress || null,
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
