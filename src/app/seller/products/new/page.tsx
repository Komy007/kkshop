'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, Sparkles, Info, CheckCircle, Plus, Package } from 'lucide-react';
import DraggableImageGrid from '@/components/DraggableImageGrid';

interface Category { id: string; slug: string; nameKo: string; nameEn?: string; parentId?: string | null; }

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const VOLUME_PRESETS = ['30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '300ml', '500ml', '1L'];
const UNIT_LABELS = ['개', 'box', 'pack', 'set', '병', '튜브', '매', '장', '캡슐'];

// ── 스타일 상수 ────────────────────────────────────────────────────────────
const inp  = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const ta   = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none";
const vInp = "px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="font-extrabold text-gray-900 text-base leading-tight">{title}</h2>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            <div className="mt-4">{children}</div>
        </div>
    );
}

function Field({ en, ko, required, children }: { en: string; ko: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="block mb-1.5">
                <span className="text-sm font-semibold text-gray-800">
                    {en}{required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                <span className="text-[11px] text-gray-400 ml-1.5">{ko}</span>
            </label>
            {children}
        </div>
    );
}

function ToggleSwitch({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={onChange}
                className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 ${checked ? 'bg-teal-500' : 'bg-gray-200'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm font-semibold text-gray-800">
                {label}
                {sub && <span className="text-xs text-gray-400 ml-2 font-normal">{sub}</span>}
            </span>
        </label>
    );
}

export default function SellerProductNewPage() {
    const router  = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [images,      setImages]     = useState<File[]>([]);
    const [previews,    setPreviews]   = useState<string[]>([]);
    const [categories,  setCategories] = useState<Category[]>([]);
    const [catLoading,  setCatLoading] = useState(true);
    const [catError,    setCatError]   = useState(false);
    const [submitting,  setSubmitting] = useState(false);
    const [translating, setTranslating]= useState(false);
    const [success,     setSuccess]    = useState(false);

    // ── Bulk discount toggle ───────────────────────────────────────────────
    const [bulkDiscountEnabled, setBulkDiscountEnabled] = useState(false);
    const [options, setOptions] = useState([{ minQty: '3', maxQty: '', discountPct: '5', freeShipping: false, labelKo: '' }]);

    // ── Variant state ──────────────────────────────────────────────────────
    const [variantEnabled,  setVariantEnabled]  = useState(false);
    const [enableColor,     setEnableColor]     = useState(true);
    const [enableSize,      setEnableSize]      = useState(false);
    const [enableVolume,    setEnableVolume]    = useState(false);
    const [enableCustom,    setEnableCustom]    = useState(false);
    const [colorVars,  setColorVars]  = useState([{ name: '', hex: '#FF6B6B', stock: '0', price: '' }]);
    const [sizeVars,   setSizeVars]   = useState<{ label: string; stock: string; price: string }[]>([]);
    const [volumeVars, setVolumeVars] = useState<{ label: string; stock: string; price: string }[]>([]);
    const [customVars, setCustomVars] = useState([{ label: '', stock: '0', price: '' }]);

    const [form, setForm] = useState({
        sku: '', priceUsd: '', stockQty: '0', categoryId: '',
        brandName: '', volume: '', origin: '', skinType: '', expiryMonths: '', certifications: '',
        unitLabel: '개', unitsPerPkg: '',
        nameKo: '', shortDescKo: '', detailDescKo: '',
        ingredientsKo: '', howToUseKo: '', benefitsKo: '',
    });

    const loadCategories = () => {
        setCatLoading(true); setCatError(false);
        fetch('/api/categories')
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(d => { setCategories(Array.isArray(d) ? d : []); setCatLoading(false); })
            .catch(() => { setCatError(true); setCatLoading(false); });
    };

    useEffect(() => { loadCategories(); }, []);

    /* Global Ctrl+V image paste */
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const imageFiles: File[] = [];
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) imageFiles.push(file);
                }
            }
            if (!imageFiles.length) return;
            const added = imageFiles.slice(0, 10 - images.length);
            setImages(p => [...p, ...added].slice(0, 10));
            added.forEach(f => {
                const reader = new FileReader();
                reader.onload = ev => setPreviews(p => [...p, ev.target?.result as string].slice(0, 10));
                reader.readAsDataURL(f);
            });
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [images.length]);

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const addImages = (files: FileList | null) => {
        if (!files) return;
        const added = Array.from(files).slice(0, 10 - images.length);
        setImages(p => [...p, ...added].slice(0, 10));
        added.forEach(f => {
            const reader = new FileReader();
            reader.onload = e => setPreviews(p => [...p, e.target?.result as string].slice(0, 10));
            reader.readAsDataURL(f);
        });
    };

    const removeImage = (i: number) => {
        setImages(p => p.filter((_, idx) => idx !== i));
        setPreviews(p => p.filter((_, idx) => idx !== i));
    };

    const reorderImages = (from: number, to: number) => {
        setImages(prev => { const a = [...prev]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return a; });
        setPreviews(prev => { const a = [...prev]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return a; });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nameKo)     return alert('Product name is required. · 상품명을 입력해주세요.');
        if (!form.priceUsd)   return alert('Price is required. · 판매가를 입력해주세요.');
        if (!form.categoryId) return alert('Please select a category. · 카테고리를 선택해주세요.');

        setSubmitting(true); setTranslating(true);

        /* Upload images */
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

        // ── Build variants payload (multi-type) ─────────────────────────
        let variantsPayload: any[] = [];
        if (variantEnabled) {
            let sortIdx = 0;
            if (enableColor) {
                colorVars.filter(v => v.name.trim()).forEach(v => {
                    variantsPayload.push({
                        variantType: 'COLOR',
                        variantValue: `${v.name.trim()}|${v.hex}`,
                        stockQty: parseInt(v.stock) || 0,
                        priceUsd: v.price || null,
                        sortOrder: sortIdx++,
                    });
                });
            }
            if (enableSize) {
                sizeVars.filter(v => v.label.trim()).forEach(v => {
                    variantsPayload.push({
                        variantType: 'SIZE',
                        variantValue: v.label,
                        stockQty: parseInt(v.stock) || 0,
                        priceUsd: v.price || null,
                        sortOrder: sortIdx++,
                    });
                });
            }
            if (enableVolume) {
                volumeVars.filter(v => v.label.trim()).forEach(v => {
                    variantsPayload.push({
                        variantType: 'VOLUME',
                        variantValue: v.label,
                        stockQty: parseInt(v.stock) || 0,
                        priceUsd: v.price || null,
                        sortOrder: sortIdx++,
                    });
                });
            }
            if (enableCustom) {
                customVars.filter(v => v.label.trim()).forEach(v => {
                    variantsPayload.push({
                        variantType: 'OTHER',
                        variantValue: v.label.trim(),
                        stockQty: parseInt(v.stock) || 0,
                        priceUsd: v.price || null,
                        sortOrder: sortIdx++,
                    });
                });
            }
        }

        const payload = {
            ...form,
            unitsPerPkg: form.unitsPerPkg ? parseInt(form.unitsPerPkg) : null,
            imageUrls,
            options: bulkDiscountEnabled ? options : [],
            variants: variantsPayload,
            approvalStatus: 'PENDING',
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
            setTimeout(() => router.push('/seller/products'), 2200);
        } else {
            const d = await res.json();
            alert('Registration failed · 등록 실패: ' + (d.error || 'Unknown error'));
        }
    };

    /* ── Success screen ── */
    if (success) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Product Submitted!</h2>
            <p className="text-sm text-gray-500">상품 등록 완료!</p>
            <p className="text-sm text-gray-400 mt-2">
                Pending admin review — usually 1–2 business days.
                <span className="block text-xs opacity-70">관리자 검수 후 판매 시작됩니다.</span>
            </p>
            <p className="text-xs text-gray-300 mt-3">Redirecting… · 이동 중…</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto py-7 px-4">

            {/* Page header */}
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900">Register New Product</h1>
                <p className="text-sm text-gray-400 mt-0.5">새 상품 등록</p>
                <div className="mt-3 flex items-start gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>Auto-translation enabled</strong> — enter product info and it will be auto-translated into English, Chinese &amp; Khmer.
                        <span className="block text-xs opacity-75 mt-0.5">한국어로 입력하면 영어·중문·크메르어 자동 번역됩니다.</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Images ── */}
                <Section title="📸 Product Images" sub="상품 이미지 — max 10 photos · 최대 10장 · drag to reorder">
                    <div className="flex gap-3 flex-wrap items-start">
                        {previews.length > 0 && (
                            <DraggableImageGrid
                                images={previews.map((src) => ({ id: src, src }))}
                                onReorder={reorderImages}
                                onRemove={removeImage}
                                coverLabel="Main"
                                layout="flex"
                            />
                        )}
                        {images.length < 10 && (
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-600 transition-colors">
                                <Upload className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Add</span>
                                <span className="text-[9px] opacity-60 mt-0.5">or Ctrl+V</span>
                            </button>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e.target.files)} />
                </Section>

                {/* ── Basic info ── */}
                <Section title="📦 Basic Information" sub="기본 정보">
                    <div className="grid grid-cols-2 gap-4">
                        <Field en="SKU (Product Code)" ko="상품코드" required>
                            <input value={form.sku} onChange={e => set('sku', e.target.value)}
                                placeholder="e.g. MY-BRAND-001" className={inp} required />
                        </Field>
                        <Field en="Category" ko="카테고리" required>
                            {catLoading ? (
                                <div className={`${inp} flex items-center gap-2 text-gray-400 bg-gray-50`}>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading…</span>
                                </div>
                            ) : catError ? (
                                <div className="space-y-1">
                                    <div className={`${inp} flex items-center justify-between bg-red-50 border-red-200 text-red-600`}>
                                        <span className="text-sm">Failed · 불러오기 실패</span>
                                        <button type="button" onClick={loadCategories} className="text-xs font-bold underline ml-2">Retry</button>
                                    </div>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className={`${inp} bg-amber-50 border-amber-200 text-amber-700 text-sm`}>
                                    No categories — ask admin · 카테고리 없음
                                </div>
                            ) : (
                                <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={inp} required>
                                    <option value="">— Select category · 카테고리 선택 —</option>
                                    {categories.filter(c => !c.parentId).map(parent => {
                                        const subs = categories.filter(c => c.parentId === parent.id);
                                        return subs.length > 0 ? (
                                            <optgroup key={parent.id} label={`📁 ${parent.nameEn || parent.nameKo}`}>
                                                {subs.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nameEn || s.nameKo}</option>
                                                ))}
                                            </optgroup>
                                        ) : (
                                            <option key={parent.id} value={parent.id}>{parent.nameEn || parent.nameKo}</option>
                                        );
                                    })}
                                </select>
                            )}
                        </Field>
                        <Field en="Brand Name" ko="브랜드명">
                            <input value={form.brandName} onChange={e => set('brandName', e.target.value)}
                                placeholder="Brand name" className={inp} />
                        </Field>
                        <Field en="Price (USD)" ko="판매가" required>
                            <input type="number" step="0.01" value={form.priceUsd} onChange={e => set('priceUsd', e.target.value)}
                                placeholder="0.00" className={inp} required />
                        </Field>
                        <Field en="Initial Stock Qty" ko="초기 재고수량">
                            <input type="number" value={form.stockQty} onChange={e => set('stockQty', e.target.value)} className={inp} />
                        </Field>

                        {/* ── Selling Unit ── */}
                        <div className="col-span-2">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-4 h-4 text-teal-600" />
                                    <span className="text-sm font-bold text-gray-800">Selling Unit · 판매 단위</span>
                                    <span className="text-xs text-gray-400">How is this product sold? · 어떤 단위로 판매하나요?</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Unit · 단위</label>
                                        <select value={form.unitLabel} onChange={e => set('unitLabel', e.target.value)} className={inp}>
                                            {UNIT_LABELS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    {form.unitLabel !== '개' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                Items per unit · 단위당 개수
                                            </label>
                                            <input
                                                type="number"
                                                value={form.unitsPerPkg}
                                                onChange={e => set('unitsPerPkg', e.target.value)}
                                                placeholder={`e.g. 1 ${form.unitLabel} = ? 개`}
                                                className={inp}
                                                min="1"
                                            />
                                            {form.unitsPerPkg && (
                                                <p className="text-[10px] text-teal-600 mt-1">
                                                    → 1 {form.unitLabel} = {form.unitsPerPkg} 개
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Field en="Volume / Weight" ko="용량/중량">
                            <input value={form.volume} onChange={e => set('volume', e.target.value)}
                                placeholder="e.g. 150ml, 500g" className={inp} />
                        </Field>
                        <Field en="Country of Origin" ko="원산지">
                            <input value={form.origin} onChange={e => set('origin', e.target.value)}
                                placeholder="e.g. South Korea" className={inp} />
                        </Field>
                        <Field en="Skin Type" ko="피부 타입">
                            <input value={form.skinType} onChange={e => set('skinType', e.target.value)}
                                placeholder="e.g. All skin types" className={inp} />
                        </Field>
                        <Field en="Expiry (months)" ko="유통기한 (개월)">
                            <input type="number" value={form.expiryMonths} onChange={e => set('expiryMonths', e.target.value)}
                                placeholder="e.g. 36" className={inp} min="1" />
                        </Field>
                        <div className="col-span-2">
                            <Field en="Certifications" ko="인증/특징">
                                <input value={form.certifications} onChange={e => set('certifications', e.target.value)}
                                    placeholder="e.g. Vegan, EWG, Organic, KFDA · 쉼표로 구분" className={inp} />
                            </Field>
                        </div>
                    </div>
                </Section>

                {/* ── Bulk Pricing Tiers (optional toggle) ── */}
                <Section title="🎁 Bulk Pricing" sub="수량별 할인 — optional · 선택사항">
                    <ToggleSwitch
                        checked={bulkDiscountEnabled}
                        onChange={() => setBulkDiscountEnabled(p => !p)}
                        label="Enable Bulk Discount · 수량 할인 사용"
                        sub="할인 없으면 비활성"
                    />

                    {bulkDiscountEnabled && (
                        <div className="mt-4 space-y-4">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
                                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                <div>
                                    Buyers who reach the minimum quantity get the tier discount automatically.
                                    <span className="block opacity-70 mt-0.5">최소 수량 달성 시 자동으로 해당 할인율 적용됩니다.</span>
                                </div>
                            </div>
                            {/* Quick presets */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-semibold text-gray-500">Quick presets:</span>
                                {[
                                    { label: 'Buy 3+ / 5% off', min: '3', max: '', pct: '5', ship: false },
                                    { label: 'Buy 5+ / 10% off', min: '5', max: '', pct: '10', ship: false },
                                    { label: 'Buy 10+ / 15% off', min: '10', max: '', pct: '15', ship: false },
                                    { label: 'Buy 20+ / 20% + Free Ship', min: '20', max: '', pct: '20', ship: true },
                                ].map(p => (
                                    <button key={p.label} type="button"
                                        onClick={() => setOptions(prev => {
                                            if (prev.some(o => o.minQty === p.min)) return prev;
                                            return [...prev, { minQty: p.min, maxQty: p.max, discountPct: p.pct, freeShipping: p.ship, labelKo: '' }];
                                        })}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700 transition-all">
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            {options.map((opt, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_2fr_auto] gap-3 items-end bg-teal-50/50 p-4 rounded-xl border border-teal-100 relative">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Min Qty · 최소수량</label>
                                        <input type="number" value={opt.minQty} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, minQty: e.target.value } : o))}
                                            className={inp} min="1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Max Qty · 최대수량</label>
                                        <input type="number" value={opt.maxQty} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, maxQty: e.target.value } : o))}
                                            className={inp} placeholder="Unlimited" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Discount % · 할인율</label>
                                        <input type="number" value={opt.discountPct} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, discountPct: e.target.value } : o))}
                                            className={inp} min="0" max="100" />
                                    </div>
                                    <div className="pb-3">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer font-semibold text-gray-700 whitespace-nowrap">
                                            <input type="checkbox" checked={opt.freeShipping} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, freeShipping: e.target.checked } : o))}
                                                className="rounded text-teal-600 focus:ring-teal-500 border-gray-300 w-4 h-4" />
                                            Free Ship · 무료배송
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Label · 라벨</label>
                                        <input value={opt.labelKo} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, labelKo: e.target.value } : o))}
                                            className={inp} placeholder="e.g. Buy 3 get 5% off" />
                                        <div className="text-[10px] text-teal-600 mt-1">Auto-translated · 자동 번역</div>
                                    </div>
                                    {options.length > 1 && (
                                        <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                                            className="absolute top-2 right-2 md:relative md:top-0 md:right-0 mb-2 text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => {
                                const lastMin = parseInt(options[options.length - 1]?.minQty || '1', 10);
                                const lastPct = parseFloat(options[options.length - 1]?.discountPct || '0');
                                setOptions([...options, { minQty: String(lastMin + 5), maxQty: '', discountPct: String(Math.min(lastPct + 5, 50)), freeShipping: false, labelKo: '' }]);
                            }}
                                className="text-sm text-teal-600 font-bold flex items-center gap-1.5 hover:text-teal-700 bg-teal-50 px-3 py-2 rounded-lg transition-colors border border-teal-100">
                                <Plus className="w-4 h-4" /> Add Tier · 할인 단계 추가
                            </button>
                        </div>
                    )}
                </Section>

                {/* ── Product Variants ── */}
                <Section title="🎨 Product Variants" sub="색상·사이즈·용량·커스텀 옵션 — optional · 선택사항">
                    <ToggleSwitch
                        checked={variantEnabled}
                        onChange={() => setVariantEnabled(p => !p)}
                        label="Enable product variants"
                        sub="색상 / 사이즈 / 용량 / 기타 옵션 사용"
                    />

                    {variantEnabled && (
                        <div className="mt-5 space-y-5">
                            {/* Multi-type checkboxes */}
                            <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Select variant types · 옵션 종류 선택 (복수 선택 가능):</p>
                                <div className="flex flex-wrap gap-3">
                                    {([
                                        { key: 'color',  label: '🎨 Color · 색상',    checked: enableColor,  setChecked: setEnableColor },
                                        { key: 'size',   label: '📏 Size · 사이즈',    checked: enableSize,   setChecked: setEnableSize },
                                        { key: 'volume', label: '💧 Volume · 용량',    checked: enableVolume, setChecked: setEnableVolume },
                                        { key: 'custom', label: '🏷️ Custom · 기타',    checked: enableCustom, setChecked: setEnableCustom },
                                    ] as const).map(({ key, label, checked, setChecked }) => (
                                        <label key={key} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold select-none ${
                                            checked ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                                        }`}>
                                            <input type="checkbox" checked={checked} onChange={() => setChecked((p: boolean) => !p)} className="sr-only" />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ── Color variants ── */}
                            {enableColor && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-700">🎨 Color variants · 색상 옵션</p>
                                    <div className="grid grid-cols-[40px_1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400">
                                        <span />
                                        <span>Color name · 색상명</span>
                                        <span className="text-center">Stock</span>
                                        <span className="text-center">Price (opt)</span>
                                        <span />
                                    </div>
                                    {colorVars.map((cv, i) => (
                                        <div key={i} className="grid grid-cols-[40px_1fr_72px_88px_28px] gap-2 items-center bg-white rounded-xl p-2.5 border border-gray-100">
                                            <input type="color" value={cv.hex}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, hex: e.target.value } : c))}
                                                className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                                            <input value={cv.name}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))}
                                                placeholder="e.g. Rose Pink" className={vInp} />
                                            <input type="number" value={cv.stock}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))}
                                                className={`text-center ${vInp}`} min="0" />
                                            <input type="number" step="0.01" value={cv.price}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, price: e.target.value } : c))}
                                                placeholder="—" className={`text-center ${vInp}`} />
                                            {colorVars.length > 1 ? (
                                                <button type="button" onClick={() => setColorVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                                            ) : <span />}
                                        </div>
                                    ))}
                                    {colorVars.length < 10 && (
                                        <button type="button" onClick={() => setColorVars(p => [...p, { name: '', hex: '#4A90E2', stock: '0', price: '' }])}
                                            className="text-sm font-bold text-teal-600 flex items-center gap-1.5 hover:text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 transition-colors">
                                            <Plus className="w-4 h-4" /> Add Color · 색상 추가
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ── Size variants ── */}
                            {enableSize && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-700">📏 Size variants · 사이즈 옵션</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SIZE_PRESETS.map(s => {
                                            const added = sizeVars.some(v => v.label === s);
                                            return (
                                                <button key={s} type="button"
                                                    onClick={() => !added && setSizeVars(p => [...p, { label: s, stock: '0', price: '' }])}
                                                    disabled={added}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${added ? 'bg-teal-100 text-teal-600 border-teal-200 opacity-50 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700'}`}>
                                                    {s}
                                                </button>
                                            );
                                        })}
                                        <button type="button" onClick={() => setSizeVars(p => [...p, { label: '', stock: '0', price: '' }])}
                                            className="px-3 py-1.5 rounded-lg text-sm font-bold border border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-all flex items-center gap-1">
                                            <Plus className="w-3.5 h-3.5" /> Custom
                                        </button>
                                    </div>
                                    {sizeVars.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-[1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400">
                                                <span>Size · 사이즈</span><span className="text-center">Stock</span><span className="text-center">Price (opt)</span><span />
                                            </div>
                                            {sizeVars.map((sv, i) => (
                                                <div key={i} className="grid grid-cols-[1fr_72px_88px_28px] gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-100">
                                                    <input value={sv.label} onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, label: e.target.value } : s))} placeholder="e.g. M, 95" className={`font-semibold ${vInp}`} />
                                                    <input type="number" value={sv.stock} onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, stock: e.target.value } : s))} className={`text-center ${vInp}`} min="0" />
                                                    <input type="number" step="0.01" value={sv.price} onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, price: e.target.value } : s))} placeholder="—" className={`text-center ${vInp}`} />
                                                    <button type="button" onClick={() => setSizeVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Volume variants ── */}
                            {enableVolume && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-700">💧 Volume variants · 용량 옵션</p>
                                    <div className="flex flex-wrap gap-2">
                                        {VOLUME_PRESETS.map(v => {
                                            const added = volumeVars.some(x => x.label === v);
                                            return (
                                                <button key={v} type="button"
                                                    onClick={() => !added && setVolumeVars(p => [...p, { label: v, stock: '0', price: '' }])}
                                                    disabled={added}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${added ? 'bg-teal-100 text-teal-600 border-teal-200 opacity-50 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700'}`}>
                                                    {v}
                                                </button>
                                            );
                                        })}
                                        <button type="button" onClick={() => setVolumeVars(p => [...p, { label: '', stock: '0', price: '' }])}
                                            className="px-3 py-1.5 rounded-lg text-sm font-bold border border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-all flex items-center gap-1">
                                            <Plus className="w-3.5 h-3.5" /> Custom
                                        </button>
                                    </div>
                                    {volumeVars.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-[1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400">
                                                <span>Volume · 용량</span><span className="text-center">Stock</span><span className="text-center">Price (opt)</span><span />
                                            </div>
                                            {volumeVars.map((vv, i) => (
                                                <div key={i} className="grid grid-cols-[1fr_72px_88px_28px] gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-100">
                                                    <input value={vv.label} onChange={e => setVolumeVars(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="e.g. 100ml" className={`font-semibold ${vInp}`} />
                                                    <input type="number" value={vv.stock} onChange={e => setVolumeVars(p => p.map((x, idx) => idx === i ? { ...x, stock: e.target.value } : x))} className={`text-center ${vInp}`} min="0" />
                                                    <input type="number" step="0.01" value={vv.price} onChange={e => setVolumeVars(p => p.map((x, idx) => idx === i ? { ...x, price: e.target.value } : x))} placeholder="—" className={`text-center ${vInp}`} />
                                                    <button type="button" onClick={() => setVolumeVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Custom variants ── */}
                            {enableCustom && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-700">🏷️ Custom variants · 기타 옵션</p>
                                    <p className="text-xs text-gray-500">Bundle sets, scents, kit types, etc. · 세트 구성, 향기, 용도별 등</p>
                                    <div className="grid grid-cols-[1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400">
                                        <span>Option name · 옵션명</span><span className="text-center">Stock</span><span className="text-center">Price (opt)</span><span />
                                    </div>
                                    {customVars.map((cv, i) => (
                                        <div key={i} className="grid grid-cols-[1fr_72px_88px_28px] gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-100">
                                            <input value={cv.label} onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, label: e.target.value } : c))} placeholder="e.g. Starter Kit" className={vInp} />
                                            <input type="number" value={cv.stock} onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))} className={`text-center ${vInp}`} min="0" />
                                            <input type="number" step="0.01" value={cv.price} onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, price: e.target.value } : c))} placeholder="—" className={`text-center ${vInp}`} />
                                            {customVars.length > 1 ? (
                                                <button type="button" onClick={() => setCustomVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                                            ) : <span />}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setCustomVars(p => [...p, { label: '', stock: '0', price: '' }])}
                                        className="text-sm font-bold text-teal-600 flex items-center gap-1.5 hover:text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 transition-colors">
                                        <Plus className="w-4 h-4" /> Add Option · 옵션 추가
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Section>

                {/* ── Product Description ── */}
                <Section title="🌐 Product Description" sub="상품 설명 — Enter in Korean/English → auto-translated to 4 languages · 입력 후 4개국어 자동 번역">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-teal-600 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
                            <Sparkles className="w-3.5 h-3.5" />
                            Saved content is automatically translated into English, Korean, Chinese &amp; Khmer.
                            <span className="opacity-70">· 저장 시 4개국어 자동 생성</span>
                        </div>
                        <Field en="Product Name" ko="상품명" required>
                            <input value={form.nameKo} onChange={e => set('nameKo', e.target.value)}
                                placeholder="e.g. Hydrating Ampoule Serum 50ml / 수분 앰플 세럼 50ml" className={inp} required />
                        </Field>
                        <Field en="Short Description" ko="짧은 설명">
                            <textarea value={form.shortDescKo} onChange={e => set('shortDescKo', e.target.value)}
                                placeholder="1–2 line summary shown on product cards" rows={2} className={ta} />
                        </Field>
                        <Field en="Detailed Description" ko="상세 설명">
                            <textarea value={form.detailDescKo} onChange={e => set('detailDescKo', e.target.value)}
                                placeholder="Product features, effects, detailed information" rows={5} className={ta} />
                        </Field>
                        <Field en="Key Ingredients" ko="주요 성분">
                            <textarea value={form.ingredientsKo} onChange={e => set('ingredientsKo', e.target.value)}
                                placeholder="e.g. Hyaluronic Acid, Niacinamide, Panthenol…" rows={3} className={ta} />
                        </Field>
                        <Field en="How to Use" ko="사용 방법">
                            <textarea value={form.howToUseKo} onChange={e => set('howToUseKo', e.target.value)}
                                placeholder="e.g. After cleansing, apply appropriate amount to face…" rows={3} className={ta} />
                        </Field>
                        <Field en="Benefits / Features" ko="효능/특징">
                            <textarea value={form.benefitsKo} onChange={e => set('benefitsKo', e.target.value)}
                                placeholder="e.g. 24hr hydration, soothing, brightening…" rows={3} className={ta} />
                        </Field>
                    </div>
                </Section>

                <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 text-white font-extrabold rounded-xl hover:bg-teal-700 disabled:opacity-60 text-base shadow-md transition-all">
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {translating ? 'Auto-translating… · 자동 번역 중…' : 'Submitting… · 등록 처리 중…'}
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Submit for Review · 등록 및 검수 요청
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
