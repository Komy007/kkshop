import { NextResponse } from 'next/server';
import { authenticator } from '@otplib/preset-default';
import crypto from 'crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';
import { twoFactorCache } from '@/lib/twoFactorCache';

function hashCode(code: string): string {
    return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

// POST — 로그인 후 2FA 코드 검증 (pending 상태 해제)
// Accepts either 6-digit TOTP code OR 8-char backup code
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorBackup: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        // 2FA 미설정 계정은 패스
        return NextResponse.json({ success: true, required: false });
    }

    const cleanCode = code.replace(/\s/g, '');

    // Try TOTP code first (6-digit numeric)
    if (/^\d{6}$/.test(cleanCode)) {
        const isValid = authenticator.verify({ token: cleanCode, secret: user.twoFactorSecret });
        if (isValid) {
            twoFactorCache.set(session.user.id);
            return NextResponse.json({ success: true, required: true });
        }
        return NextResponse.json({ error: '인증 코드가 올바르지 않습니다. 다시 시도하세요.' }, { status: 400 });
    }

    // Try backup code (8-char hex)
    if (/^[A-Fa-f0-9]{8}$/.test(cleanCode) && user.twoFactorBackup) {
        try {
            const storedHashes: string[] = JSON.parse(user.twoFactorBackup);
            const inputHash = hashCode(cleanCode);
            const idx = storedHashes.indexOf(inputHash);

            if (idx !== -1) {
                // Remove used backup code (one-time use)
                storedHashes.splice(idx, 1);
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { twoFactorBackup: JSON.stringify(storedHashes) },
                });
                twoFactorCache.set(session.user.id);
                return NextResponse.json({
                    success: true,
                    required: true,
                    backupUsed: true,
                    remainingBackupCodes: storedHashes.length,
                });
            }
        } catch { /* invalid JSON, fall through */ }
    }

    return NextResponse.json({ error: '인증 코드가 올바르지 않습니다. 6자리 TOTP 코드 또는 백업 코드를 입력하세요.' }, { status: 400 });
}
