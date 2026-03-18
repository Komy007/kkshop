import { NextResponse } from 'next/server';
import { authenticator } from '@otplib/preset-default';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';
import { twoFactorCache } from '@/lib/twoFactorCache';

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

    // 숫자 코드인지 사전 검증 (non-numeric은 authenticator에 전달 불필요)
    const cleanCode = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanCode)) {
        return NextResponse.json({ error: '6자리 숫자 코드를 입력하세요.' }, { status: 400 });
    }

    const isValid = authenticator.verify({ token: cleanCode, secret: user.twoFactorSecret });
    if (!isValid) {
        return NextResponse.json({ error: '인증 코드가 올바르지 않습니다. 다시 시도하세요.' }, { status: 400 });
    }

    // 서버 사이드 nonce 등록 — JWT update 콜백에서 소비됨
    // 클라이언트가 API를 거치지 않고 session.update({ twoFactorVerified: true })를 호출해도 무시됨
    twoFactorCache.set(session.user.id);

    return NextResponse.json({ success: true, required: true });
}
