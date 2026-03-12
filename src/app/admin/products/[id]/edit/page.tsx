'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Save, Loader2, Globe, Upload, X, ImagePlus, Package, Tag, Leaf,
    Droplets, Star, Sparkles, RefreshCw, DollarSign, AlertTriangle, ArrowLeft,
    Flame, CheckCircle,
} from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';

interface ImageItem { id?: string; url: string; isNew?: boolean; file?: File; preview?: string; }
interface Category { id: string; slug: string; nameKo: string; isSystem?: boolean; }
interface Supplier { id: string; companyName: string; brandName?: string | null; }

interface ProductData {
    id: string; sku: string; priceUsd: string; costPrice: string | null;
    stockQty: number; stockAlertQty: number;
    categoryId: string | null; supplierId: string | null;
    status: string; approvalStatus: string; isNew: boolean;
    isHotSale: boolean; hotSalePrice: string | null;
    brandName: string | null; volume: string | null; skinType: string | null;
    origin: string | null; expiryMonths: number | null; certifications: string | null;
    images: { id: string; url: string; sortOrder: number }[];
    options: { id: string; minQty: number; maxQty: number | null; discountPct: string; freeShipping: boolean; labelKo: string | null; labelEn: string | null }[];
    translations: { langCode: string; name: string; shortDesc: string | null; detailDesc: string | null; ingredients: string | null; howToUse: string | null; benefits: string | null; seoKeywords: string | null }[];
}

const Sec = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) => (
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">{icon}{title}</h3>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
    </div>
);

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const t = useTranslations();

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [retranslate, setRetranslate] = useState(false); // default OFF: translate only when checkbox is checked
    const [allTranslations, setAllTranslations] = useState<ProductData['translations']>([]);
    const [transPreviewLang, setTransPreviewLang] = useState<string>('en');
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Images state: existing + new
    const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
    const [deleteImageIds, setDeleteImageIds] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const [options, setOptions] = useState<any[]>([]);

    const [form, setForm] = useState({
        sku: '', priceUsd: '', costPrice: '', stockQty: '0', stockAlertQty: '10',
        categoryId: '', supplierId: '', status: 'ACTIVE', approvalStatus: 'APPROVED',
        isNew: false, isHotSale: false, hotSalePrice: '',
        brandName: '', volume: '', skinType: '', origin: '',
        expiryMonths: '', certifications: '',
        baseLang: 'ko',
        name: '', shortDesc: '', detailDesc: '',
        ingredients: '', howToUse: '', benefits: '', seoKeywords: '',
    });

    // Load product data
    useEffect(() => {
        async function loadProduct() {
            try {
                // Fetch all three independently so one failure doesn't hide another
                const [pRes, cRes, sRes] = await Promise.all([
                    fetch(`/api/admin/products/${productId}`),
                    fetch('/api/admin/categories'),
                    fetch('/api/admin/suppliers'),
                ]);

                // Parse each response independently
                const p = await pRes.json();
                const cats = await cRes.json().catch(() => []);
                const sups = await sRes.json().catch(() => []);

                if (!pRes.ok) throw new Error(p.error || 'Failed to load product');

                const koTrans = p.translations?.find((t: any) => t.langCode === 'ko') ?? p.translations?.[0] ?? {};

                setForm({
                    sku: p.sku ?? '',
                    priceUsd: p.priceUsd ?? '',
                    costPrice: p.costPrice ?? '',
                    stockQty: String(p.stockQty ?? 0),
                    stockAlertQty: String(p.stockAlertQty ?? 10),
                    categoryId: p.categoryId ?? '',
                    supplierId: p.supplierId ?? '',
                    status: p.status ?? 'ACTIVE',
                    approvalStatus: p.approvalStatus ?? 'APPROVED',
                    isNew: p.isNew ?? false,
                    isHotSale: p.isHotSale ?? false,
                    hotSalePrice: p.hotSalePrice ?? '',
                    brandName: p.brandName ?? '',
                    volume: p.volume ?? '',
                    skinType: p.skinType ?? '',
                    origin: p.origin ?? '',
                    expiryMonths: p.expiryMonths ? String(p.expiryMonths) : '',
                    certifications: p.certifications ?? '',
                    baseLang: 'ko',
                    name: koTrans.name ?? '',
                    shortDesc: koTrans.shortDesc ?? '',
                    detailDesc: koTrans.detailDesc ?? '',
                    ingredients: koTrans.ingredients ?? '',
                    howToUse: koTrans.howToUse ?? '',
                    benefits: koTrans.benefits ?? '',
                    seoKeywords: koTrans.seoKeywords ?? '',
                });
                setAllTranslations(p.translations ?? []);
                setExistingImages(p.images ?? []);
                setOptions(p.options?.map((o: any) => ({
                    id: o.id, minQty: String(o.minQty), maxQty: o.maxQty ? String(o.maxQty) : '',
                    discountPct: o.discountPct, freeShipping: o.freeShipping,
                    labelKo: o.labelKo ?? '', labelEn: o.labelEn ?? '',
                })) ?? []);
                setCategories(Array.isArray(cats) ? cats : []);
                setSuppliers(Array.isArray(sups) ? sups.filter((s: any) => s.status === 'APPROVED') : []);
            } catch (e: any) {
                setErrorMsg(e.message);
            } finally {
                setIsFetching(false);
            }
        }
        loadProduct();
    }, [productId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
        setForm(prev => ({ ...prev, [target.name]: value }));
    };

    const addNewFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        const totalImages = existingImages.length - deleteImageIds.length + newImages.length;
        const toAdd = arr.slice(0, Math.max(0, 10 - totalImages));
        setNewImages(prev => [...prev, ...toAdd.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    }, [existingImages.length, deleteImageIds.length, newImages.length]);

    // Global paste handler — Ctrl+V anywhere on the page adds image
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
            if (imageFiles.length > 0) addNewFiles(imageFiles);
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [addNewFiles]);

    const removeExistingImage = (imgId: string) => {
        setDeleteImageIds(prev => [...prev, imgId]);
    };

    const removeNewImage = (idx: number) => {
        setNewImages(prev => {
            const item = prev[idx];
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const uploadNewImages = async (): Promise<string[]> => {
        const uploaded: string[] = [];
        for (const img of newImages) {
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
        setIsLoading(true); setErrorMsg(''); setSuccessMsg('');
        try {
            const newImageUrls = newImages.length > 0 ? await uploadNewImages() : [];
            const res = await fetch(`/api/admin/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    isNew: form.isNew,
                    isHotSale: form.isHotSale,
                    hotSalePrice: form.hotSalePrice || null,
                    costPrice: form.costPrice || null,
                    categoryId: form.categoryId || null,
                    supplierId: form.supplierId || null,
                    expiryMonths: form.expiryMonths ? parseInt(form.expiryMonths) : null,
                    retranslate,
                    imageUrls: newImageUrls,
                    deleteImageIds,
                    options: options.map((o, i) => ({ ...o, sortOrder: i })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fail');
            setSuccessMsg(retranslate ? t.admin.edit.retranslate.label : t.common.save + ' OK');
            setDeleteImageIds([]);
            setNewImages([]);
            // Refresh images + translations (minimal refresh before redirect)
            const fresh = await fetch(`/api/admin/products/${productId}`).then(r => r.json());
            setExistingImages(fresh.images ?? []);
            setAllTranslations(fresh.translations ?? []);
            
            // Redirect to list page after a short delay
            setTimeout(() => {
                setSuccessMsg('');
                router.push('/admin/products');
            }, 1000);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const marginPct = form.costPrice && form.priceUsd
        ? Math.round((1 - parseFloat(form.costPrice) / parseFloat(form.priceUsd)) * 100)
        : null;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <button onClick={() => router.back()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-blue-500 w-6 h-6" /> {t.admin.edit.title}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">{t.admin.edit.sku}: {form.sku}</p>
                </div>
            </div>

            {errorMsg && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md text-sm font-bold">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ① 이미지 관리 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<ImagePlus className="w-5 h-5 text-blue-500" />} title={t.admin.edit.sections.images} desc="Max 10 images" />
                    <div className="p-5 space-y-4">
                        {/* Existing images */}
                        {existingImages.filter(img => !deleteImageIds.includes(img.id)).length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-2">현재 이미지 (클릭하여 삭제)</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {existingImages.filter(img => !deleteImageIds.includes(img.id)).map((img, i) => (
                                        <div key={img.id} className="relative group aspect-square">
                                            <img src={img.url.startsWith('http') || img.url.startsWith('/') ? img.url : `/${img.url}`}
                                                className="w-full h-full object-cover rounded-xl border border-gray-200"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Image+Load+Error';
                                                }} />
                                            {i === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{t.common.confirm === '확인' ? '대표' : 'Main'}</span>}
                                            <button type="button" onClick={() => removeExistingImage(img.id)}
                                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* New images to upload */}
                        {newImages.length > 0 && (
                            <div>
                                <p className="text-xs text-blue-500 mb-2">추가할 이미지</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {newImages.map((img, i) => (
                                        <div key={i} className="relative group aspect-square">
                                            <img src={img.preview} className="w-full h-full object-cover rounded-xl border border-blue-200" />
                                            <button type="button" onClick={() => removeNewImage(i)}
                                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Upload area */}
                        <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                            onDragEnter={() => setDragActive(true)}
                            onDragLeave={() => setDragActive(false)}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); setDragActive(false); addNewFiles(e.dataTransfer.files); }}
                            onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                            <p className="text-sm text-gray-500">클릭 · 드래그 · Ctrl+V 붙여넣기</p>
                            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                                onChange={e => e.target.files && addNewFiles(e.target.files)} />
                        </div>
                    </div>
                </div>

                {/* ② 기본 정보 & 판매 설정 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Package className="w-5 h-5 text-gray-500" />} title={t.admin.edit.sections.basic} />
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.sku}</label>
                            <input required name="sku" value={form.sku} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.category}</label>
                            <select name="categoryId" value={form.categoryId} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="">— 미분류 —</option>
                                {/* 일반 카테고리 먼저 */}
                                {categories.filter(c => !c.isSystem).map(c => (
                                    <option key={c.id} value={c.id}>{c.nameKo}</option>
                                ))}
                                {/* 시스템 카테고리 구분선과 함께 표시 */}
                                {categories.some(c => c.isSystem) && (
                                    <option disabled>── 시스템 카테고리 ──</option>
                                )}
                                {categories.filter(c => c.isSystem).map(c => (
                                    <option key={c.id} value={c.id}>{c.nameKo} ✦</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.supplier}</label>
                            <select name="supplierId" value={form.supplierId} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="">— 없음 —</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.companyName}{s.brandName ? ` (${s.brandName})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.status}</label>
                            <select name="status" value={form.status} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="ACTIVE">판매중</option>
                                <option value="INACTIVE">숨김</option>
                                <option value="SOLDOUT">품절</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.price}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                <input required type="number" step="0.01" name="priceUsd" value={form.priceUsd} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg py-2 pl-6 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                {t.admin.edit.fields.cost}
                                {marginPct !== null && (
                                    <span className={`ml-2 font-bold ${marginPct >= 30 ? 'text-green-600' : marginPct >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        → Margin {marginPct}%
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                <input type="number" step="0.01" name="costPrice" value={form.costPrice} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg py-2 pl-6 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="0.00 (선택)" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.stock}</label>
                            <input type="number" name="stockQty" value={form.stockQty} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.alert}</label>
                            <input type="number" name="stockAlertQty" value={form.stockAlertQty} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        {/* 승인 상태 */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.approval}</label>
                            <select name="approvalStatus" value={form.approvalStatus} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="APPROVED">✅ 승인됨</option>
                                <option value="PENDING">🟡 검수 대기</option>
                                <option value="REJECTED">❌ 반려</option>
                            </select>
                        </div>
                        {/* isNew */}
                        <div className="flex gap-3">
                            <label className="flex-1 flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all select-none hover:border-yellow-300 hover:bg-yellow-50"
                                style={{ borderColor: form.isNew ? '#F59E0B' : '#E5E7EB', background: form.isNew ? '#FFFBEB' : '' }}>
                                <input type="checkbox" name="isNew" checked={form.isNew} onChange={handleChange} className="sr-only" />
                                <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isNew ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isNew ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <Sparkles className={`w-3.5 h-3.5 ${form.isNew ? 'text-yellow-500' : 'text-gray-400'}`} /> NEW
                                </span>
                            </label>
                            <label className="flex-1 flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all select-none hover:border-red-300 hover:bg-red-50"
                                style={{ borderColor: form.isHotSale ? '#EF4444' : '#E5E7EB', background: form.isHotSale ? '#FEF2F2' : '' }}>
                                <input type="checkbox" name="isHotSale" checked={form.isHotSale} onChange={handleChange} className="sr-only" />
                                <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isHotSale ? 'bg-red-500' : 'bg-gray-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isHotSale ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <Flame className={`w-3.5 h-3.5 ${form.isHotSale ? 'text-red-500' : 'text-gray-400'}`} /> HOT
                                </span>
                            </label>
                        </div>
                        {form.isHotSale && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.hotPrice}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                    <input type="number" step="0.01" name="hotSalePrice" value={form.hotSalePrice} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg py-2 pl-6 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ③ 수량별 할인 옵션 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Star className="w-5 h-5 text-yellow-500" />} title={t.admin.edit.sections.options} desc="" />
                    <div className="p-5 space-y-3">
                        {options.map((opt, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_2fr_auto] gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">최소 수량</label>
                                    <input type="number" value={opt.minQty} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, minQty: e.target.value } : o))}
                                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" min="1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">최대 수량</label>
                                    <input type="number" value={opt.maxQty} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, maxQty: e.target.value } : o))}
                                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="무제한" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">할인율(%)</label>
                                    <input type="number" value={opt.discountPct} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, discountPct: e.target.value } : o))}
                                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                                <div className="pb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={opt.freeShipping} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, freeShipping: e.target.checked } : o))}
                                            className="rounded text-blue-600" />
                                        무료배송
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">라벨</label>
                                    <input value={opt.labelKo} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, labelKo: e.target.value } : o))}
                                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="예: 2개 10% 할인" />
                                </div>
                                <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                                    className="mb-1 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setOptions([...options, { minQty: '2', maxQty: '', discountPct: '10', freeShipping: false, labelKo: '' }])}
                            className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700">
                            {t.admin.edit.buttons.addOption}
                        </button>
                    </div>
                </div>

                {/* ④ 상품 사양 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Tag className="w-5 h-5 text-purple-500" />} title={t.admin.edit.sections.specs} />
                    <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { label: t.admin.edit.fields.brand, name: 'brandName', placeholder: 'K-Brand' },
                            { label: t.admin.edit.fields.volume, name: 'volume', placeholder: '150ml' },
                            { label: t.admin.edit.fields.origin, name: 'origin', placeholder: 'Korea' },
                            { label: t.admin.edit.fields.skinType, name: 'skinType', placeholder: 'All Skin Types' },
                            { label: t.admin.edit.fields.expiry, name: 'expiryMonths', placeholder: '36' },
                            { label: t.admin.edit.fields.certs, name: 'certifications', placeholder: 'Vegan' },
                        ].map(f => (
                            <div key={f.name}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                                <input name={f.name} value={(form as any)[f.name]} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder={f.placeholder} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ⑤ 콘텐츠 & 번역 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />{t.admin.edit.sections.content}
                            </h3>
                            <p className="text-xs text-blue-600 mt-0.5">{t.admin.edit.retranslate.desc}</p>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.name}</label>
                            <input required name="name" value={form.name} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.shortDesc}</label>
                            <input name="shortDesc" value={form.shortDesc} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-green-500" />{t.admin.edit.fields.ingredients}</label>
                            <textarea name="ingredients" rows={2} value={form.ingredients} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500" />{t.admin.edit.fields.howToUse}</label>
                            <textarea name="howToUse" rows={3} value={form.howToUse} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" />{t.admin.edit.fields.benefits}</label>
                            <textarea name="benefits" rows={3} value={form.benefits} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.detailDesc}</label>
                            <textarea name="detailDesc" rows={4} value={form.detailDesc} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.seo}</label>
                            <input name="seoKeywords" value={form.seoKeywords} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        {/* Re-translate option */}
                        <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${retranslate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                            <input type="checkbox" checked={retranslate} onChange={e => setRetranslate(e.target.checked)}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                            <div>
                                <div className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                                    <RefreshCw className={`w-4 h-4 ${retranslate ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {t.admin.edit.retranslate.label}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{t.admin.edit.retranslate.desc}</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end gap-3 pb-8">
                    <button type="button" onClick={() => router.back()}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
                        {t.admin.edit.buttons.cancel}
                    </button>
                    <button type="submit" disabled={isLoading}
                        className="px-8 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-blue-600 rounded-xl shadow hover:bg-blue-700 disabled:opacity-70">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading ? t.admin.edit.buttons.saving : t.admin.edit.buttons.save}
                    </button>
                </div>
            </form>

            {/* ⑥ 번역 현황 패널 (저장 후 확인용) */}
            {allTranslations.length > 0 && (
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 mb-8">
                    <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-indigo-500" />{t.admin.edit.sections.preview}
                        </h3>
                        <p className="text-xs text-indigo-600 mt-0.5">View 4-language translations</p>
                    </div>
                    <div className="p-5">
                        {/* Language tabs */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {[
                                { code: 'ko', label: '🇰🇷 한국어', color: 'red' },
                                { code: 'en', label: '🇺🇸 English', color: 'blue' },
                                { code: 'km', label: '🇰🇭 ខ្មែរ', color: 'green' },
                                { code: 'zh', label: '🇨🇳 中文', color: 'yellow' },
                            ].map(({ code, label, color }) => {
                                const hasTrans = allTranslations.some(t => t.langCode === code && t.name);
                                return (
                                    <button key={code} onClick={() => setTransPreviewLang(code)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all flex items-center gap-1.5 ${transPreviewLang === code ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                                        {label}
                                        <span className={`w-2 h-2 rounded-full ${hasTrans ? 'bg-green-400' : 'bg-red-300'}`} />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Translation content */}
                        {(() => {
                            const t = allTranslations.find(tr => tr.langCode === transPreviewLang);
                            if (!t) return <p className="text-sm text-gray-400 py-4 text-center">이 언어 번역이 없습니다.</p>;
                            return (
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs font-bold text-gray-500 mb-1">상품명</p>
                                            <p className="text-gray-800 font-medium">{t.name || <span className="text-red-400 italic">없음</span>}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs font-bold text-gray-500 mb-1">한 줄 요약</p>
                                            <p className="text-gray-700">{t.shortDesc || <span className="text-gray-400 italic">없음</span>}</p>
                                        </div>
                                    </div>
                                    {t.detailDesc && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs font-bold text-gray-500 mb-1">상세 설명</p>
                                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-4">{t.detailDesc}</p>
                                        </div>
                                    )}
                                    {t.ingredients && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs font-bold text-gray-500 mb-1">성분</p>
                                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">{t.ingredients}</p>
                                        </div>
                                    )}
                                    {t.howToUse && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs font-bold text-gray-500 mb-1">사용 방법</p>
                                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">{t.howToUse}</p>
                                        </div>
                                    )}
                                    {t.benefits && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs font-bold text-gray-500 mb-1">효능/특징</p>
                                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">{t.benefits}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
