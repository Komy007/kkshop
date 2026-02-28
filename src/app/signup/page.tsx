'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Phone, MapPin, ArrowRight, Loader2, AlertCircle, Home } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        postalCode: '',
        address: '',
        detailAddress: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '회원가입에 실패했습니다.');
            }

            setSuccess('KKshop 회원이 되신 것을 환영합니다! 잠시 후 로그인 페이지로 이동합니다.');
            setTimeout(() => {
                router.push('/login');
            }, 2500);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 relative overflow-hidden">
            {/* Background Effects matching aesthetic */}
            <div className="absolute top-0 left-1/4 w-[50vw] h-[50vw] bg-blue-100 rounded-full blur-[100px] pointer-events-none opacity-50" />

            <div className="w-full max-w-lg bg-white border border-gray-100 rounded-3xl p-8 shadow-xl relative z-10 animate-fade-in-up my-8">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white mb-5 shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">
                        <UserPlus className="w-7 h-7" />
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">회원가입</h1>
                    <p className="text-gray-500 mt-2 text-sm">KKshop의 다양한 혜택과 다국어 쇼핑을 경험하세요.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 animate-scale-in">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 text-green-700 animate-scale-in">
                        <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center bg-green-500 rounded-full text-white">✓</div>
                        <p className="text-sm font-medium flex-1">{success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Account Setup */}
                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">기본 정보 (필수)</h3>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <User className="w-5 h-5" />
                            </div>
                            <input required type="text" name="name" value={formData.name} onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium sm:text-sm"
                                placeholder="이름 (Full Name)" />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input required type="email" name="email" value={formData.email} onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium sm:text-sm"
                                placeholder="이메일 주소 (이메일로 로그인)" />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input required type="password" name="password" minLength={6} value={formData.password} onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium sm:text-sm font-mono"
                                placeholder="비밀번호 (6자리 이상)" />
                        </div>
                    </div>

                    {/* Shipping Address Setup */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                            배송 정보 (선택)
                            <span className="text-xs font-normal text-gray-400 normal-case">추후 마이페이지에서 수정 가능</span>
                        </h3>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <Phone className="w-5 h-5" />
                            </div>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium sm:text-sm"
                                placeholder="연락처 (Phone Number) 예: 010-1234-5678" />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="relative group col-span-3">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <input type="text" name="address" value={formData.address} onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium sm:text-sm"
                                    placeholder="기본 배송지 주소 (City/Province/Street)" />
                            </div>

                            <div className="relative group col-span-2">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Home className="w-5 h-5" />
                                </div>
                                <input type="text" name="detailAddress" value={formData.detailAddress} onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium sm:text-sm"
                                    placeholder="상세 주소 (Apt/Suite/Unit)" />
                            </div>

                            <div className="relative group col-span-1">
                                <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium sm:text-sm"
                                    placeholder="우편번호" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || !!success}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 px-4 font-bold text-base shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>가입 완료하기 <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                            로그인하기
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
