'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Globe, Upload, X, ImagePlus, Package, Tag, Leaf, Droplets, Star, Sparkles } from 'lucide-react';

interface ImageItem { file: File; preview: string; url?: string; }
interface Category { id: string; slug: string; nameKo: string; }

const MAX_IMAGES = 3;

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [options, setOptions] = useState([{ minQty: '1', maxQty: '', discountPct: '0', freeShipping: false, labelKo: '1개 기본' }]);

    const [form, setForm] = useState({
        sku: '', priceUsd: '', stockQty: '100',
        categoryId: '', isNew: false,
        baseLang: 'ko',
        brandName: '', volume: '', skinType: '', origin: '대한민국',
        expiryMonths: '', certifications: '',
        name: '', shortDesc: '', detailDesc: '',
        ingredients: '', howToUse: '', benefits: '', seoKeywords: '',
    });

    useEffect(() => {
        fetch('/api/admin/categories')
            .then(r => r.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
        setForm(prev => ({ ...prev, [target.name]: value }));
    };

    const addFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        const toAdd = arr.slice(0, MAX_IMAGES - images.length);
        setImages(prev => [...prev, ...toAdd.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    }, [images.length]);

    const removeImage = (idx: number) => {
        setImages(prev => {
            const item = prev[idx];
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploaded: string[] = [];
        for (const img of images) {
            if (!img) continue;
            if (img.url) { uploaded.push(img.url); continue; }
            const fd = new FormData(); fd.append('file', img.file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.url) uploaded.push(data.url);
        }
        return uploaded;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setErrorMsg(''); setSuccessMsg('');
        try {
            const imageUrls = images.length > 0 ? await uploadImages() : [];
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    imageUrls,
                    isNew: form.isNew,
                    categoryId: form.categoryId || null,
                    expiryMonths: form.expiryMonths ? parseInt(form.expiryMonths) : null,
                    options,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '저장 실패');
            setSuccessMsg('✅ 상품이 등록되고 4개국어로 자동 번역되었습니다!');
            setTimeout(() => router.push('/admin/products'), 1800);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const Sec = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) => (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">{icon}{title}</h3>
            {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="text-blue-500 w-6 h-6" />상품 등록
                </h1>
                <p className="text-sm text-gray-500 mt-1">구글 AI로 한·영·크메르·중문 자동 번역됩니다.</p>
            </div>

            {errorMsg && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md text-sm font-bold">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* ① 이미지 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<ImagePlus className="w-5 h-5 text-blue-500" />} title="상품 이미지 (최대 3장)" desc="첫 번째 이미지 = 대표사진 • 나중에 추가도 가능" />
                    <div className="p-5">
                        {images.length < MAX_IMAGES && (
                            <div className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                                onDragEnter={() => setDragActive(true)} onDragLeave={() => setDragActive(false)}
                                onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
                                onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-600">클릭 또는 드래그</p>
                                <p className="text-xs text-gray-400 mt-1">PNG / JPG / WebP · 최대 10MB</p>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
                            </div>
                        )}
                        {images.length > 0 && (
                            <div className={`grid grid-cols-3 gap-3 ${images.length < MAX_IMAGES ? 'mt-4' : ''}`}>
                                {images.map((img, i) => (
                                    <div key={i} className="relative group aspect-square">
                                        <img src={img.preview} className="w-full h-full object-cover rounded-xl border border-gray-200" />
                                        {i === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">🌟 대표</span>}
                                        <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ② 수량별 파격 옵션 설정 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Star className="w-5 h-5 text-yellow-500" />} title="단위별 할인 및 파격 옵션" desc="많이 살수록, 묶음으로 살수록 혜택을 제공합니다." />
                    <div className="p-5 space-y-4">
                        {options.map((opt, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_2fr_auto] gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">최소 수량</label>
                                    <input type="number" value={opt.minQty} onChange={e => {
                                        setOptions(options.map((o, idx) => idx === i ? { ...o, minQty: e.target.value } : o));
                                    }} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" min="1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">최대 수량</label>
                                    <input type="number" value={opt.maxQty} onChange={e => {
                                        setOptions(options.map((o, idx) => idx === i ? { ...o, maxQty: e.target.value } : o));
                                    }} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="무제한" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">할인율(%)</label>
                                    <input type="number" value={opt.discountPct} onChange={e => {
                                        setOptions(options.map((o, idx) => idx === i ? { ...o, discountPct: e.target.value } : o));
                                    }} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                                <div className="pb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                                        <input type="checkbox" checked={opt.freeShipping} onChange={e => {
                                            setOptions(options.map((o, idx) => idx === i ? { ...o, freeShipping: e.target.checked } : o));
                                        }} className="rounded text-blue-600 focus:ring-blue-500" />
                                        무료 배송
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">옵션 라벨 (선택)</label>
                                    <input value={opt.labelKo} onChange={e => {
                                        setOptions(options.map((o, idx) => idx === i ? { ...o, labelKo: e.target.value } : o));
                                    }} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="예: 2개 구매시 10% 할인" />
                                </div>
                                {options.length > 1 && (
                                    <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="mb-1 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => setOptions([...options, { minQty: '2', maxQty: '', discountPct: '10', freeShipping: false, labelKo: '' }])}
                            className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700">
                            + 수량별 옵션 추가하기
                        </button>
                    </div>
                </div>

                {/* ③ 기본정보 + 카테고리 + 신상품 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Package className="w-5 h-5 text-gray-500" />} title="기본 정보 & 카테고리" />
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">SKU <span className="text-red-500">*</span></label>
                            <input required name="sku" value={form.sku} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="예: COSRX-AHA-001" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
                            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="">— 카테고리 선택 —</option>
                                {categories.filter(c => !['new', 'best', 'sale', 'foryou'].includes(c.slug)).map(c => (
                                    <option key={c.id} value={c.id}>{c.nameKo}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">판매가 (USD) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                <input required type="number" step="0.01" name="priceUsd" value={form.priceUsd} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 pl-6 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">재고 수량</label>
                            <input type="number" name="stockQty" value={form.stockQty} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>

                        {/* 신상품 등록 토글 */}
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all select-none hover:border-yellow-300 hover:bg-yellow-50 group"
                                style={{ borderColor: form.isNew ? '#F59E0B' : '#E5E7EB', background: form.isNew ? '#FFFBEB' : '' }}>
                                <input type="checkbox" name="isNew" checked={form.isNew} onChange={handleChange} className="sr-only" />
                                <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.isNew ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isNew ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-gray-800 flex items-center gap-1">
                                        <Sparkles className={`w-4 h-4 ${form.isNew ? 'text-yellow-500' : 'text-gray-400'}`} /> 신상품으로 등록
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">홈 & 신상품 섹션에 표시됩니다</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ④ 상품 사양 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Tag className="w-5 h-5 text-purple-500" />} title="상품 사양" desc="구매 결정에 핵심이 되는 정보" />
                    <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { label: '브랜드명', name: 'brandName', placeholder: '예: COSRX, LANEIGE' },
                            { label: '용량/중량', name: 'volume', placeholder: '예: 150ml, 50g' },
                            { label: '원산지', name: 'origin', placeholder: '예: 대한민국' },
                            { label: '피부타입', name: 'skinType', placeholder: '예: 모든피부, 건성' },
                            { label: '유통기한(개월)', name: 'expiryMonths', placeholder: '예: 36' },
                            { label: '인증/특징', name: 'certifications', placeholder: '예: 비건, EWG' },
                        ].map(f => (
                            <div key={f.name}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                                <input name={f.name} value={(form as any)[f.name]} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={f.placeholder} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ⑤ 다국어 콘텐츠 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" />콘텐츠 (4개국어 자동 번역)</h3>
                            <p className="text-xs text-blue-600 mt-0.5">아래 내용이 한·영·크메르·중문으로 번역됩니다</p>
                        </div>
                        <select name="baseLang" value={form.baseLang} onChange={handleChange} className="border border-blue-200 rounded-lg py-1.5 px-2 text-sm text-blue-700 font-bold bg-white focus:outline-none">
                            <option value="ko">🇰🇷 한국어</option>
                            <option value="en">🇺🇸 English</option>
                        </select>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상품명 <span className="text-red-500">*</span></label>
                            <input required name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="예: COSRX AHA 7 화이트헤드 파워 리퀴드 150ml" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">한 줄 요약 <span className="text-gray-400">(목록·검색 결과에 표시)</span></label>
                            <input name="shortDesc" value={form.shortDesc} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="예: 각질 제거 + 모공 케어, 7% AHA로 맑고 투명한 피부" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-green-500" />주요 성분</label>
                            <textarea name="ingredients" rows={2} value={form.ingredients} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="예: AHA(글리콜산) 7%, 판테놀, 나이아신아마이드, 히알루론산" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500" />사용 방법</label>
                            <textarea name="howToUse" rows={3} value={form.howToUse} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="1. 세안 후 화장솜에 묻혀 얼굴에 닦아내기&#10;2. 주 2~3회 사용&#10;3. 사용 후 자외선차단제 필수" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" />주요 효능 / 특징</label>
                            <textarea name="benefits" rows={3} value={form.benefits} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="• 각질 제거로 맑은 피부톤&#10;• 모공 케어&#10;• 저자극 포뮬라" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상세 설명</label>
                            <textarea name="detailDesc" rows={4} value={form.detailDesc} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="브랜드 스토리, 개발 배경, 차별점 등을 자세히 입력하세요." />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">SEO 키워드</label>
                            <input name="seoKeywords" value={form.seoKeywords} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="예: 각질제거, AHA, COSRX, 스킨케어" />
                        </div>
                    </div>
                </div>

                {/* 저장 */}
                <div className="flex justify-end gap-3 pb-8">
                    <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
                    <button type="submit" disabled={isLoading} className="px-8 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-blue-600 rounded-xl shadow hover:bg-blue-700 disabled:opacity-70">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading ? '저장 & 번역 중...' : '저장 & 4개국어 자동 번역'}
                    </button>
                </div>
            </form>
        </div>
    );
}
