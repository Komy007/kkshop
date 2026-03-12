import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';
import { logAudit, getIpFromRequest } from '@/lib/audit';

// GET — 현재 2FA 상태 조회 또는 새 secret 생성
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorEnabled: true, twoFactorSecret: true, email: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.twoFactorEnabled) {
        return NextResponse.json({ enabled: true });
    }

    // 새 secret 생성 (아직 DB에 저장 안 함 — 확인 후 저장)
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email || 'admin', 'KKShop Admin', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    // 임시로 DB에 저장 (미확인 상태)
    await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    return NextResponse.json({ enabled: false, secret, qrDataUrl });
}

// POST — TOTP 코드 검증 후 2FA 활성화
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorSecret: true, email: true },
    });
    if (!user?.twoFactorSecret) return NextResponse.json({ error: '먼저 2FA 설정을 시작하세요.' }, { status: 400 });

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) return NextResponse.json({ error: '인증 코드가 올바르지 않습니다.' }, { status: 400 });

    await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true },
    });

    await logAudit({
        userId: session.user.id,
        userEmail: session.user.email || '',
        userRole: role || '',
        action: 'ENABLE_2FA',
        ipAddress: getIpFromRequest(req),
    });

    return NextResponse.json({ success: true, message: '2FA가 활성화되었습니다.' });
}

// DELETE — 2FA 비활성화
export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        return NextResponse.json({ error: '2FA가 활성화되어 있지 않습니다.' }, { status: 400 });
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) return NextResponse.json({ error: '인증 코드가 올바르지 않습니다.' }, { status: 400 });

    await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    await logAudit({
        userId: session.user.id,
        userEmail: session.user.email || '',
        userRole: role || '',
        action: 'DISABLE_2FA',
        ipAddress: getIpFromRequest(req),
    });

    return NextResponse.json({ success: true, message: '2FA가 비활성화되었습니다.' });
}
