'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, CheckCircle, Loader2, Globe } from 'lucide-react';

export default function SupplierRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        companyName: '',
        brandName: '',
        country: '',
        phone: '',
        contactEmail: '',
        description: '',
    });

    const countries = ['Cambodia', 'Korea', 'China', 'Japan', 'Thailand', 'Vietnam', 'Singapore', 'USA', 'Others'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/supplier/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '신청 실패');
            setStep('success');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">신청 완료!</h2>
                    <p className="text-gray-600 mb-2">공급자 신청이 접수되었습니다.</p>
                    <p className="text-sm text-gray-400 mb-8">관리자 심사 후 이메일로 결과를 알려드립니다. (1~3 영업일 소요)</p>
                    <button onClick={() => router.push('/')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">공급자 파트너 신청</h1>
                    <p className="mt-2 text-gray-500">KKShop과 함께 캄보디아 시장에서 제품을 판매하세요</p>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { icon: '🌏', title: '캄보디아 시장', desc: '현지 고객 직접 접근' },
                        { icon: '🌐', title: '4개국어 지원', desc: '한/영/크메르/중문' },
                        { icon: '💰', title: '25~35% 수수료', desc: '투명한 정산 시스템' },
                    ].map(b => (
                        <div key={b.title} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                            <div className="text-2xl mb-2">{b.icon}</div>
                            <div className="text-sm font-semibold text-gray-900">{b.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{b.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <h2 className="text-white font-semibold">공급자 정보 입력</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">회사명 <span className="text-red-500">*</span></label>
                                <input required name="companyName" value={form.companyName} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="예: COSRX Korea Ltd." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">브랜드명 (상점 표시용)</label>
                                <input name="brandName" value={form.brandName} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="예: COSRX" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">국가 <span className="text-red-500">*</span></label>
                                <select required name="country" value={form.country} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                    <option value="">국가 선택</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                                <input name="phone" value={form.phone} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="+82-10-0000-0000" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이메일 <span className="text-red-500">*</span></label>
                                <input required type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="contact@company.com" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">브랜드 소개</label>
                                <textarea name="description" rows={4} value={form.description} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                    placeholder="제품 카테고리, 타겟 고객, 브랜드 스토리 등을 자유롭게 소개해주세요" />
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                            <Globe className="w-4 h-4 inline mr-1" />
                            신청 승인 후 공급자 포털에서 상품을 등록하면 <strong>한국어·영어·크메르어·중국어</strong>로 자동 번역되어 KKShop에 등록됩니다.
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-70">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                            {loading ? '신청 중...' : '파트너 신청하기'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
