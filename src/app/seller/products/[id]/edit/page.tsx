'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Loader2, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';

interface ProductForm {
    name: string;
    shortDesc: string;
    detailDesc: string;
    ingredients: string;
    howToUse: string;
    benefits: string;
    priceUsd: string;
    volume: string;
    skinType: string;
    origin: string;
}

const EMPTY: ProductForm = {
    name: '', shortDesc: '', detailDesc: '', ingredients: '',
    howToUse: '', benefits: '', priceUsd: '', volume: '', skinType: '', origin: '',
};

export default function SellerProductEditPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [form, setForm] = useState<ProductForm>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetch(`/api/seller/products/${productId}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { router.push('/seller/products'); return; }
                const ko = data.translations?.find((t: any) => t.langCode === 'ko') ?? {};
                setForm({
                    name: ko.name ?? '',
                    shortDesc: ko.shortDesc ?? '',
                    detailDesc: ko.detailDesc ?? '',
                    ingredients: ko.ingredients ?? '',
                    howToUse: ko.howToUse ?? '',
                    benefits: ko.benefits ?? '',
                    priceUsd: data.priceUsd ?? '',
                    volume: data.volume ?? '',
                    skinType: data.skinType ?? '',
                    origin: data.origin ?? '',
                });
                setApprovalStatus(data.approvalStatus ?? 'PENDING');
            })
            .finally(() => setLoading(false));
    }, [productId, router]);

    const set = (field: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setMessage({ type: 'error', text: '상품명을 입력하세요.' }); return; }

        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/seller/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: data.message ?? '저장되었습니다.' });
                setApprovalStatus('PENDING');
            } else {
                setMessage({ type: 'error', text: data.error ?? '저장에 실패했습니다.' });
            }
        } catch {
            setMessage({ type: 'error', text: '오류가 발생했습니다.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
        );
    }

    const BADGE: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-600',
    };
    const BADGE_LABEL: Record<string, string> = {
        PENDING: '검수 대기중', APPROVED: '판매 승인됨', REJECTED: '반려됨',
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">상품 수정</h1>
                    <p className="text-xs text-gray-400 mt-0.5">수정 후 재검수가 진행됩니다</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${BADGE[approvalStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                    {BADGE_LABEL[approvalStatus] ?? approvalStatus}
                </span>
            </div>

            {/* Re-approval notice */}
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                    <strong>수정 시 재검수 안내:</strong> 상품을 수정하면 검수 상태가 <strong>대기중</strong>으로 변경됩니다.
                    관리자 승인 후 다시 판매됩니다 (보통 1~2 영업일 소요).
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message.type === 'success'
                        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Info */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        기본 정보
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">상품명 (한국어) *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={set('name')}
                                required
                                placeholder="상품명을 입력하세요"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">짧은 설명</label>
                            <textarea
                                value={form.shortDesc}
                                onChange={set('shortDesc')}
                                rows={2}
                                placeholder="상품 요약 설명 (검색 결과에 표시)"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">상세 설명</label>
                            <textarea
                                value={form.detailDesc}
                                onChange={set('detailDesc')}
                                rows={5}
                                placeholder="상품 상세 설명을 입력하세요"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-y"
                            />
                        </div>
                    </div>
                </section>

                {/* Pricing & Specs */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        가격 및 제품 정보
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">판매가 (USD)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.priceUsd}
                                onChange={set('priceUsd')}
                                placeholder="0.00"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">용량/중량</label>
                            <input
                                type="text"
                                value={form.volume}
                                onChange={set('volume')}
                                placeholder="예: 50ml, 200g"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">피부타입</label>
                            <input
                                type="text"
                                value={form.skinType}
                                onChange={set('skinType')}
                                placeholder="예: 건성, 지성, 복합성"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">제조국</label>
                            <input
                                type="text"
                                value={form.origin}
                                onChange={set('origin')}
                                placeholder="예: 대한민국"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Ingredients & Usage */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        성분 및 사용법
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">성분 정보</label>
                            <textarea
                                value={form.ingredients}
                                onChange={set('ingredients')}
                                rows={3}
                                placeholder="주요 성분을 입력하세요"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-y"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">사용 방법</label>
                            <textarea
                                value={form.howToUse}
                                onChange={set('howToUse')}
                                rows={2}
                                placeholder="사용 방법을 입력하세요"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-y"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">효능/혜택</label>
                            <textarea
                                value={form.benefits}
                                onChange={set('benefits')}
                                rows={2}
                                placeholder="제품의 주요 효능이나 혜택을 입력하세요"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-y"
                            />
                        </div>
                    </div>
                </section>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? '저장 중...' : '수정 요청 제출'}
                    </button>
                </div>
            </form>
        </div>
    );
}
