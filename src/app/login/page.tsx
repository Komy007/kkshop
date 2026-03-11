'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Google SVG Icon — white "G" on brand blue background
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#ffffff"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#ffffff"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#ffffff"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#ffffff"
            />
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

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
    );
}

export default function LoginPage() {
    const t = useTranslations();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await signIn('google', { callbackUrl: '/' });
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError('Google sign-in failed. Please try again.');
            setGoogleLoading(false);
        }
    };

    const handleSocialLogin = async (provider: string) => {
        setLoading(true);
        setError('');
        try {
            await signIn(provider, { callbackUrl: '/' });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
                callbackUrl: '/',
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                // Redirect admins to /admin, regular users to /
                router.push('/');
                router.refresh();
            }
        } catch (err) {
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
                    {/* Google — active OAuth */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#4285F4] text-white font-semibold hover:bg-[#3367d6] transition-all active:scale-[0.98] min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {googleLoading
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <GoogleIcon className="w-5 h-5" />
                        }
                        <span className="flex-1 text-left">Continue with Google</span>
                    </button>

                    {/* Telegram — placeholder */}
                    <button
                        onClick={() => handleSocialLogin('telegram')}
                        disabled
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#26A5E4]/50 text-white/60 font-semibold cursor-not-allowed min-h-[48px]"
                        title="Coming soon"
                    >
                        <TelegramIcon className="w-5 h-5" />
                        <span className="flex-1 text-left">{t.auth.telegram}</span>
                        <span className="text-[10px] font-normal opacity-60 bg-white/10 px-1.5 py-0.5 rounded">Soon</span>
                    </button>

                    {/* TikTok — placeholder */}
                    <button
                        onClick={() => handleSocialLogin('tiktok')}
                        disabled
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-space-800/50 text-white/60 font-semibold border border-white/5 cursor-not-allowed min-h-[48px]"
                        title="Coming soon"
                    >
                        <TikTokIcon className="w-5 h-5" />
                        <span className="flex-1 text-left">{t.auth.tiktok}</span>
                        <span className="text-[10px] font-normal opacity-60 bg-white/10 px-1.5 py-0.5 rounded">Soon</span>
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
