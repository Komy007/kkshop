import { NextRequest, NextResponse } from 'next/server';

// Telegram OAuth 리다이렉트 콜백
// oauth.telegram.org/auth 에서 인증 후 이 URL로 리다이렉트됨
// ?tgAuthResult=BASE64_ENCODED_AUTH_DATA
export async function GET(req: NextRequest) {
    const tgAuthResult = req.nextUrl.searchParams.get('tgAuthResult');

    if (!tgAuthResult) {
        return NextResponse.redirect(new URL('/login?error=Callback', req.url));
    }

    // auth data를 로그인 페이지로 전달 — 클라이언트 측에서 signIn('telegram') 처리
    return NextResponse.redirect(
        new URL(`/login?tg=${encodeURIComponent(tgAuthResult)}`, req.url)
    );
}
