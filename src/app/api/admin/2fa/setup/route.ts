import { NextResponse } from 'next/server';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';
import { logAudit, getIpFromRequest } from '@/lib/audit';

/** Generate 10 backup codes (8 chars each, alphanumeric) */
function generateBackupCodes(count = 10): string[] {
    return Array.from({ length: count }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase() // 8-char hex codes
    );
}

/** Hash a backup code for storage */
function hashCode(code: string): string {
    return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

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

    // Generate new secret — return to client only, NOT stored in DB until verified
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email || 'admin', 'KKShop Admin', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    return NextResponse.json({ enabled: false, secret, qrDataUrl });
}

// POST — TOTP 코드 검증 후 2FA 활성화
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { code, secret } = await req.json();
    if (!code || !secret) return NextResponse.json({ error: 'Code and secret are required' }, { status: 400 });

    // Validate the TOTP code against the client-provided secret before storing
    const isValid = authenticator.verify({ token: code, secret });
    if (!isValid) return NextResponse.json({ error: '인증 코드가 올바르지 않습니다.' }, { status: 400 });

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = backupCodes.map(hashCode);

    // Only store secret and enable 2FA after successful verification
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            twoFactorSecret: secret,
            twoFactorEnabled: true,
            twoFactorBackup: JSON.stringify(hashedCodes),
        },
    });

    await logAudit({
        userId: session.user.id,
        userEmail: session.user.email || '',
        userRole: role || '',
        action: 'ENABLE_2FA',
        ipAddress: getIpFromRequest(req),
    });

    // Return plaintext backup codes — user must save them NOW (shown only once)
    return NextResponse.json({
        success: true,
        message: '2FA가 활성화되었습니다.',
        backupCodes,
    });
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
        data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackup: null },
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
