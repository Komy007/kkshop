'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

const tx: Record<string, any> = {
    en: {
        verifying: 'Verifying your email…',
        success: 'Email Verified! 🎉',
        successDesc: 'Your email has been verified. You can now log in and start shopping.',
        alreadyVerified: 'Already verified!',
        alreadyDesc: 'Your email is already verified. Go ahead and log in.',
        error: 'Verification Failed',
        login: 'Go to Login',
        home: 'Back to Home',
    },
    ko: {
        verifying: '이메일 인증 중…',
        success: '이메일 인증 완료! 🎉',
        successDesc: '이메일이 확인되었습니다. 이제 로그인하고 쇼핑을 시작하세요.',
        alreadyVerified: '이미 인증됨!',
        alreadyDesc: '이미 이메일 인증이 완료된 계정입니다. 로그인하세요.',
        error: '인증 실패',
        login: '로그인하기',
        home: '홈으로 돌아가기',
    },
    km: {
        verifying: 'កំពុងផ្ទៀងផ្ទាត់អ៊ីមែល…',
        success: 'អ៊ីមែលបានផ្ទៀងផ្ទាត់! 🎉',
        successDesc: 'អ៊ីមែលរបស់អ្នកត្រូវបានផ្ទៀងផ្ទាត់។ ឥឡូវអ្នកអាចចូលប្រើ។',
        alreadyVerified: 'បានផ្ទៀងផ្ទាត់រួចហើយ!',
        alreadyDesc: 'អ៊ីមែលរបស់អ្នកត្រូវបានផ្ទៀងផ្ទាត់រួចហើយ។',
        error: 'ការផ្ទៀងផ្ទាត់បរាជ័យ',
        login: 'ចូលប្រើ',
        home: 'ត្រឡប់ទៅទំព័រដើម',
    },
    zh: {
        verifying: '正在验证您的邮箱…',
        success: '邮箱验证成功！🎉',
        successDesc: '您的邮箱已验证，现在可以登录并开始购物了。',
        alreadyVerified: '已经验证！',
        alreadyDesc: '您的邮箱已经验证过了，请直接登录。',
        error: '验证失败',
        login: '前往登录',
        home: '返回首页',
    },
};

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const store = useSafeAppStore();
    const lang = (store?.language as keyof typeof tx) || 'en';
    const t = tx[lang] || tx.en;

    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Missing verification token.');
            return;
        }

        fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setStatus(data.alreadyVerified ? 'already' : 'success');
                    // Auto-redirect to login after 3s on success
                    if (!data.alreadyVerified) {
                        setTimeout(() => router.push('/login'), 3000);
                    }
                } else {
                    setStatus('error');
                    setErrorMsg(data.error || 'Unknown error');
                }
            })
            .catch(() => { setStatus('error'); setErrorMsg('Network error. Please try again.'); });
    }, [token, router]);

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">

                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-14 h-14 animate-spin text-brand-primary mx-auto mb-5" />
                            <p className="text-gray-600 font-semibold text-lg">{t.verifying}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
                            <h1 className="text-2xl font-extrabold text-gray-900 mb-3">{t.success}</h1>
                            <p className="text-gray-500 text-sm mb-8">{t.successDesc}</p>
                            <p className="text-xs text-gray-400 mb-5">Redirecting to login in 3 seconds…</p>
                            <Link href="/login"
                                className="inline-flex items-center gap-2 bg-brand-primary text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-brand-primary/90 transition-all">
                                {t.login}
                            </Link>
                        </>
                    )}

                    {status === 'already' && (
                        <>
                            <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-5" />
                            <h1 className="text-2xl font-extrabold text-gray-900 mb-3">{t.alreadyVerified}</h1>
                            <p className="text-gray-500 text-sm mb-8">{t.alreadyDesc}</p>
                            <Link href="/login"
                                className="inline-flex items-center gap-2 bg-brand-primary text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-brand-primary/90 transition-all">
                                {t.login}
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-5" />
                            <h1 className="text-2xl font-extrabold text-gray-900 mb-3">{t.error}</h1>
                            <p className="text-red-500 text-sm mb-8 font-medium">{errorMsg}</p>
                            <div className="flex flex-col gap-3">
                                <Link href="/login"
                                    className="w-full text-center bg-brand-primary text-white px-6 py-3.5 rounded-xl font-bold text-base hover:bg-brand-primary/90 transition-all">
                                    {t.login}
                                </Link>
                                <Link href="/"
                                    className="w-full text-center bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-base hover:bg-gray-200 transition-all">
                                    {t.home}
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* KKShop branding */}
                <div className="text-center mt-6">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-primary to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm leading-none">K</span>
                        </div>
                        <span className="font-bold text-gray-700">KKShop</span>
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
