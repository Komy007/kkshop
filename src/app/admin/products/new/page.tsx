'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Globe, Upload, X, ImagePlus, GripVertical } from 'lucide-react';

interface ImagePreview {
    file: File;
    preview: string;
    uploading?: boolean;
    url?: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        sku: '',
        priceUsd: '',
        stockQty: '0',
        baseLang: 'ko',
        name: '',
        shortDesc: '',
        detailDesc: '',
        seoKeywords: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        const remaining = 5 - images.length;
        const toAdd = arr.slice(0, remaining);
        const newPreviews: ImagePreview[] = toAdd.map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setImages(prev => [...prev, ...newPreviews]);
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
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            // 1. Upload images first
            const imageUrls = await uploadImages();

            // 2. Save product with images
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, imageUrls }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save product');

            setSuccessMsg('✅ 상품이 등록되고 모든 언어로 번역 및 저장되었습니다!');
            setTimeout(() => router.push('/admin/products'), 2000);

        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="text-blue-500 w-6 h-6" />
                    상품 등록 (자동 번역 연동)
                </h1>
                <p className="mt-1 text-sm text-gray-500">기본 언어로 입력하시면 구글 AI가 4개국어로 자동 번역합니다.</p>
            </div>

            {errorMsg && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md text-sm font-bold">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Section */}
                <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <ImagePlus className="w-5 h-5 text-blue-500" />
                            상품 이미지 (최대 5장, 첫 번째 = 대표사진)
                        </h3>
                    </div>
                    <div className="p-6">
                        {/* Drop Zone */}
                        {images.length < 5 && (
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                                onDragEnter={() => setDragActive(true)}
                                onDragLeave={() => setDragActive(false)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700">클릭하거나 이미지를 드래그하여 업로드</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP · 최대 5장 · 각 10MB 이하</p>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                                    onChange={e => e.target.files && addFiles(e.target.files)} />
                            </div>
                        )}

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className={`grid grid-cols-5 gap-3 ${images.length < 5 ? 'mt-4' : ''}`}>
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative group aspect-square">
                                        <img src={img.preview} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                                        {idx === 0 && (
                                            <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">대표</span>
                                        )}
                                        <button type="button" onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                            <X className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-1 left-1 text-xs text-gray-400 bg-white/80 px-1 rounded">{idx + 1}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
                    <div className="p-6 space-y-6">
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

                        {/* Multi-language Section */}
                        <div>
                            <div className="flex items-center justify-between border-b pb-2 mb-4">
                                <h3 className="text-base font-semibold text-gray-900">다국어 정보 입력</h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">입력 언어:</label>
                                    <select name="baseLang" value={formData.baseLang} onChange={handleChange}
                                        className="rounded-md border border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-600">
                                        <option value="ko">🇰🇷 한국어</option>
                                        <option value="en">🇺🇸 영어</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">상품명 <span className="text-red-500">*</span></label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        placeholder="상품 이름 (4개국어 자동 번역)" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">요약 설명</label>
                                    <input type="text" name="shortDesc" value={formData.shortDesc} onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        placeholder="목록에서 보여질 짧은 한 줄 설명" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                                    <textarea name="detailDesc" rows={6} value={formData.detailDesc} onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        placeholder="제품 스펙, 사용법, 효능, 성분 등 상세 정보를 입력하세요." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SEO 키워드</label>
                                    <input type="text" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange}
                                        className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        placeholder="콤마(,)로 구분 (예: 스킨케어, 보습, 선크림)" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
                        <button type="button" onClick={() => router.back()} disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            취소
                        </button>
                        <button type="submit" disabled={isLoading}
                            className="px-6 py-2 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-70">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isLoading ? '저장 및 번역 중...' : '저장 & 원클릭 자동 번역'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
