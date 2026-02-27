'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';

// Social Login SVG Icons
function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSocialLogin = (provider: string) => {
        // TODO: Replace with actual OAuth login
        console.log(`Social login with: ${provider}`);
    };

    const handleEmailLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Replace with actual credentials login
        console.log('Email login:', email);
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
                    <button
                        onClick={() => handleSocialLogin('facebook')}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#1877F2] text-white font-semibold hover:bg-[#1877F2]/90 transition-all active:scale-[0.98] min-h-[48px]"
                    >
                        <FacebookIcon className="w-5 h-5" />
                        <span className="flex-1 text-left">{t.auth.facebook}</span>
                    </button>

                    <button
                        onClick={() => handleSocialLogin('telegram')}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#26A5E4] text-white font-semibold hover:bg-[#26A5E4]/90 transition-all active:scale-[0.98] min-h-[48px]"
                    >
                        <TelegramIcon className="w-5 h-5" />
                        <span className="flex-1 text-left">{t.auth.telegram}</span>
                    </button>

                    <button
                        onClick={() => handleSocialLogin('tiktok')}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-space-800 text-white font-semibold border border-white/10 hover:bg-space-700 transition-all active:scale-[0.98] min-h-[48px]"
                    >
                        <TikTokIcon className="w-5 h-5" />
                        <span className="flex-1 text-left">{t.auth.tiktok}</span>
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
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.auth.emailPlaceholder}
                            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-sm min-h-[48px]"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t.auth.passwordPlaceholder}
                            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-sm min-h-[48px]"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/90 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98] min-h-[48px]"
                    >
                        {t.auth.loginButton}
                    </button>
                </form>

                {/* Signup Link */}
                <p className="text-center text-sm text-white/40 mt-6">
                    {t.auth.signupLink}
                </p>
            </div>
        </div>
    );
}
