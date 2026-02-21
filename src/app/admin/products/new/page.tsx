'use client';

import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { createProductWithTranslations } from '@/actions/productActions';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        sku: '',
        priceUsd: '',
        stockQty: '100',
        sourceLang: 'ko' as 'ko' | 'en',
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
            // Server Action 호출
            const result = await createProductWithTranslations({
                sku: formData.sku,
                priceUsd: parseFloat(formData.priceUsd),
                stockQty: parseInt(formData.stockQty),
                status: 'ACTIVE',
                sourceLang: formData.sourceLang,
                name: formData.name,
                shortDesc: formData.shortDesc,
                detailDesc: formData.detailDesc,
                seoKeywords: formData.seoKeywords,
            });

            if (result.success) {
                setSuccessMsg(`성공: 상품(ID: ${result.productId})이 등록 및 4개국어로 번역 저장되었습니다.`);
                // 입력 폼 초기화
                setFormData({ ...formData, sku: '', name: '', shortDesc: '', detailDesc: '', seoKeywords: '' });
            } else {
                setErrorMsg(result.message || '상품 등록 실패');
            }
        } catch (error) {
            setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">새 상품 등록</h1>
                        <p className="text-gray-500 text-sm mt-1">한국어 또는 영어로 입력하면 나머지 3개 언어로 자동 번역됩니다.</p>
                    </div>

                    {/* 알림 메시지 영역 */}
                    {errorMsg && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                            <p className="font-bold">오류 내용:</p>
                            <p>{errorMsg}</p>
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
                            <p className="font-bold">등록 성공!</p>
                            <p>{successMsg}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

                            {/* 공통 마스터 정보 섹션 */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">공통 상품 정보 (언어 무관)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU (바코드)</label>
                                        <input required type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" placeholder="예: KR-001" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">가격 (USD, $)</label>
                                        <input required type="number" step="0.01" min="0" name="priceUsd" value={formData.priceUsd} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" placeholder="10.50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">초기 재고량 (개)</label>
                                        <input required type="number" min="0" name="stockQty" value={formData.stockQty} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" />
                                    </div>
                                </div>
                            </section>

                            {/* 다국어 번역 대상 정보 섹션 */}
                            <section>
                                <div className="flex justify-between items-end mb-4 pb-2 border-b">
                                    <h2 className="text-lg font-bold text-gray-900">다국어 텍스트 정보</h2>
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm text-gray-600 font-medium">입력하실 언어(원본):</label>
                                        <select
                                            name="sourceLang"
                                            value={formData.sourceLang}
                                            onChange={handleChange}
                                            className="text-sm border-gray-300 rounded p-1 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 border"
                                        >
                                            <option value="ko">🇰🇷 한국어 (Korean)</option>
                                            <option value="en">🇺🇸 영어 (English)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">상품명 <span className="text-red-500">*</span></label>
                                        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" placeholder="상품 이름을 입력하세요" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">요약 설명 (짧은 문구)</label>
                                        <input type="text" name="shortDesc" value={formData.shortDesc} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" placeholder="리스트에 노출될 매력적인 한줄 평" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명 (HTML 가능)</label>
                                        <textarea
                                            name="detailDesc"
                                            rows={6}
                                            value={formData.detailDesc}
                                            onChange={handleChange}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border font-mono text-sm"
                                            placeholder="<p>상세 페이지에 들어갈 내용을 입력하세요.</p>"
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SEO 키워드 (쉼표 구분)</label>
                                        <input type="text" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" placeholder="예: 화장품, 앰플, 수분" />
                                    </div>
                                </div>
                            </section>

                            {/* Submit Button */}
                            <div className="pt-6 border-t flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`px-8 py-3 rounded-md text-white font-bold shadow-sm flex items-center shadow-md transition-colors ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            번역 및 저장 중...
                                        </>
                                    ) : (
                                        '상품 등록 및 자동 번역 실행'
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
