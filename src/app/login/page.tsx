'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Icons ────────────────────────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff" />
        </svg>
    );
}

function TelegramIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    );
}

// ─── Error messages ───────────────────────────────────────────────────────────
const oauthErrorMessages: Record<string, string> = {
    Configuration:        'Server configuration error. Please contact support.',
    AccessDenied:         'Access denied. You may not have permission to sign in.',
    Verification:         'The sign-in link has expired. Please try again.',
    OAuthSignin:          'Could not start Google sign-in. Please try again.',
    OAuthCallback:        'Google sign-in failed. Please check your Google account and try again.',
    OAuthCreateAccount:   'Could not create account from Google. Please try again.',
    EmailCreateAccount:   'Could not create account. Please try again.',
    Callback:             'An error occurred during sign-in. Please try again.',
    OAuthAccountNotLinked:'This email is already registered. Please sign in with your email and password.',
    Default:              'Sign-in failed. Please try again.',
};

// base64url → JSON 파싱 헬퍼
function parseTgAuthResult(raw: string): Record<string, unknown> | null {
    try {
        const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
        return JSON.parse(atob(base64 + padding));
    } catch {
        return null;
    }
}

// ─── Main login form ───────────────────────────────────────────────────────────
function LoginContent() {
    const t = useTranslations();
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlErrorCode = searchParams.get('error');
    const urlError = urlErrorCode ? (oauthErrorMessages[urlErrorCode] ?? oauthErrorMessages.Default) : '';

    const [email, setEmail]                 = useState('');
    const [password, setPassword]           = useState('');
    const [loading, setLoading]             = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [tgLoading, setTgLoading]         = useState(false);
    const [error, setError]                 = useState(urlError);
    const onTelegramAuthRef = useRef<((user: Record<string, unknown>) => void) | null>(null);

    // ── Google ──────────────────────────────────────────────────────────────
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await signIn('google', { callbackUrl: '/' });
        } catch {
            setError('Google sign-in failed. Please try again.');
            setGoogleLoading(false);
        }
    };

    // ── Telegram signIn ───────────────────────────────────────────────────────
    const onTelegramAuth = useCallback(async (user: Record<string, unknown>) => {
        if (!user?.id) { setTgLoading(false); return; }
        try {
            const result = await signIn('telegram', {
                id:         String(user.id),
                first_name: String(user.first_name ?? ''),
                last_name:  user.last_name  ? String(user.last_name)  : '',
                username:   user.username   ? String(user.username)   : '',
                photo_url:  user.photo_url  ? String(user.photo_url)  : '',
                auth_date:  String(user.auth_date),
                hash:       String(user.hash),
                redirect:   false,
            });
            if (result?.error) {
                setError('Telegram sign-in failed. Please try again.');
                setTgLoading(false);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            setError('Telegram sign-in failed.');
            setTgLoading(false);
        }
    }, [router]);

    onTelegramAuthRef.current = onTelegramAuth;

    // oauth.telegram.org는 return_to URL에 #tgAuthResult=BASE64 (해시)로 데이터를 보냄
    // 해시는 서버로 전송되지 않으므로 클라이언트에서 window.location.hash를 직접 읽음
    useEffect(() => {
        const hash = window.location.hash; // '#tgAuthResult=eyJ...'
        if (!hash.startsWith('#tgAuthResult=')) return;

        const raw = hash.slice('#tgAuthResult='.length);
        if (!raw) return;

        // URL에서 해시 제거 (뒤로가기 시 재실행 방지)
        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        setTgLoading(true);
        const decoded = parseTgAuthResult(raw);
        if (decoded?.id && decoded?.hash) {
            onTelegramAuthRef.current?.(decoded);
        } else {
            setError('Telegram sign-in failed. Please try again.');
            setTgLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 마운트 시 1회만

    // Telegram 버튼 → oauth.telegram.org 리다이렉트
    // return_to = 현재 로그인 페이지 (서버 라우트 거치지 않음, 해시 직접 처리)
    const handleTelegramLogin = () => {
        setTgLoading(true);
        setError('');
        const botId    = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || '8618221243';
        const origin   = window.location.origin;
        const returnTo = `${origin}/login`;
        window.location.href = [
            'https://oauth.telegram.org/auth',
            `?bot_id=${botId}`,
            `&origin=${encodeURIComponent(origin)}`,
            `&return_to=${encodeURIComponent(returnTo)}`,
            '&request_access=write',
            '&embed=0',
        ].join('');
    };

    // ── Email / Password ─────────────────────────────────────────────────────
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await signIn('credentials', {
                email, password, redirect: false, callbackUrl: '/',
            });
            if (result?.error) {
                setError('Invalid email or password');
            } else {
                const sessionRes = await fetch('/api/auth/session');
                const session = await sessionRes.json();
                const role = session?.user?.role;
                if (role === 'SUPPLIER') {
                    router.push('/seller');
                } else if (role === 'ADMIN' || role === 'SUPERADMIN') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
                router.refresh();
            }
        } catch {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center">
                            <span className="text-white font-bold text-xl leading-none">K</span>
                        </div>
                        <span className="text-3xl font-bold tracking-tighter text-white">
                            KK<span className="text-brand-primary">Shop</span>
                        </span>
                    </Link>
                    <h1 className="text-2xl font-extrabold text-white mb-2">{t.auth.loginTitle}</h1>
                    <p className="text-white/50 text-sm">{t.auth.loginSubtitle}</p>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3 mb-8">
                    {/* Google */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={googleLoading || tgLoading}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#4285F4] text-white font-semibold hover:bg-[#3367d6] transition-all active:scale-[0.98] min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {googleLoading
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <GoogleIcon className="w-5 h-5" />
                        }
                        <span className="flex-1 text-left">Continue with Google</span>
                    </button>

                    {/* Telegram */}
                    <button
                        onClick={handleTelegramLogin}
                        disabled={tgLoading || googleLoading}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#26A5E4] text-white font-semibold hover:bg-[#1d96d4] transition-all active:scale-[0.98] min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {tgLoading
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <TelegramIcon className="w-5 h-5" />
                        }
                        <span className="flex-1 text-left">{t.auth.telegram}</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">{t.auth.orEmail}</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Email Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 text-gray-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 text-gray-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-xs text-white/50 hover:text-white/80 transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/90 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98] min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.auth.loginButton}
                    </button>
                </form>

                {/* Signup Button */}
                <div className="mt-4">
                    <Link
                        href="/signup"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-white/25 text-white font-bold text-sm hover:border-white/50 hover:bg-white/5 transition-all active:scale-[0.98]"
                    >
                        {t.auth.signUp}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
