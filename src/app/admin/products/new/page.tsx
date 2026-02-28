'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Globe } from 'lucide-react';

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        sku: '',
        priceUsd: '',
        stockQty: '0',
        baseLang: 'ko', // Admin inputs in target language
        name: '',
        shortDesc: '',
        detailDesc: '',
        seoKeywords: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save product');
            }

            setSuccessMsg('✅ 상품이 등록되고 모든 언어로 번역 및 저장되었습니다!');

            // Redirect after 2s
            setTimeout(() => {
                router.push('/admin/products');
            }, 2000);

        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Globe className="text-blue-500 w-6 h-6" />
                        상품 등록 (자동 번역 연동)
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        기본 언어(한국어/영어)로 입력하시면 구글 AI가 나머지 언어로 자동 번역 및 배포합니다.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                    {errorMsg}
                </div>
            )}

            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md text-sm font-bold">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
                <div className="p-6 space-y-6">
                    {/* Basic Info Section */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-4">기본 정보 (시스템)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU / 바코드 <span className="text-red-500">*</span></label>
                                <input required type="text" name="sku" value={formData.sku} onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="예: COSRX-1234" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">가격 (USD) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input required type="number" step="0.01" name="priceUsd" value={formData.priceUsd} onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">초기 재고량</label>
                                <input type="number" name="stockQty" value={formData.stockQty} onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Multi-language Input Section */}
                    <div>
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                            <h3 className="text-base font-semibold text-gray-900">다국어 정보 입력</h3>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">입력 언어 기준:</label>
                                <select name="baseLang" value={formData.baseLang} onChange={handleChange}
                                    className="rounded-md border border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-600">
                                    <option value="ko">🇰🇷 한국어 (Korean)</option>
                                    <option value="en">🇺🇸 영어 (English)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">상품명 <span className="text-red-500">*</span></label>
                                <input required type="text" name="name" value={formData.name} onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="상품 이름을 입력하세요 (이 내용이 다국어로 자동 번역됩니다)" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">요약 설명</label>
                                <input type="text" name="shortDesc" value={formData.shortDesc} onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="목록에서 보여질 짧은 한 줄 설명" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                                <textarea name="detailDesc" rows={5} value={formData.detailDesc} onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="상세한 제품 스펙, 사용법, 효능 등을 입력하세요." />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">추천 검색어 (SEO Keywords)</label>
                                <input type="text" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="콤마(,)로 구분하여 입력 (예: 스킨케어, 보습, 썬크림)" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
                    <button type="button" onClick={() => router.back()} disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                        취소
                    </button>
                    <button type="submit" disabled={isLoading}
                        className="px-6 py-2 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading ? '저장 및 번역 중...' : '저장 & 원클릭 자동 번역'}
                    </button>
                </div>
            </form>
        </div>
    );
}
