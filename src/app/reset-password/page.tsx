'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

const t: Record<string, any> = {
    en: {
        title: 'Reset Password',
        subtitle: 'Enter your new password below.',
        newPwLabel: 'New Password',
        confirmPwLabel: 'Confirm Password',
        placeholder: 'At least 6 characters',
        confirmPlaceholder: 'Repeat new password',
        submit: 'Reset Password',
        submitting: 'Resetting...',
        successTitle: 'Password Reset!',
        successMsg: 'Your password has been updated successfully. You can now log in with your new password.',
        login: 'Go to Login',
        errorNoToken: 'Invalid or missing reset token.',
        errorMismatch: 'Passwords do not match.',
        errorLength: 'Password must be at least 6 characters.',
        errorExpired: 'This reset link is invalid or has expired.',
    },
    ko: {
        title: '비밀번호 재설정',
        subtitle: '새 비밀번호를 입력해주세요.',
        newPwLabel: '새 비밀번호',
        confirmPwLabel: '비밀번호 확인',
        placeholder: '6자 이상',
        confirmPlaceholder: '새 비밀번호 반복',
        submit: '비밀번호 재설정',
        submitting: '재설정 중...',
        successTitle: '비밀번호 재설정 완료!',
        successMsg: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인하세요.',
        login: '로그인하기',
        errorNoToken: '유효하지 않은 재설정 링크입니다.',
        errorMismatch: '비밀번호가 일치하지 않습니다.',
        errorLength: '비밀번호는 최소 6자 이상이어야 합니다.',
        errorExpired: '이 재설정 링크는 유효하지 않거나 만료되었습니다.',
    },
    km: {
        title: 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ',
        subtitle: 'បញ្ចូលពាក្យសម្ងាត់ថ្មីរបស់អ្នកខាងក្រោម។',
        newPwLabel: 'ពាក្យសម្ងាត់ថ្មី',
        confirmPwLabel: 'បញ្ជាក់ពាក្យសម្ងាត់',
        placeholder: 'យ៉ាងតិច 6 តួអក្សរ',
        confirmPlaceholder: 'ធ្វើซ้ำពាក្យសម្ងាត់ថ្មី',
        submit: 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ',
        submitting: 'កំពុងកំណត់...',
        successTitle: 'ពាក្យសម្ងាត់ត្រូវបានកំណត់ឡើងវិញ!',
        successMsg: 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ។',
        login: 'ចូលប្រើ',
        errorNoToken: 'Token កំណត់ឡើងវិញមិនត្រឹមត្រូវ។',
        errorMismatch: 'ពាក្យសម្ងាត់មិនត្រូវគ្នា។',
        errorLength: 'ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងតិច 6 តួអក្សរ។',
        errorExpired: 'តំណភ្ជាប់នេះមិនត្រឹមត្រូវ ឬផុតកំណត់ហើយ។',
    },
    zh: {
        title: '重置密码',
        subtitle: '请在下方输入您的新密码。',
        newPwLabel: '新密码',
        confirmPwLabel: '确认密码',
        placeholder: '至少6个字符',
        confirmPlaceholder: '重复新密码',
        submit: '重置密码',
        submitting: '重置中...',
        successTitle: '密码已重置！',
        successMsg: '您的密码已成功更新，现在可以用新密码登录了。',
        login: '去登录',
        errorNoToken: '重置令牌无效或缺失。',
        errorMismatch: '两次密码不一致。',
        errorLength: '密码至少需要6个字符。',
        errorExpired: '此重置链接无效或已过期。',
    },
};

export default function ResetPasswordPage() {
    const store = useSafeAppStore();
    const lang = (store?.language as keyof typeof t) || 'en';
    const tx = t[lang] || t.en;
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) setError(tx.errorNoToken);
    }, [token, tx.errorNoToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) { setError(tx.errorLength); return; }
        if (password !== confirm) { setError(tx.errorMismatch); return; }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || tx.errorExpired);
            } else {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 3000);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {success ? (
                        <div className="text-center py-4">
                            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                            <h2 className="text-xl font-extrabold text-gray-900 mb-2">{tx.successTitle}</h2>
                            <p className="text-sm text-gray-500 mb-6">{tx.successMsg}</p>
                            <Link href="/login" className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-full font-bold hover:bg-brand-primary/90 transition-all text-sm">
                                {tx.login}
                            </Link>
                        </div>
                    ) : !token ? (
                        <div className="text-center py-4">
                            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                            <h2 className="text-xl font-extrabold text-gray-900 mb-2">{tx.errorNoToken}</h2>
                            <Link href="/forgot-password" className="text-sm text-brand-primary font-bold hover:underline">
                                Request a new reset link
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
                                    <Lock className="w-6 h-6 text-brand-primary" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-gray-900">{tx.title}</h1>
                                <p className="text-sm text-gray-500 mt-1">{tx.subtitle}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.newPwLabel}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder={tx.placeholder}
                                            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                                            autoComplete="new-password"
                                        />
                                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.confirmPwLabel}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder={tx.confirmPlaceholder}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <p className="text-xs text-red-600 font-semibold">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-3.5 rounded-xl font-extrabold text-sm hover:bg-brand-primary/90 disabled:opacity-60 transition-all"
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {tx.submitting}</> : tx.submit}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
