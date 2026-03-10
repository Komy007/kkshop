'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

const t: Record<string, any> = {
    en: {
        title: 'Forgot Password',
        subtitle: "Enter your account email and we'll send you a reset link.",
        emailLabel: 'Email Address',
        emailPlaceholder: 'your@email.com',
        submit: 'Send Reset Link',
        sending: 'Sending...',
        successTitle: 'Check your email',
        successMsg: "If an account exists for that email, we've sent a password reset link. It expires in 1 hour.",
        backToLogin: 'Back to Login',
        errorRequired: 'Please enter your email.',
    },
    ko: {
        title: '비밀번호 찾기',
        subtitle: '계정 이메일을 입력하시면 재설정 링크를 보내드립니다.',
        emailLabel: '이메일 주소',
        emailPlaceholder: 'your@email.com',
        submit: '재설정 링크 보내기',
        sending: '전송 중...',
        successTitle: '이메일을 확인하세요',
        successMsg: '해당 이메일로 가입된 계정이 있다면 비밀번호 재설정 링크를 보내드렸습니다. 링크는 1시간 후 만료됩니다.',
        backToLogin: '로그인으로 돌아가기',
        errorRequired: '이메일을 입력해주세요.',
    },
    km: {
        title: 'ភ្លេចពាក្យសម្ងាត់',
        subtitle: 'បញ្ចូលអ៊ីមែលគណនីរបស់អ្នក ហើយយើងនឹងផ្ញើតំណភ្ជាប់កំណត់ឡើងវិញ។',
        emailLabel: 'អាសយដ្ឋានអ៊ីមែល',
        emailPlaceholder: 'your@email.com',
        submit: 'ផ្ញើតំណភ្ជាប់កំណត់ឡើងវិញ',
        sending: 'កំពុងផ្ញើ...',
        successTitle: 'ពិនិត្យអ៊ីមែលរបស់អ្នក',
        successMsg: 'ប្រសិនបើគណនីមានសម្រាប់អ៊ីមែលនោះ យើងបានផ្ញើតំណភ្ជាប់កំណត់ពាក្យសម្ងាត់ឡើងវិញ។ វាផុតកំណត់ក្នុង 1 ម៉ោង។',
        backToLogin: 'ត្រឡប់ទៅចូល',
        errorRequired: 'សូមបញ្ចូលអ៊ីមែលរបស់អ្នក។',
    },
    zh: {
        title: '忘记密码',
        subtitle: '输入您的账号邮箱，我们将发送重置链接。',
        emailLabel: '邮箱地址',
        emailPlaceholder: 'your@email.com',
        submit: '发送重置链接',
        sending: '发送中...',
        successTitle: '请查看您的邮箱',
        successMsg: '如果该邮箱存在账号，我们已发送了密码重置链接。链接将在1小时后失效。',
        backToLogin: '返回登录',
        errorRequired: '请输入您的邮箱。',
    },
};

export default function ForgotPasswordPage() {
    const store = useSafeAppStore();
    const lang = (store?.language as keyof typeof t) || 'en';
    const tx = t[lang] || t.en;

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { setError(tx.errorRequired); return; }
        setError('');
        setLoading(true);
        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            setSuccess(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Back link */}
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {tx.backToLogin}
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {success ? (
                        <div className="text-center py-4">
                            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                            <h2 className="text-xl font-extrabold text-gray-900 mb-2">{tx.successTitle}</h2>
                            <p className="text-sm text-gray-500 mb-6">{tx.successMsg}</p>
                            <Link href="/login" className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-full font-bold hover:bg-brand-primary/90 transition-all text-sm">
                                {tx.backToLogin}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
                                    <Mail className="w-6 h-6 text-brand-primary" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-gray-900">{tx.title}</h1>
                                <p className="text-sm text-gray-500 mt-1">{tx.subtitle}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{tx.emailLabel}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder={tx.emailPlaceholder}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                                            autoComplete="email"
                                        />
                                    </div>
                                    {error && <p className="text-xs text-red-500 mt-1.5 font-semibold">{error}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-3.5 rounded-xl font-extrabold text-sm hover:bg-brand-primary/90 disabled:opacity-60 transition-all"
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {tx.sending}</> : tx.submit}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
