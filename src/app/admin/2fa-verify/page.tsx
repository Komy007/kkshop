'use client';

import React, { useState } from 'react';
import { Shield, Loader2, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TwoFactorVerifyPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        if (code.length !== 6) { setError('6자리 코드를 입력하세요.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || '인증 실패'); return; }
            // 세션의 twoFactorPending 해제
            await update({ twoFactorVerified: true });
            const role = (session?.user as any)?.role;
            router.replace(role === 'SUPERADMIN' ? '/admin' : '/admin/products');
        } catch {
            setError('서버 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">2단계 인증</h1>
                    <p className="text-gray-400 text-sm mt-2">
                        Google Authenticator 앱의 6자리 코드를 입력하세요.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                    />
                    {error && (
                        <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl py-2 px-3">{error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '확인'}
                    </button>
                </form>

                <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="mt-6 w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                </button>
            </div>
        </div>
    );
}
