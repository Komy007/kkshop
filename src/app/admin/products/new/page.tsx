'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Globe, Upload, X, ImagePlus, Package, Tag, Leaf, Droplets } from 'lucide-react';

interface ImagePreview {
    file: File;
    preview: string;
    url?: string;
}

const MAX_IMAGES = 3;

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        // 시스템
        sku: '',
        priceUsd: '',
        stockQty: '0',
        baseLang: 'ko',
        // 브랜드/상품 기본정보 (비다국어)
        brandName: '',
        volume: '',
        skinType: '',
        origin: '대한민국',
        expiryMonths: '',
        certifications: '',
        // 다국어 텍스트
        name: '',
        shortDesc: '',
        detailDesc: '',
        ingredients: '',
        howToUse: '',
        benefits: '',
        seoKeywords: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        const remaining = MAX_IMAGES - images.length;
        const toAdd = arr.slice(0, remaining);
        setImages(prev => [...prev, ...toAdd.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    }, [images.length]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        addFiles(e.dataTransfer.files);
    };

    const removeImage = (idx: number) => {
        setImages(prev => {
            const item = prev[idx];
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploaded: string[] = [];
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (!img) continue;
            if (img.url) { uploaded.push(img.url); continue; }
            const fd = new FormData();
            fd.append('file', img.file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.url) uploaded.push(data.url);
        }
        return uploaded;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) { setErrorMsg('상품 이미지를 최소 1장 업로드해주세요.'); return; }
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const imageUrls = await uploadImages();
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    imageUrls,
                    expiryMonths: formData.expiryMonths ? parseInt(formData.expiryMonths) : null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save product');
            setSuccessMsg('✅ 상품이 등록되고 4개국어로 자동 번역되었습니다!');
            setTimeout(() => router.push('/admin/products'), 2000);
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const SectionHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) => (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                {icon}{title}
            </h3>
            {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="text-blue-500 w-6 h-6" />
                    상품 등록
                </h1>
                <p className="mt-1 text-sm text-gray-500">입력 정보는 구글 AI로 한·영·크메르·중문 자동 번역됩니다.</p>
            </div>

            {errorMsg && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md text-sm font-bold">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ① 상품 이미지 (1~3장) */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <SectionHeader
                        icon={<ImagePlus className="w-5 h-5 text-blue-500" />}
                        title="상품 이미지 (1~3장, 필수)"
                        desc="첫 번째 이미지 = 대표사진. 정사각형(1:1) 비율 권장"
                    />
                    <div className="p-6">
                        {images.length < MAX_IMAGES && (
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                                onDragEnter={() => setDragActive(true)}
                                onDragLeave={() => setDragActive(false)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700">클릭 또는 드래그로 이미지 추가</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP · 최대 {MAX_IMAGES}장 · 각 10MB 이하</p>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                                    onChange={e => e.target.files && addFiles(e.target.files)} />
                            </div>
                        )}
                        {images.length > 0 && (
                            <div className={`grid grid-cols-3 gap-4 ${images.length < MAX_IMAGES ? 'mt-4' : ''}`}>
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative group aspect-square">
                                        <img src={img.preview} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm" />
                                        {idx === 0 && (
                                            <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow">🌟 대표</span>
                                        )}
                                        <button type="button" onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ② 기본 시스템 정보 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <SectionHeader icon={<Package className="w-5 h-5 text-gray-500" />} title="기본 정보" />
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU <span className="text-red-500">*</span></label>
                            <input required name="sku" value={formData.sku} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="예: COSRX-AHA-001" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">판매가 (USD) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                <input required type="number" step="0.01" name="priceUsd" value={formData.priceUsd} onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">재고 수량</label>
                            <input type="number" name="stockQty" value={formData.stockQty} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

                {/* ③ 상품 사양 (구매 결정에 핵심) */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <SectionHeader
                        icon={<Tag className="w-5 h-5 text-purple-500" />}
                        title="상품 사양 (구매 결정 핵심 정보)"
                        desc="고객이 구매를 결정할 때 가장 많이 찾는 정보입니다."
                    />
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">브랜드명</label>
                            <input name="brandName" value={formData.brandName} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="예: COSRX, LANEIGE" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">용량/중량</label>
                            <input name="volume" value={formData.volume} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="예: 150ml, 50g, 1매" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">원산지</label>
                            <input name="origin" value={formData.origin} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="예: 대한민국" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">피부타입</label>
                            <input name="skinType" value={formData.skinType} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="예: 모든피부, 건성, 지성" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">유통기한</label>
                            <input type="number" name="expiryMonths" value={formData.expiryMonths} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="개월 수 (예: 36)" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">인증/특징</label>
                            <input name="certifications" value={formData.certifications} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="예: 비건, 동물실험없음, EWG" />
                        </div>
                    </div>
                </div>

                {/* ④ 다국어 정보 (자동 번역) */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                상품 정보 (4개국어 자동 번역)
                            </h3>
                            <p className="text-xs text-blue-600 mt-0.5">아래 내용이 한·영·크메르·중문으로 자동 번역됩니다</p>
                        </div>
                        <select name="baseLang" value={formData.baseLang} onChange={handleChange}
                            className="rounded-lg border border-blue-300 bg-white py-1.5 pl-3 pr-8 text-sm font-bold text-blue-700 focus:outline-none">
                            <option value="ko">🇰🇷 한국어</option>
                            <option value="en">🇺🇸 English</option>
                        </select>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">상품명 <span className="text-red-500">*</span></label>
                            <input required name="name" value={formData.name} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="예: COSRX AHA 7 화이트헤드 파워 리퀴드" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">한 줄 요약 <span className="text-gray-400 text-xs">(목록에 표시)</span></label>
                            <input name="shortDesc" value={formData.shortDesc} onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="예: 각질 제거+모공 케어, 7% AHA 성분으로 맑고 투명한 피부" />
                        </div>

                        <div className="border-t border-gray-100 pt-5 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                    <Leaf className="w-4 h-4 text-green-500" />
                                    주요 성분
                                </label>
                                <textarea name="ingredients" rows={3} value={formData.ingredients} onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                    placeholder="예: AHA(글리콜산) 7%, 판테놀, 나이아신아마이드, 히알루론산..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                    <Droplets className="w-4 h-4 text-blue-500" />
                                    사용 방법
                                </label>
                                <textarea name="howToUse" rows={4} value={formData.howToUse} onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                    placeholder="예:
1. 세안 후 스킨/토너 단계에서 사용
2. 적당량(2~3방울)을 화장솜에 묻혀 얼굴에 부드럽게 닦아내기
3. 일주일 2~3회 사용 권장
4. 사용 후 자외선 차단제 필수 사용" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">✨ 주요 효능 / 제품 특징</label>
                                <textarea name="benefits" rows={4} value={formData.benefits} onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                    placeholder="예:
• 블랙헤드·화이트헤드 집중 케어
• 칙칙한 각질 제거로 맑고 투명한 피부톤
• 피부 결을 매끄럽게 정돈
• 피부 자극 없는 저자극 포뮬라" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                                <textarea name="detailDesc" rows={5} value={formData.detailDesc} onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                    placeholder="상품 스토리, 개발 철학, 차별점 등 상세한 정보를 입력하세요." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SEO 키워드</label>
                                <input name="seoKeywords" value={formData.seoKeywords} onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="콤마(,)로 구분 (예: 각질제거, AHA, 클리어스킨, COSRX)" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end gap-3 pb-8">
                    <button type="button" onClick={() => router.back()} disabled={isLoading}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                        취소
                    </button>
                    <button type="submit" disabled={isLoading}
                        className="px-8 py-2.5 flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow hover:bg-blue-700 transition-colors disabled:opacity-70">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading ? '저장 및 번역 중...' : '저장 & 4개국어 자동 번역'}
                    </button>
                </div>
            </form>
        </div>
    );
}
