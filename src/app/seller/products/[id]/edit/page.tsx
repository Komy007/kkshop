'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Loader2, ChevronLeft, AlertCircle, CheckCircle, Upload, X, ImagePlus, Plus } from 'lucide-react';
import DraggableImageGrid from '@/components/DraggableImageGrid';

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

interface Category { id: string; nameKo: string; nameEn?: string; parentId?: string | null; }

interface ProductForm {
    name: string; shortDesc: string; detailDesc: string;
    ingredients: string; howToUse: string; benefits: string;
    priceUsd: string; stockQty: string; volume: string; skinType: string; origin: string;
    brandName: string; expiryMonths: string; certifications: string;
    categoryId: string;
}
const EMPTY: ProductForm = {
    name: '', shortDesc: '', detailDesc: '', ingredients: '',
    howToUse: '', benefits: '', priceUsd: '', stockQty: '0', volume: '', skinType: '', origin: '',
    brandName: '', expiryMonths: '', certifications: '',
    categoryId: '',
};
const BADGE: Record<string, string> = {
    PENDING:  'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-600',
};
const BADGE_LABEL: Record<string, { en: string; ko: string }> = {
    PENDING:  { en: 'Under Review',    ko: '검수 대기중' },
    APPROVED: { en: 'Approved & Live', ko: '판매 승인됨' },
    REJECTED: { en: 'Rejected',        ko: '반려됨' },
};

const Field = ({ en, ko, required, children }: { en: string; ko: string; required?: boolean; children: React.ReactNode }) => (
    <div>
        <label className="block mb-1.5">
            <span className="text-xs font-semibold text-gray-800">
                {en}{required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            <span className="text-[10px] text-gray-400 ml-1.5">{ko}</span>
        </label>
        {children}
    </div>
);

const inp  = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none";
const ta   = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-none";
const vInp = "px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function SellerProductEditPage() {
    const params    = useParams();
    const router    = useRouter();
    const productId = params.id as string;
    const fileRef   = useRef<HTMLInputElement>(null);

    const [form,           setForm]           = useState<ProductForm>(EMPTY);
    const [loading,        setLoading]        = useState(true);
    const [saving,         setSaving]         = useState(false);
    const [uploading,      setUploading]      = useState(false);
    const [approvalStatus, setApprovalStatus] = useState('');
    const [message,        setMessage]        = useState<{ type: 'success' | 'error'; text: string; textKo: string } | null>(null);

    // Category state
    const [categories,  setCategories] = useState<Category[]>([]);
    const [catLoading,  setCatLoading] = useState(true);
    const [catError,    setCatError]   = useState(false);

    // Image state
    const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
    const [deleteImageIds, setDeleteImageIds] = useState<string[]>([]);
    const [newImages,      setNewImages]      = useState<{ file: File; preview: string }[]>([]);

    // Options (quantity discount) state
    const [options, setOptions] = useState<{ minQty: string; maxQty: string; discountPct: string; freeShipping: boolean; labelKo: string }[]>([]);

    // Variant state
    const [variantEnabled, setVariantEnabled] = useState(false);
    const [variantType,    setVariantType]    = useState<'color' | 'size' | 'custom'>('color');
    const [colorVars,  setColorVars]  = useState([{ name: '', hex: '#FF6B6B', stock: '0', price: '' }]);
    const [sizeVars,   setSizeVars]   = useState<{ label: string; stock: string; price: string }[]>([]);
    const [customVars, setCustomVars] = useState([{ label: '', stock: '0', price: '' }]);

    // Load categories (public, no auth needed)
    const loadCategories = useCallback(() => {
        setCatLoading(true); setCatError(false);
        fetch('/api/categories')
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(d => { setCategories(Array.isArray(d) ? d : []); setCatLoading(false); })
            .catch(() => { setCatError(true); setCatLoading(false); });
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    useEffect(() => {
        fetch(`/api/seller/products/${productId}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { router.push('/seller/products'); return; }
                const ko = data.translations?.find((t: any) => t.langCode === 'ko') ?? {};
                setForm({
                    name:        ko.name            ?? '',
                    shortDesc:   ko.shortDesc       ?? '',
                    detailDesc:  ko.detailDesc      ?? '',
                    ingredients: ko.ingredients     ?? '',
                    howToUse:    ko.howToUse        ?? '',
                    benefits:    ko.benefits        ?? '',
                    priceUsd:    data.priceUsd      ?? '',
                    stockQty:    String(data.stockQty ?? 0),
                    volume:      data.volume        ?? '',
                    skinType:    data.skinType      ?? '',
                    origin:      data.origin        ?? '',
                    brandName:   data.brandName     ?? '',
                    expiryMonths: data.expiryMonths ? String(data.expiryMonths) : '',
                    certifications: data.certifications ?? '',
                    categoryId:  data.categoryId    ?? '',
                });
                setApprovalStatus(data.approvalStatus ?? 'PENDING');
                setExistingImages(data.images ?? []);

                // Load options
                const rawOptions = data.options ?? [];
                if (rawOptions.length > 0) {
                    setOptions(rawOptions.map((o: any) => ({
                        minQty:      String(o.minQty),
                        maxQty:      o.maxQty ? String(o.maxQty) : '',
                        discountPct: String(parseFloat(o.discountPct)),
                        freeShipping: Boolean(o.freeShipping),
                        labelKo:     o.labelKo ?? '',
                    })));
                }

                // Load variants
                const rawVariants = data.variants ?? [];
                if (rawVariants.length > 0) {
                    setVariantEnabled(true);
                    const vType = rawVariants[0].variantType as 'color' | 'size' | 'custom';
                    setVariantType(vType);
                    if (vType === 'color') {
                        setColorVars(rawVariants.map((v: any) => {
                            const [name = '', hex = '#FF6B6B'] = v.variantValue.split('|');
                            return { name, hex, stock: String(v.stockQty), price: v.priceUsd ?? '' };
                        }));
                    } else if (vType === 'size') {
                        setSizeVars(rawVariants.map((v: any) => ({
                            label: v.variantValue,
                            stock: String(v.stockQty),
                            price: v.priceUsd ?? '',
                        })));
                    } else {
                        setCustomVars(rawVariants.map((v: any) => ({
                            label: v.variantValue,
                            stock: String(v.stockQty),
                            price: v.priceUsd ?? '',
                        })));
                    }
                }
            })
            .finally(() => setLoading(false));
    }, [productId, router]);

    const addFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        const visibleCount = existingImages.filter(img => !deleteImageIds.includes(img.id)).length + newImages.length;
        const toAdd = arr.slice(0, Math.max(0, 10 - visibleCount));
        setNewImages(prev => [
            ...prev,
            ...toAdd.map(file => ({ file, preview: URL.createObjectURL(file) })),
        ]);
    }, [existingImages, deleteImageIds, newImages.length]);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const imgs: File[] = [];
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const f = item.getAsFile();
                    if (f) imgs.push(f);
                }
            }
            if (imgs.length > 0) addFiles(imgs);
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [addFiles]);

    const removeExisting = (id: string) => setDeleteImageIds(prev => [...prev, id]);
    const removeNew = (idx: number) => {
        setNewImages(prev => {
            URL.revokeObjectURL(prev[idx].preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const reorderExistingImages = (from: number, to: number) => {
        setExistingImages(prev => {
            const visible = prev.filter(img => !deleteImageIds.includes(img.id));
            const [moved] = visible.splice(from, 1);
            visible.splice(to, 0, moved);
            const deleted = prev.filter(img => deleteImageIds.includes(img.id));
            return [...visible, ...deleted];
        });
    };

    const reorderNewImages = (from: number, to: number) => {
        setNewImages(prev => { const a = [...prev]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return a; });
    };

    const set = (field: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setMessage({ type: 'error', text: 'Product name is required.', textKo: '상품명을 입력하세요.' });
            return;
        }

        setSaving(true);
        setMessage(null);
        try {
            // 1. Upload new images
            let uploadedUrls: string[] = [];
            if (newImages.length > 0) {
                setUploading(true);
                const fd = new FormData();
                newImages.forEach(img => fd.append('files', img.file));
                const up = await fetch('/api/upload', { method: 'POST', body: fd });
                const upData = await up.json();
                uploadedUrls = upData.urls || [];
                setUploading(false);
            }

            // 2. Build variants payload
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
            // variantEnabled=false → send [] to clear all variants

            // 3. Save product
            const res = await fetch(`/api/seller/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    imageUrls:    uploadedUrls,
                    deleteImageIds,
                    options:      options.length > 0 ? options : [],
                    variants:     variantsPayload,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Changes saved! Redirecting…', textKo: '수정 완료. 재검수 대기 중입니다.' });
                setApprovalStatus('PENDING');
                setDeleteImageIds([]);
                setNewImages([]);
                setTimeout(() => router.push('/seller/products'), 2000);
            } else {
                setMessage({ type: 'error', text: 'Failed to save changes.', textKo: data.error ?? '저장에 실패했습니다.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'An error occurred.', textKo: '오류가 발생했습니다.' });
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
        );
    }

    const badgeInfo      = BADGE_LABEL[approvalStatus];
    const visibleExisting = existingImages.filter(img => !deleteImageIds.includes(img.id));
    const totalImages     = visibleExisting.length + newImages.length;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
                    <p className="text-xs text-gray-400 mt-0.5">상품 수정 — re-review required after saving · 수정 후 재검수 진행</p>
                </div>
                {badgeInfo && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${BADGE[approvalStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        <span className="block leading-tight">{badgeInfo.en}</span>
                        <span className="block text-[10px] opacity-70 leading-tight">{badgeInfo.ko}</span>
                    </span>
                )}
            </div>

            {/* Re-approval notice */}
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                    <strong>Re-review Notice:</strong> Saving changes will reset approval status to <strong>Under Review</strong>.
                    Admin approval required before going live (usually 1–2 business days).
                    <span className="block text-xs opacity-75 mt-0.5">수정 시 재검수 안내: 상품을 수정하면 검수 상태가 대기중으로 변경됩니다.</span>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message.type === 'success'
                        ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    <div>
                        <div>{message.text}</div>
                        <div className="text-xs opacity-75 mt-0.5">{message.textKo}</div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── Product Images ── */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        Product Images
                        <span className="text-[10px] font-normal text-gray-400 ml-1">{totalImages}/5 · 상품 이미지</span>
                    </h2>
                    <p className="text-[11px] text-gray-400 mb-4 ml-3.5">Drag to reorder · Hover × to remove · 상품 이미지 최대 10장</p>
                    <div className="flex gap-3 flex-wrap items-start">
                        {visibleExisting.length > 0 && (
                            <DraggableImageGrid
                                images={visibleExisting.map(img => ({ id: img.id, src: img.url }))}
                                onReorder={reorderExistingImages}
                                onRemove={(idx) => { if (visibleExisting[idx]) removeExisting(visibleExisting[idx].id); }}
                                coverLabel="Main"
                                layout="flex"
                            />
                        )}
                        {newImages.length > 0 && (
                            <DraggableImageGrid
                                images={newImages.map((img, i) => ({
                                    id: `new-${i}-${img.preview.slice(-8)}`,
                                    src: img.preview,
                                    badge: 'New · 신규',
                                    badgeColor: 'bg-teal-600',
                                    borderColor: 'border-teal-300 border-2',
                                }))}
                                onReorder={reorderNewImages}
                                onRemove={removeNew}
                                layout="flex"
                            />
                        )}
                        {totalImages < 5 && (
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-600 transition-colors">
                                <ImagePlus className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Add</span>
                                <span className="text-[9px] opacity-60 mt-0.5">or Ctrl+V</span>
                            </button>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => e.target.files && addFiles(e.target.files)} />
                    {uploading && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-teal-600">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading images… · 이미지 업로드 중…
                        </div>
                    )}
                </section>

                {/* ── Basic Info ── */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        Basic Information
                    </h2>
                    <p className="text-[11px] text-gray-400 mb-4 ml-3.5">기본 정보</p>
                    <div className="space-y-4">
                        {/* Category */}
                        <Field en="Category" ko="카테고리" required>
                            {catLoading ? (
                                <div className={`${inp} flex items-center gap-2 text-gray-400 bg-gray-50`}>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading… · 불러오는 중…</span>
                                </div>
                            ) : catError ? (
                                <div className={`${inp} flex items-center justify-between bg-red-50 border-red-200 text-red-600 text-sm`}>
                                    <span>Failed to load · 불러오기 실패</span>
                                    <button type="button" onClick={loadCategories} className="text-xs font-bold underline ml-2">Retry</button>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className={`${inp} bg-amber-50 border-amber-200 text-amber-700 text-sm`}>
                                    No categories — ask admin to add categories first.
                                    <span className="block text-xs opacity-70 mt-0.5">카테고리가 없습니다. 관리자에게 문의하세요.</span>
                                </div>
                            ) : (
                                <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} className={inp}>
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

                        <Field en="Product Name" ko="상품명 (한국어)" required>
                            <input type="text" value={form.name} onChange={set('name')} required
                                placeholder="e.g. Hydrating Ampoule Serum / 수분 앰플 세럼" className={inp} />
                        </Field>
                        <Field en="Short Description" ko="짧은 설명">
                            <textarea value={form.shortDesc} onChange={set('shortDesc')} rows={2}
                                placeholder="1–2 line summary shown on product cards · 상품 요약 설명" className={ta} />
                        </Field>
                        <Field en="Detailed Description" ko="상세 설명">
                            <textarea value={form.detailDesc} onChange={set('detailDesc')} rows={5}
                                placeholder="Product features, effects, detailed information · 상품 상세 설명" className={`${ta} resize-y`} />
                        </Field>
                    </div>
                </section>

                {/* ── Pricing & Specs ── */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        Price &amp; Product Details
                    </h2>
                    <p className="text-[11px] text-gray-400 mb-4 ml-3.5">가격 및 제품 정보</p>
                    <div className="grid grid-cols-2 gap-4">
                        <Field en="Price (USD)" ko="판매가">
                            <input type="number" step="0.01" min="0" value={form.priceUsd} onChange={set('priceUsd')} placeholder="0.00" className={inp} />
                        </Field>
                        <Field en="Stock Quantity" ko="재고 수량">
                            <input type="number" min="0" value={form.stockQty} onChange={set('stockQty')} placeholder="0" className={inp} />
                        </Field>
                        <Field en="Volume / Weight" ko="용량/중량">
                            <input type="text" value={form.volume} onChange={set('volume')} placeholder="e.g. 50ml, 200g" className={inp} />
                        </Field>
                        <Field en="Skin Type" ko="피부타입">
                            <input type="text" value={form.skinType} onChange={set('skinType')} placeholder="e.g. All skin types" className={inp} />
                        </Field>
                        <Field en="Country of Origin" ko="제조국">
                            <input type="text" value={form.origin} onChange={set('origin')} placeholder="e.g. South Korea" className={inp} />
                        </Field>
                        <Field en="Brand Name" ko="브랜드명">
                            <input type="text" value={form.brandName} onChange={set('brandName')} placeholder="e.g. COSRX, LANEIGE" className={inp} />
                        </Field>
                        <Field en="Expiry (months)" ko="유통기한 (개월)">
                            <input type="number" value={form.expiryMonths} onChange={set('expiryMonths')} placeholder="e.g. 36" className={inp} min="1" />
                        </Field>
                        <Field en="Certifications" ko="인증/특징">
                            <input type="text" value={form.certifications} onChange={set('certifications')} placeholder="e.g. Vegan, EWG, Organic" className={inp} />
                        </Field>
                    </div>
                </section>

                {/* ── Ingredients & Usage ── */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        Ingredients &amp; Usage
                    </h2>
                    <p className="text-[11px] text-gray-400 mb-4 ml-3.5">성분 및 사용법</p>
                    <div className="space-y-4">
                        <Field en="Key Ingredients" ko="성분 정보">
                            <textarea value={form.ingredients} onChange={set('ingredients')} rows={3}
                                placeholder="e.g. Hyaluronic Acid, Niacinamide… · 주요 성분을 입력하세요" className={`${ta} resize-y`} />
                        </Field>
                        <Field en="How to Use" ko="사용 방법">
                            <textarea value={form.howToUse} onChange={set('howToUse')} rows={2}
                                placeholder="e.g. After cleansing, apply to face… · 사용 방법을 입력하세요" className={`${ta} resize-y`} />
                        </Field>
                        <Field en="Benefits / Features" ko="효능/혜택">
                            <textarea value={form.benefits} onChange={set('benefits')} rows={2}
                                placeholder="e.g. 24hr hydration, brightening… · 제품의 주요 효능이나 혜택" className={`${ta} resize-y`} />
                        </Field>
                    </div>
                </section>

                {/* ── Quantity Discount Options ── */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        Quantity Discount Options
                    </h2>
                    <p className="text-[11px] text-gray-400 mb-4 ml-3.5">단위별 할인 옵션 — optional · 선택사항</p>
                    <div className="space-y-3">
                        {options.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No quantity options set. Click below to add. · 수량 옵션 없음.</p>
                        )}
                        {options.map((opt, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto_1fr_auto] gap-2 items-end bg-teal-50/50 p-3 rounded-xl border border-teal-100 relative">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Min Qty</label>
                                    <input type="number" value={opt.minQty}
                                        onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, minQty: e.target.value } : o))}
                                        className={inp} min="1" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Max Qty</label>
                                    <input type="number" value={opt.maxQty}
                                        onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, maxQty: e.target.value } : o))}
                                        className={inp} placeholder="∞" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Discount %</label>
                                    <input type="number" value={opt.discountPct}
                                        onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, discountPct: e.target.value } : o))}
                                        className={inp} />
                                </div>
                                <div className="pb-2">
                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer font-semibold text-gray-600 whitespace-nowrap">
                                        <input type="checkbox" checked={opt.freeShipping}
                                            onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, freeShipping: e.target.checked } : o))}
                                            className="rounded text-teal-600 border-gray-300 w-3.5 h-3.5" />
                                        Free Ship
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Label · 라벨</label>
                                    <input value={opt.labelKo}
                                        onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, labelKo: e.target.value } : o))}
                                        className={inp} placeholder="e.g. Buy 2 get 10% off" />
                                </div>
                                <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                                    className="mb-1 p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setOptions([...options, { minQty: '2', maxQty: '', discountPct: '10', freeShipping: false, labelKo: '' }])}
                            className="text-sm text-teal-600 font-bold flex items-center gap-1 hover:text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 transition-colors">
                            <Plus className="w-4 h-4" /> Add Quantity Option · 수량 옵션 추가
                        </button>
                    </div>
                </section>

                {/* ── Product Variants ── */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        Product Variants
                    </h2>
                    <p className="text-[11px] text-gray-400 mb-4 ml-3.5">색상·사이즈·커스텀 옵션 — optional · 선택사항</p>

                    {/* Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <button type="button" role="switch" aria-checked={variantEnabled}
                            onClick={() => setVariantEnabled(p => !p)}
                            className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 ${variantEnabled ? 'bg-teal-500' : 'bg-gray-200'}`}>
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

                            {/* ── Color ── */}
                            {variantType === 'color' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-[32px_1fr_68px_84px_28px] gap-2 px-1 text-[10px] font-semibold text-gray-400">
                                        <span />
                                        <span>Color name · 색상명</span>
                                        <span className="text-center">Stock</span>
                                        <span className="text-center">Price (opt)</span>
                                        <span />
                                    </div>
                                    {colorVars.map((cv, i) => (
                                        <div key={i} className="grid grid-cols-[32px_1fr_68px_84px_28px] gap-2 items-center bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                            <input type="color" value={cv.hex}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, hex: e.target.value } : c))}
                                                className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                                            <input value={cv.name}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))}
                                                placeholder="e.g. Rose Pink"
                                                className={vInp} />
                                            <input type="number" value={cv.stock}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))}
                                                className={`text-center ${vInp}`} min="0" />
                                            <input type="number" step="0.01" value={cv.price}
                                                onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, price: e.target.value } : c))}
                                                placeholder="—"
                                                className={`text-center ${vInp}`} />
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
                                            className="text-sm font-bold text-teal-600 flex items-center gap-1.5 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 hover:text-teal-700 transition-colors">
                                            <Plus className="w-4 h-4" /> Add Color · 색상 추가
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ── Size ── */}
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
                                                className="px-3 py-1.5 rounded-lg text-sm font-bold border border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 flex items-center gap-1">
                                                <Plus className="w-3.5 h-3.5" /> Custom
                                            </button>
                                        </div>
                                    </div>
                                    {sizeVars.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-[1fr_68px_84px_28px] gap-2 px-1 text-[10px] font-semibold text-gray-400">
                                                <span>Size · 사이즈</span>
                                                <span className="text-center">Stock</span>
                                                <span className="text-center">Price (opt)</span>
                                                <span />
                                            </div>
                                            {sizeVars.map((sv, i) => (
                                                <div key={i} className="grid grid-cols-[1fr_68px_84px_28px] gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                                    <input value={sv.label}
                                                        onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, label: e.target.value } : s))}
                                                        placeholder="e.g. M, 95"
                                                        className={`font-semibold ${vInp}`} />
                                                    <input type="number" value={sv.stock}
                                                        onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, stock: e.target.value } : s))}
                                                        className={`text-center ${vInp}`} min="0" />
                                                    <input type="number" step="0.01" value={sv.price}
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
                                        <p className="text-xs text-gray-400 italic">Click size presets above to add. · 사이즈를 추가하세요.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Custom ── */}
                            {variantType === 'custom' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-[1fr_68px_84px_28px] gap-2 px-1 text-[10px] font-semibold text-gray-400">
                                        <span>Option name · 옵션명</span>
                                        <span className="text-center">Stock</span>
                                        <span className="text-center">Price (opt)</span>
                                        <span />
                                    </div>
                                    {customVars.map((cv, i) => (
                                        <div key={i} className="grid grid-cols-[1fr_68px_84px_28px] gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            <input value={cv.label}
                                                onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, label: e.target.value } : c))}
                                                placeholder="e.g. Starter Kit, Lavender"
                                                className={vInp} />
                                            <input type="number" value={cv.stock}
                                                onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))}
                                                className={`text-center ${vInp}`} min="0" />
                                            <input type="number" step="0.01" value={cv.price}
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
                                        className="text-sm font-bold text-teal-600 flex items-center gap-1.5 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 hover:text-teal-700 transition-colors">
                                        <Plus className="w-4 h-4" /> Add Option · 옵션 추가
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* ── Submit ── */}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => router.back()}
                        className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel <span className="text-[11px] opacity-60">· 취소</span>
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-60">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving
                            ? <span>{uploading ? 'Uploading… · 업로드 중…' : 'Saving… · 저장 중…'}</span>
                            : <span>Submit Changes <span className="text-[11px] opacity-70">· 수정 요청 제출</span></span>
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}
