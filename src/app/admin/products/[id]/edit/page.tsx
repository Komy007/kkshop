'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Save, Loader2, Globe, Upload, X, ImagePlus, Package, Tag, Leaf,
    Droplets, Star, Sparkles, RefreshCw, DollarSign, AlertTriangle, ArrowLeft,
    Flame, CheckCircle,
} from 'lucide-react';

interface ImageItem { id?: string; url: string; isNew?: boolean; file?: File; preview?: string; }
interface Category { id: string; slug: string; nameKo: string; }
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

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [retranslate, setRetranslate] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Images state: existing + new
    const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
    const [deleteImageIds, setDeleteImageIds] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);

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
                const [pRes, cRes, sRes] = await Promise.all([
                    fetch(`/api/admin/products/${productId}`),
                    fetch('/api/admin/categories'),
                    fetch('/api/admin/suppliers'),
                ]);
                const [p, cats, sups] = await Promise.all([pRes.json(), cRes.json(), sRes.json()]);

                if (!pRes.ok) throw new Error(p.error || 'Not found');

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
            if (!res.ok) throw new Error(data.error || '저장 실패');
            setSuccessMsg(retranslate ? '✅ 저장 완료! 4개국어 번역이 재생성되었습니다.' : '✅ 상품이 저장되었습니다.');
            setDeleteImageIds([]);
            setNewImages([]);
            // Refresh images
            const fresh = await fetch(`/api/admin/products/${productId}`).then(r => r.json());
            setExistingImages(fresh.images ?? []);
            setTimeout(() => setSuccessMsg(''), 3000);
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
                        <Package className="text-blue-500 w-6 h-6" />상품 편집
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">SKU: {form.sku}</p>
                </div>
            </div>

            {errorMsg && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md text-sm font-bold">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ① 이미지 관리 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<ImagePlus className="w-5 h-5 text-blue-500" />} title="이미지 관리" desc="첫 번째 이미지 = 대표사진 · 최대 10장" />
                    <div className="p-5 space-y-4">
                        {/* Existing images */}
                        {existingImages.filter(img => !deleteImageIds.includes(img.id)).length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-2">현재 이미지 (클릭하여 삭제)</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {existingImages.filter(img => !deleteImageIds.includes(img.id)).map((img, i) => (
                                        <div key={img.id} className="relative group aspect-square">
                                            <img src={img.url} className="w-full h-full object-cover rounded-xl border border-gray-200" />
                                            {i === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">대표</span>}
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
                        <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-all"
                            onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                            <p className="text-sm text-gray-500">클릭하여 이미지 추가</p>
                            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                                onChange={e => e.target.files && addNewFiles(e.target.files)} />
                        </div>
                    </div>
                </div>

                {/* ② 기본 정보 & 판매 설정 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Package className="w-5 h-5 text-gray-500" />} title="기본 정보 & 판매 설정" />
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">SKU *</label>
                            <input required name="sku" value={form.sku} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
                            <select name="categoryId" value={form.categoryId} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="">— 미분류 —</option>
                                {categories.filter(c => !['new', 'best', 'sale', 'foryou'].includes(c.slug)).map(c => (
                                    <option key={c.id} value={c.id}>{c.nameKo}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">공급업체</label>
                            <select name="supplierId" value={form.supplierId} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="">— 없음 —</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.companyName}{s.brandName ? ` (${s.brandName})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">판매 상태</label>
                            <select name="status" value={form.status} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="ACTIVE">판매중</option>
                                <option value="INACTIVE">숨김</option>
                                <option value="SOLDOUT">품절</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">판매가 (USD) *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                <input required type="number" step="0.01" name="priceUsd" value={form.priceUsd} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg py-2 pl-6 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                매입가(원가) (USD)
                                {marginPct !== null && (
                                    <span className={`ml-2 font-bold ${marginPct >= 30 ? 'text-green-600' : marginPct >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        → 마진 {marginPct}%
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
                            <label className="block text-xs font-medium text-gray-600 mb-1">현재 재고</label>
                            <input type="number" name="stockQty" value={form.stockQty} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">저재고 알림 기준</label>
                            <input type="number" name="stockAlertQty" value={form.stockAlertQty} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        {/* 승인 상태 */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">검수 상태</label>
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
                                <label className="block text-xs font-medium text-gray-600 mb-1">핫세일 가격 (USD)</label>
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
                    <Sec icon={<Star className="w-5 h-5 text-yellow-500" />} title="수량별 할인 옵션" desc="많이 살수록 혜택을 제공합니다." />
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
                            + 옵션 추가
                        </button>
                    </div>
                </div>

                {/* ④ 상품 사양 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Tag className="w-5 h-5 text-purple-500" />} title="상품 사양" />
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
                                <Globe className="w-5 h-5 text-blue-500" />콘텐츠 (한국어 기준)
                            </h3>
                            <p className="text-xs text-blue-600 mt-0.5">저장 후 번역 재생성 옵션을 선택할 수 있습니다</p>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상품명 *</label>
                            <input required name="name" value={form.name} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">한 줄 요약</label>
                            <input name="shortDesc" value={form.shortDesc} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-green-500" />주요 성분</label>
                            <textarea name="ingredients" rows={2} value={form.ingredients} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500" />사용 방법</label>
                            <textarea name="howToUse" rows={3} value={form.howToUse} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" />주요 효능/특징</label>
                            <textarea name="benefits" rows={3} value={form.benefits} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상세 설명</label>
                            <textarea name="detailDesc" rows={4} value={form.detailDesc} onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">SEO 키워드</label>
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
                                    저장 시 4개국어 번역 재생성
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">체크 시 한·영·크메르·중문 번역이 새로 생성됩니다. 구글 번역 API 사용.</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end gap-3 pb-8">
                    <button type="button" onClick={() => router.back()}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
                        취소
                    </button>
                    <button type="submit" disabled={isLoading}
                        className="px-8 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-blue-600 rounded-xl shadow hover:bg-blue-700 disabled:opacity-70">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </form>
        </div>
    );
}
