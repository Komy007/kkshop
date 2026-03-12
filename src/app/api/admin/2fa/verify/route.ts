import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

// POST — 로그인 후 2FA 코드 검증 (pending 상태 해제)
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        // 2FA 미설정 계정은 패스
        return NextResponse.json({ success: true, required: false });
    }

    const isValid = authenticator.verify({ token: code.replace(/\s/g, ''), secret: user.twoFactorSecret });
    if (!isValid) {
        return NextResponse.json({ error: '인증 코드가 올바르지 않습니다. 다시 시도하세요.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, required: true });
}
