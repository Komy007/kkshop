'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, Sparkles, Info, CheckCircle, Plus } from 'lucide-react';

interface Category { id: string; slug: string; nameKo: string; nameEn?: string; parentId?: string | null; }

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

export default function SellerProductNewPage() {
    const router  = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [images,      setImages]     = useState<File[]>([]);
    const [previews,    setPreviews]   = useState<string[]>([]);
    const [categories,     setCategories]    = useState<Category[]>([]);
    const [catLoading,     setCatLoading]    = useState(true);
    const [catError,       setCatError]      = useState(false);
    const [options,     setOptions]    = useState([{ minQty: '1', maxQty: '', discountPct: '0', freeShipping: false, labelKo: '1 unit (default)' }]);
    const [submitting,  setSubmitting] = useState(false);
    const [translating, setTranslating]= useState(false);
    const [success,     setSuccess]    = useState(false);

    // ── Variant state ──────────────────────────────────────────────────────
    const [variantEnabled, setVariantEnabled] = useState(false);
    const [variantType,    setVariantType]    = useState<'color' | 'size' | 'custom'>('color');
    const [colorVars,  setColorVars]  = useState([{ name: '', hex: '#FF6B6B', stock: '0', price: '' }]);
    const [sizeVars,   setSizeVars]   = useState<{ label: string; stock: string; price: string }[]>([]);
    const [customVars, setCustomVars] = useState([{ label: '', stock: '0', price: '' }]);

    const [form, setForm] = useState({
        sku: '', priceUsd: '', stockQty: '0', categoryId: '',
        brandName: '', volume: '', origin: '', skinType: '', expiryMonths: '',
        nameKo: '', shortDescKo: '', detailDescKo: '',
        ingredientsKo: '', howToUseKo: '', benefitsKo: '',
    });

    const loadCategories = () => {
        setCatLoading(true);
        setCatError(false);
        fetch('/api/categories')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                setCategories(Array.isArray(d) ? d : []);
                setCatLoading(false);
            })
            .catch(() => {
                setCatError(true);
                setCatLoading(false);
            });
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
            const added = imageFiles.slice(0, 3 - images.length);
            setImages(p => [...p, ...added].slice(0, 3));
            added.forEach(f => {
                const reader = new FileReader();
                reader.onload = ev => setPreviews(p => [...p, ev.target?.result as string].slice(0, 3));
                reader.readAsDataURL(f);
            });
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [images.length]);

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

        // ── Build variants payload ──────────────────────────────────────
        let variantsPayload: any[] = [];
        if (variantEnabled) {
            if (variantType === 'color') {
                variantsPayload = colorVars
                    .filter(v => v.name.trim())
                    .map((v, i) => ({
                        variantType: 'color',
                        variantValue: `${v.name.trim()}|${v.hex}`,
                        stockQty: parseInt(v.stock) || 0,
                        priceUsd: v.price || null,
                        sortOrder: i,
                    }));
            } else if (variantType === 'size') {
                variantsPayload = sizeVars
                    .filter(v => v.label.trim())
                    .map((v, i) => ({
                        variantType: 'size',
                        variantValue: v.label,
                        stockQty: parseInt(v.stock) || 0,
                        priceUsd: v.price || null,
                        sortOrder: i,
                    }));
            } else {
                variantsPayload = customVars
                    .filter(v => v.label.trim())
                    .map((v, i) => ({
                        variantType: 'custom',
                        variantValue: v.label.trim(),
                        stockQty: parseInt(v.stock) || 0,
                        priceUsd: v.price || null,
                        sortOrder: i,
                    }));
            }
        }

        const payload = {
            ...form, imageUrls, options,
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

    /* ── Section / Field helpers ── */
    const Section = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="font-extrabold text-gray-900 text-base leading-tight">{title}</h2>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            <div className="mt-4">{children}</div>
        </div>
    );

    const Field = ({ en, ko, required, children }: { en: string; ko: string; required?: boolean; children: React.ReactNode }) => (
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

    const inp   = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
    const ta    = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none";
    const vInp  = "px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

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
                <Section title="📸 Product Images" sub="상품 이미지 — max 3 photos · 최대 3장">
                    <div className="flex gap-3 flex-wrap">
                        {previews.map((src, i) => (
                            <div key={i} className="relative w-24 h-24">
                                <img src={src} className="w-24 h-24 object-cover rounded-xl border" alt="" />
                                <button type="button" onClick={() => removeImage(i)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow">
                                    <X className="w-3 h-3" />
                                </button>
                                {i === 0 && (
                                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                        Main · 대표
                                    </div>
                                )}
                            </div>
                        ))}
                        {images.length < 3 && (
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
                                    <span className="text-sm">Loading categories… · 카테고리 불러오는 중…</span>
                                </div>
                            ) : catError ? (
                                <div className="space-y-1">
                                    <div className={`${inp} flex items-center justify-between bg-red-50 border-red-200 text-red-600`}>
                                        <span className="text-sm">Failed to load — · 불러오기 실패</span>
                                        <button type="button" onClick={loadCategories}
                                            className="text-xs font-bold underline hover:no-underline ml-2">
                                            Retry · 재시도
                                        </button>
                                    </div>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className={`${inp} bg-amber-50 border-amber-200 text-amber-700 text-sm`}>
                                    No categories available — please ask admin to add categories first.
                                    <span className="block text-xs opacity-70 mt-0.5">카테고리가 없습니다. 관리자에게 카테고리 추가를 요청하세요.</span>
                                </div>
                            ) : (
                                <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={inp} required>
                                    <option value="">— Select category · 카테고리 선택 —</option>
                                    {/* Top-level categories as optgroup, sub-categories inside */}
                                    {categories.filter(c => !c.parentId).map(parent => {
                                        const subs = categories.filter(c => c.parentId === parent.id);
                                        return subs.length > 0 ? (
                                            <optgroup key={parent.id} label={`📁 ${parent.nameEn || parent.nameKo}`}>
                                                {subs.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.nameEn || s.nameKo}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ) : (
                                            <option key={parent.id} value={parent.id}>
                                                {parent.nameEn || parent.nameKo}
                                            </option>
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
                        <Field en="Volume / Weight" ko="용량/중량">
                            <input value={form.volume} onChange={e => set('volume', e.target.value)}
                                placeholder="e.g. 150ml" className={inp} />
                        </Field>
                        <Field en="Country of Origin" ko="원산지">
                            <input value={form.origin} onChange={e => set('origin', e.target.value)}
                                placeholder="e.g. South Korea" className={inp} />
                        </Field>
                        <Field en="Skin Type" ko="피부 타입">
                            <input value={form.skinType} onChange={e => set('skinType', e.target.value)}
                                placeholder="e.g. All skin types" className={inp} />
                        </Field>
                    </div>
                </Section>

                {/* ── Quantity Discount Options ── */}
                <Section title="🎁 Quantity Discount Options" sub="단위별 할인 옵션 — optional · 선택사항">
                    <div className="space-y-4">
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
                                        className={inp} />
                                </div>
                                <div className="pb-3">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-semibold text-gray-700 whitespace-nowrap">
                                        <input type="checkbox" checked={opt.freeShipping} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, freeShipping: e.target.checked } : o))}
                                            className="rounded text-teal-600 focus:ring-teal-500 border-gray-300 w-4 h-4" />
                                        Free Ship · 무료배송
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Option Label · 옵션 라벨</label>
                                    <input value={opt.labelKo} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, labelKo: e.target.value } : o))}
                                        className={inp} placeholder="e.g. Buy 2 get 10% off" />
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
                        <button type="button" onClick={() => setOptions([...options, { minQty: '2', maxQty: '', discountPct: '10', freeShipping: false, labelKo: '' }])}
                            className="text-sm text-teal-600 font-bold flex items-center gap-1 hover:text-teal-700 bg-teal-50 px-3 py-2 rounded-lg transition-colors border border-teal-100">
                            + Add Quantity Option · 수량별 옵션 추가
                        </button>
                    </div>
                </Section>

                {/* ── Product Variants ── */}
                <Section title="🎨 Product Variants" sub="색상·사이즈·커스텀 옵션 — optional · 선택사항">
                    {/* Toggle switch */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={variantEnabled}
                            onClick={() => setVariantEnabled(p => !p)}
                            className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 ${variantEnabled ? 'bg-teal-500' : 'bg-gray-200'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${variantEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm font-semibold text-gray-800">
                            Enable product variants
                            <span className="text-xs text-gray-400 ml-2 font-normal">색상 / 사이즈 / 기타 옵션 사용</span>
                        </span>
                    </label>

                    {variantEnabled && (
                        <div className="mt-5 space-y-5">
                            {/* Type selector */}
                            <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Variant Type · 옵션 종류:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(['color', 'size', 'custom'] as const).map(t => (
                                        <button key={t} type="button" onClick={() => setVariantType(t)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${variantType === t ? 'bg-teal-500 text-white border-teal-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700'}`}>
                                            {t === 'color' ? '🎨 Color · 색상' : t === 'size' ? '📏 Size · 사이즈' : '🏷️ Custom · 기타'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Color variants ── */}
                            {variantType === 'color' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500">
                                        Pick a color and enter its name. Optionally set individual stock &amp; price per color.
                                        <span className="block opacity-70">색상을 선택하고 이름을 입력하세요. 색상별 재고/가격을 개별 설정할 수 있습니다.</span>
                                    </p>
                                    <div className="grid grid-cols-[40px_1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400">
                                        <span />
                                        <span>Color name · 색상명</span>
                                        <span className="text-center">Stock</span>
                                        <span className="text-center">Price (opt)</span>
                                        <span />
                                    </div>
                                    {colorVars.map((cv, i) => (
                                        <div key={i} className="grid grid-cols-[40px_1fr_72px_88px_28px] gap-2 items-center bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                            <input
                                                type="color"
                                                value={cv.hex}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, hex: e.target.value } : c))}
                                                className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                                                title="Pick color"
                                            />
                                            <input
                                                value={cv.name}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))}
                                                placeholder="e.g. Rose Pink"
                                                className={vInp}
                                            />
                                            <input
                                                type="number"
                                                value={cv.stock}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))}
                                                className={`text-center ${vInp}`}
                                                min="0"
                                            />
                                            <input
                                                type="number" step="0.01"
                                                value={cv.price}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, price: e.target.value } : c))}
                                                placeholder="—"
                                                className={`text-center ${vInp}`}
                                            />
                                            {colorVars.length > 1 ? (
                                                <button type="button" onClick={() => setColorVars(p => p.filter((_, idx) => idx !== i))}
                                                    className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
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
                            {variantType === 'size' && (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Quick Add · 빠른 추가:</p>
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
                                            <button type="button"
                                                onClick={() => setSizeVars(p => [...p, { label: '', stock: '0', price: '' }])}
                                                className="px-3 py-1.5 rounded-lg text-sm font-bold border border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-all flex items-center gap-1">
                                                <Plus className="w-3.5 h-3.5" /> Custom
                                            </button>
                                        </div>
                                    </div>
                                    {sizeVars.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-[1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400">
                                                <span>Size · 사이즈</span>
                                                <span className="text-center">Stock</span>
                                                <span className="text-center">Price (opt)</span>
                                                <span />
                                            </div>
                                            {sizeVars.map((sv, i) => (
                                                <div key={i} className="grid grid-cols-[1fr_72px_88px_28px] gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                                    <input
                                                        value={sv.label}
                                                        onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, label: e.target.value } : s))}
                                                        placeholder="e.g. M, 95"
                                                        className={`font-semibold ${vInp}`}
                                                    />
                                                    <input type="number"
                                                        value={sv.stock}
                                                        onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, stock: e.target.value } : s))}
                                                        className={`text-center ${vInp}`} min="0" />
                                                    <input type="number" step="0.01"
                                                        value={sv.price}
                                                        onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, price: e.target.value } : s))}
                                                        placeholder="—"
                                                        className={`text-center ${vInp}`} />
                                                    <button type="button" onClick={() => setSizeVars(p => p.filter((_, idx) => idx !== i))}
                                                        className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {sizeVars.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">Click size presets above or &quot;+ Custom&quot; to add sizes. · 위 버튼으로 사이즈를 추가하세요.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Custom variants ── */}
                            {variantType === 'custom' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500">
                                        Add any custom options — bundle sets, scents, kit types, etc.
                                        <span className="block opacity-70">커스텀 옵션 추가 (예: 세트 구성, 향기, 용도별 등)</span>
                                    </p>
                                    <div className="grid grid-cols-[1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400">
                                        <span>Option name · 옵션명</span>
                                        <span className="text-center">Stock</span>
                                        <span className="text-center">Price (opt)</span>
                                        <span />
                                    </div>
                                    {customVars.map((cv, i) => (
                                        <div key={i} className="grid grid-cols-[1fr_72px_88px_28px] gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            <input
                                                value={cv.label}
                                                onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, label: e.target.value } : c))}
                                                placeholder="e.g. Starter Kit, Lavender"
                                                className={vInp}
                                            />
                                            <input type="number"
                                                value={cv.stock}
                                                onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))}
                                                className={`text-center ${vInp}`} min="0" />
                                            <input type="number" step="0.01"
                                                value={cv.price}
                                                onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, price: e.target.value } : c))}
                                                placeholder="—"
                                                className={`text-center ${vInp}`} />
                                            {customVars.length > 1 ? (
                                                <button type="button" onClick={() => setCustomVars(p => p.filter((_, idx) => idx !== i))}
                                                    className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
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
