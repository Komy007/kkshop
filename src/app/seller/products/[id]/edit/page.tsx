'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Loader2, ChevronLeft, AlertCircle, CheckCircle, Upload, X, ImagePlus } from 'lucide-react';

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

const BADGE: Record<string, string> = {
    PENDING:  'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-600',
};
const BADGE_LABEL: Record<string, { en: string; ko: string }> = {
    PENDING:  { en: 'Under Review', ko: '검수 대기중' },
    APPROVED: { en: 'Approved & Live', ko: '판매 승인됨' },
    REJECTED: { en: 'Rejected', ko: '반려됨' },
};

/* EN big / KO small label */
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

const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none";
const ta  = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-none";

export default function SellerProductEditPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<ProductForm>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; textKo: string } | null>(null);

    // Image state
    const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
    const [deleteImageIds, setDeleteImageIds] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);

    useEffect(() => {
        fetch(`/api/seller/products/${productId}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { router.push('/seller/products'); return; }
                const ko = data.translations?.find((t: any) => t.langCode === 'ko') ?? {};
                setForm({
                    name:        ko.name        ?? '',
                    shortDesc:   ko.shortDesc   ?? '',
                    detailDesc:  ko.detailDesc  ?? '',
                    ingredients: ko.ingredients ?? '',
                    howToUse:    ko.howToUse    ?? '',
                    benefits:    ko.benefits    ?? '',
                    priceUsd:    data.priceUsd  ?? '',
                    volume:      data.volume    ?? '',
                    skinType:    data.skinType  ?? '',
                    origin:      data.origin    ?? '',
                });
                setApprovalStatus(data.approvalStatus ?? 'PENDING');
                setExistingImages(data.images ?? []);
            })
            .finally(() => setLoading(false));
    }, [productId, router]);

    const addFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        const visibleCount = existingImages.filter(img => !deleteImageIds.includes(img.id)).length + newImages.length;
        const toAdd = arr.slice(0, Math.max(0, 5 - visibleCount));
        setNewImages(prev => [
            ...prev,
            ...toAdd.map(file => ({ file, preview: URL.createObjectURL(file) })),
        ]);
    }, [existingImages, deleteImageIds, newImages.length]);

    /* Ctrl+V paste anywhere */
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
                for (const img of newImages) {
                    const fd = new FormData();
                    fd.append('file', img.file);
                    const up = await fetch('/api/upload', { method: 'POST', body: fd });
                    const upData = await up.json();
                    if (upData.url) uploadedUrls.push(upData.url);
                }
                setUploading(false);
            }

            // 2. Save product
            const res = await fetch(`/api/seller/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    imageUrls: uploadedUrls,
                    deleteImageIds,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Changes saved! Redirecting… · 저장 완료! 목록으로 이동합니다…', textKo: '수정이 완료되었습니다. 재검수 대기중입니다.' });
                setApprovalStatus('PENDING');
                setDeleteImageIds([]);
                setNewImages([]);
                // Redirect to product list after short delay so user can see success message
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

    const badgeInfo = BADGE_LABEL[approvalStatus];
    const visibleExisting = existingImages.filter(img => !deleteImageIds.includes(img.id));
    const totalImages = visibleExisting.length + newImages.length;

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
                    <span className="block text-xs opacity-75 mt-0.5">수정 시 재검수 안내: 상품을 수정하면 검수 상태가 대기중으로 변경됩니다. 관리자 승인 후 다시 판매됩니다 (보통 1~2 영업일 소요).</span>
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

                {/* ── Product Images ─────────────────────────────────────── */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        Product Images
                        <span className="text-[10px] font-normal text-gray-400 ml-1">{totalImages}/5 · 상품 이미지</span>
                    </h2>
                    <p className="text-[11px] text-gray-400 mb-4 ml-3.5">Click × to remove · 상품 이미지 최대 5장</p>

                    <div className="flex gap-3 flex-wrap">
                        {/* Existing images */}
                        {visibleExisting.map((img, i) => (
                            <div key={img.id} className="relative w-24 h-24 group">
                                <img
                                    src={img.url}
                                    alt={`Product image ${i + 1}`}
                                    className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/96x96?text=Error';
                                    }}
                                />
                                {i === 0 && (
                                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                        Main · 대표
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeExisting(img.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {/* New images (not uploaded yet) */}
                        {newImages.map((img, i) => (
                            <div key={`new-${i}`} className="relative w-24 h-24 group">
                                <img
                                    src={img.preview}
                                    alt="New"
                                    className="w-24 h-24 object-cover rounded-xl border-2 border-teal-300"
                                />
                                <span className="absolute bottom-1 left-1 bg-teal-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                    New · 신규
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeNew(i)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {/* Add button */}
                        {totalImages < 5 && (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-600 transition-colors"
                            >
                                <ImagePlus className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Add</span>
                                <span className="text-[9px] opacity-60 mt-0.5">or Ctrl+V</span>
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => e.target.files && addFiles(e.target.files)}
                    />
                    {uploading && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-teal-600">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading images… · 이미지 업로드 중…
                        </div>
                    )}
                </section>

                {/* ── Basic Info ─────────────────────────────────────────── */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                        Basic Information
                    </h2>
                    <p className="text-[11px] text-gray-400 mb-4 ml-3.5">기본 정보</p>
                    <div className="space-y-4">
                        <Field en="Product Name" ko="상품명 (한국어)" required>
                            <input
                                type="text"
                                value={form.name}
                                onChange={set('name')}
                                required
                                placeholder="e.g. Hydrating Ampoule Serum / 수분 앰플 세럼"
                                className={inp}
                            />
                        </Field>
                        <Field en="Short Description" ko="짧은 설명">
                            <textarea
                                value={form.shortDesc}
                                onChange={set('shortDesc')}
                                rows={2}
                                placeholder="1–2 line summary shown on product cards · 상품 요약 설명"
                                className={ta}
                            />
                        </Field>
                        <Field en="Detailed Description" ko="상세 설명">
                            <textarea
                                value={form.detailDesc}
                                onChange={set('detailDesc')}
                                rows={5}
                                placeholder="Product features, effects, detailed information · 상품 상세 설명"
                                className={`${ta} resize-y`}
                            />
                        </Field>
                    </div>
                </section>

                {/* ── Pricing & Specs ────────────────────────────────────── */}
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
                        <Field en="Volume / Weight" ko="용량/중량">
                            <input type="text" value={form.volume} onChange={set('volume')} placeholder="e.g. 50ml, 200g" className={inp} />
                        </Field>
                        <Field en="Skin Type" ko="피부타입">
                            <input type="text" value={form.skinType} onChange={set('skinType')} placeholder="e.g. All skin types · 건성, 지성, 복합성" className={inp} />
                        </Field>
                        <Field en="Country of Origin" ko="제조국">
                            <input type="text" value={form.origin} onChange={set('origin')} placeholder="e.g. South Korea · 대한민국" className={inp} />
                        </Field>
                    </div>
                </section>

                {/* ── Ingredients & Usage ────────────────────────────────── */}
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

                {/* ── Submit ─────────────────────────────────────────────── */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel <span className="text-[11px] opacity-60">· 취소</span>
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-60"
                    >
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
