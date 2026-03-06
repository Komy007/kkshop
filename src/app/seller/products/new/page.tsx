'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, Sparkles, Info, CheckCircle } from 'lucide-react';

interface Category { id: string; slug: string; nameKo: string; }

export default function SellerProductNewPage() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [options, setOptions] = useState([{ minQty: '1', maxQty: '', discountPct: '0', freeShipping: false, labelKo: '1개 기본' }]);
    const [submitting, setSubmitting] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        sku: '', priceUsd: '', stockQty: '0', categoryId: '',
        brandName: '', volume: '', origin: '', skinType: '', expiryMonths: '',
        // Korean content (auto-translated to EN/KM/ZH)
        nameKo: '', shortDescKo: '', detailDescKo: '',
        ingredientsKo: '', howToUseKo: '', benefitsKo: '',
    });

    useEffect(() => {
        fetch('/api/admin/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d.filter((c: any) => !c.isSystem) : []));
    }, []);

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const addImages = (files: FileList | null) => {
        if (!files) return;
        const added = Array.from(files).slice(0, 3 - images.length);
        setImages(p => [...p, ...added].slice(0, 3));
        added.forEach(f => {
            const reader = new FileReader();
            reader.onload = e => setPreviews(p => [...p, e.target?.result as string].slice(0, 3));
            reader.readAsDataURL(f);
        });
    };

    const removeImage = (i: number) => {
        setImages(p => p.filter((_, idx) => idx !== i));
        setPreviews(p => p.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nameKo) return alert('상품명(한국어)을 입력해주세요.');
        if (!form.priceUsd) return alert('판매가를 입력해주세요.');
        setSubmitting(true);
        setTranslating(true);

        // Upload images
        let imageUrls: string[] = [];
        if (images.length > 0) {
            try {
                const fd = new FormData();
                images.forEach(f => fd.append('files', f));
                const up = await fetch('/api/upload', { method: 'POST', body: fd });
                const upData = await up.json();
                imageUrls = upData.urls || [];
            } catch { /* ignore */ }
        }
        setTranslating(false);

        const payload = {
            imageUrls,
            options,
            approvalStatus: 'PENDING',  // 항상 검수 대기로 등록
            status: 'INACTIVE',
        };

        const res = await fetch('/api/seller/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        setSubmitting(false);
        if (res.ok) {
            setSuccess(true);
            setTimeout(() => router.push('/seller/products'), 2000);
        } else {
            const d = await res.json();
            alert('등록 실패: ' + (d.error || '알 수 없는 오류'));
        }
    };

    if (success) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">상품 등록 완료!</h2>
            <p className="text-gray-500 text-sm">관리자 검수 후 판매 시작됩니다. (1~2 영업일 소요)</p>
        </div>
    );

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="font-bold text-gray-900 mb-4">{title}</h2>
            {children}
        </div>
    );

    const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );

    const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
    const textarea = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none";

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">새 상품 등록</h1>
                <div className="mt-2 flex items-start gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>등록 후 관리자 검수를 거쳐 판매 시작됩니다. 한국어로 입력하면 영어·중문·크메르어가 <strong>자동 번역</strong>됩니다.</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이미지 */}
                <Section title="📸 상품 이미지 (최대 3장)">
                    <div className="flex gap-3 flex-wrap">
                        {previews.map((src, i) => (
                            <div key={i} className="relative w-24 h-24">
                                <img src={src} className="w-24 h-24 object-cover rounded-xl border" />
                                <button type="button" onClick={() => removeImage(i)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                    <X className="w-3 h-3" />
                                </button>
                                {i === 0 && <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 rounded">대표</div>}
                            </div>
                        ))}
                        {images.length < 3 && (
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-600 transition-colors">
                                <Upload className="w-5 h-5 mb-1" />
                                <span className="text-xs">추가</span>
                            </button>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e.target.files)} />
                </Section>

                {/* 기본 정보 */}
                <Section title="📦 기본 정보">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="SKU (상품코드)" required>
                            <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="예: MY-BRAND-001" className={inp} required />
                        </Field>
                        <Field label="카테고리" required>
                            <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={inp} required>
                                <option value="">카테고리 선택</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.nameKo}</option>)}
                            </select>
                        </Field>
                        <Field label="브랜드명">
                            <input value={form.brandName} onChange={e => set('brandName', e.target.value)} placeholder="브랜드명" className={inp} />
                        </Field>
                        <Field label="판매가 (USD)" required>
                            <input type="number" step="0.01" value={form.priceUsd} onChange={e => set('priceUsd', e.target.value)} placeholder="0.00" className={inp} required />
                        </Field>
                        <Field label="초기 재고수량">
                            <input type="number" value={form.stockQty} onChange={e => set('stockQty', e.target.value)} className={inp} />
                        </Field>
                        <Field label="용량/중량">
                            <input value={form.volume} onChange={e => set('volume', e.target.value)} placeholder="예: 150ml" className={inp} />
                        </Field>
                        <Field label="원산지">
                            <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="예: 대한민국" className={inp} />
                        </Field>
                        <Field label="피부 타입">
                            <input value={form.skinType} onChange={e => set('skinType', e.target.value)} placeholder="예: 모든 피부" className={inp} />
                        </Field>
                    </div>
                </Section>

                {/* 수량별 옵션 설정 */}
                <Section title="단위별 할인 및 파격 옵션">
                    <div className="space-y-4">
                        {options.map((opt, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_2fr_auto] gap-3 items-end bg-teal-50/50 p-4 rounded-xl border border-teal-100/50 relative">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">최소 수량</label>
                                    <input type="number" value={opt.minQty} onChange={e => {
                                        setOptions(options.map((o, idx) => idx === i ? { ...o, minQty: e.target.value } : o));
                                    }} className={inp} min="1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">최대 수량</label>
                                    <input type="number" value={opt.maxQty} onChange={e => {
                                        setOptions(options.map((o, idx) => idx === i ? { ...o, maxQty: e.target.value } : o));
                                    }} className={inp} placeholder="무제한" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">할인율(%)</label>
                                    <input type="number" value={opt.discountPct} onChange={e => {
                                        setOptions(options.map((o, idx) => idx === i ? { ...o, discountPct: e.target.value } : o));
                                    }} className={inp} />
                                </div>
                                <div className="pb-3">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap font-medium text-gray-700">
                                        <input type="checkbox" checked={opt.freeShipping} onChange={e => {
                                            setOptions(options.map((o, idx) => idx === i ? { ...o, freeShipping: e.target.checked } : o));
                                        }} className="rounded text-teal-600 focus:ring-teal-500 border-gray-300 w-4 h-4" />
                                        무료 배송
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">옵션 라벨 (한국어)</label>
                                    <input value={opt.labelKo} onChange={e => {
                                        setOptions(options.map((o, idx) => idx === i ? { ...o, labelKo: e.target.value } : o));
                                    }} className={inp} placeholder="예: 2개 구매시 10% 할인" />
                                    <div className="text-[10px] text-teal-600 mt-1">※ 영어로 자동 번역됩니다.</div>
                                </div>
                                {options.length > 1 && (
                                    <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="mb-2 text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors absolute top-2 right-2 md:relative md:top-0 md:right-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => setOptions([...options, { minQty: '2', maxQty: '', discountPct: '10', freeShipping: false, labelKo: '' }])}
                            className="text-sm text-teal-600 font-semibold flex items-center gap-1 hover:text-teal-700 bg-teal-50 px-3 py-2 rounded-lg transition-colors inline-block mt-2 border border-teal-100">
                            + 수량별 옵션 추가하기
                        </button>
                    </div>
                </Section>

                {/* 다국어 콘텐츠 */}
                <Section title="🌐 상품 설명 (한국어 입력 → 자동 4개국어 번역)">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">
                            <Sparkles className="w-3.5 h-3.5" />
                            한국어로 작성하면 영어·중문·크메르어가 자동 생성됩니다
                        </div>
                        <Field label="상품명 (한국어)" required>
                            <input value={form.nameKo} onChange={e => set('nameKo', e.target.value)} placeholder="예: 수분 앰플 세럼 50ml" className={inp} required />
                        </Field>
                        <Field label="짧은 설명">
                            <textarea value={form.shortDescKo} onChange={e => set('shortDescKo', e.target.value)}
                                placeholder="한 두 줄 핵심 설명 (상품 카드에 표시)" rows={2} className={textarea} />
                        </Field>
                        <Field label="상세 설명">
                            <textarea value={form.detailDescKo} onChange={e => set('detailDescKo', e.target.value)}
                                placeholder="상품 특징, 사용 효과 등 상세하게 기재" rows={5} className={textarea} />
                        </Field>
                        <Field label="주요 성분">
                            <textarea value={form.ingredientsKo} onChange={e => set('ingredientsKo', e.target.value)}
                                placeholder="예: 히알루론산, 나이아신아마이드, 판테놀…" rows={3} className={textarea} />
                        </Field>
                        <Field label="사용 방법">
                            <textarea value={form.howToUseKo} onChange={e => set('howToUseKo', e.target.value)}
                                placeholder="예: 세안 후 적당량을 손바닥에 덜어…" rows={3} className={textarea} />
                        </Field>
                        <Field label="효능 / 특징">
                            <textarea value={form.benefitsKo} onChange={e => set('benefitsKo', e.target.value)}
                                placeholder="예: 24시간 수분 공급, 진정 효과, 미백…" rows={3} className={textarea} />
                        </Field>
                    </div>
                </Section>

                <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-70 text-base shadow-md">
                    {submitting ? (
                        <>{translating ? <><Loader2 className="w-5 h-5 animate-spin" /> 자동 번역 및 등록 중...</> : <><Loader2 className="w-5 h-5 animate-spin" /> 등록 처리 중...</>}</>
                    ) : (
                        <><Sparkles className="w-5 h-5" /> 등록 및 번역 요청</>
                    )}
                </button>
            </form>
        </div>
    );
}
