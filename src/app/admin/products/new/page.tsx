'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Globe, Upload, X, ImagePlus, Package, Tag, Leaf, Droplets, Star, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';

interface ImageItem { file: File; preview: string; url?: string; }
interface Category { id: string; slug: string; nameKo: string; nameEn?: string; parentId?: string | null; }

const MAX_IMAGES = 3;

export default function NewProductPage() {
    const router = useRouter();
    const t = useTranslations();
    const n = t.admin.new;
    const ef = t.admin.edit.fields;

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [doTranslate, setDoTranslate] = useState(false);
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
        // /api/categories is public — works for ADMIN, SUPERADMIN, SUPPLIER alike
        fetch('/api/categories')
            .then(r => r.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(() => { });

        if (typeof window !== 'undefined' && window.location.search.includes('clone=1')) {
            try {
                const stored = sessionStorage.getItem('cloneProduct');
                if (stored) {
                    const data = JSON.parse(stored);
                    setForm(prev => ({
                        ...prev,
                        priceUsd: data.priceUsd ?? prev.priceUsd,
                        stockQty: data.stockQty ? String(data.stockQty) : prev.stockQty,
                        categoryId: data.categoryId ?? prev.categoryId,
                        isNew: data.isNew ?? prev.isNew,
                        baseLang: 'ko',
                        brandName: data.brandName ?? prev.brandName,
                        volume: data.volume ?? prev.volume,
                        skinType: data.skinType ?? prev.skinType,
                        origin: data.origin ?? prev.origin,
                        expiryMonths: data.expiryMonths ? String(data.expiryMonths) : prev.expiryMonths,
                        certifications: data.certifications ?? prev.certifications,
                        name: data.name ?? prev.name,
                        shortDesc: data.shortDesc ?? prev.shortDesc,
                        detailDesc: data.detailDesc ?? prev.detailDesc,
                        ingredients: data.ingredients ?? prev.ingredients,
                        howToUse: data.howToUse ?? prev.howToUse,
                        benefits: data.benefits ?? prev.benefits,
                        seoKeywords: data.seoKeywords ?? prev.seoKeywords,
                    }));
                    if (Array.isArray(data.options) && data.options.length > 0) {
                        setOptions(data.options.map((o: any) => ({
                            minQty: String(o.minQty ?? 1),
                            maxQty: o.maxQty ? String(o.maxQty) : '',
                            discountPct: String(o.discountPct ?? 0),
                            freeShipping: Boolean(o.freeShipping),
                            labelKo: o.labelKo ?? '',
                        })));
                    }
                    sessionStorage.removeItem('cloneProduct');
                }
            } catch { /* ignore parse errors */ }
        }
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
            if (imageFiles.length > 0) addFiles(imageFiles);
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [addFiles]);

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
                    doTranslate,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');
            setSuccessMsg(doTranslate ? n.success.withTranslate : n.success.withoutTranslate);
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
                    <Globe className="text-blue-500 w-6 h-6" />{n.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1">{n.subtitle}</p>
            </div>

            {errorMsg && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md text-sm font-bold">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* ① Images */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<ImagePlus className="w-5 h-5 text-blue-500" />} title={n.images.title} desc={n.images.desc} />
                    <div className="p-5">
                        {images.length < MAX_IMAGES && (
                            <div className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                                onDragEnter={() => setDragActive(true)} onDragLeave={() => setDragActive(false)}
                                onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
                                onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-600">{n.images.uploadHint}</p>
                                <p className="text-xs text-gray-400 mt-1">{n.images.uploadTypes}</p>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
                            </div>
                        )}
                        {images.length > 0 && (
                            <div className={`grid grid-cols-3 gap-3 ${images.length < MAX_IMAGES ? 'mt-4' : ''}`}>
                                {images.map((img, i) => (
                                    <div key={i} className="relative group aspect-square">
                                        <img src={img.preview} className="w-full h-full object-cover rounded-xl border border-gray-200" />
                                        {i === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">🌟 {n.images.cover}</span>}
                                        <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ② Bulk Discount Options */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Star className="w-5 h-5 text-yellow-500" />} title={n.options.title} desc={n.options.desc} />
                    <div className="p-5 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                            ⚠️ Bulk quantity discounts are currently under development and will not be applied at checkout.
                        </div>
                        {options.map((opt, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_2fr_auto] gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{n.options.minQty}</label>
                                    <input type="number" value={opt.minQty} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, minQty: e.target.value } : o))}
                                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" min="1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{n.options.maxQty}</label>
                                    <input type="number" value={opt.maxQty} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, maxQty: e.target.value } : o))}
                                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={n.options.unlimitedPlaceholder} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{n.options.discount}</label>
                                    <input type="number" value={opt.discountPct} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, discountPct: e.target.value } : o))}
                                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                                <div className="pb-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                                        <input type="checkbox" checked={opt.freeShipping} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, freeShipping: e.target.checked } : o))}
                                            className="rounded text-blue-600 focus:ring-blue-500" />
                                        {n.options.freeShipping}
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{n.options.optionLabel}</label>
                                    <input value={opt.labelKo} onChange={e => setOptions(options.map((o, idx) => idx === i ? { ...o, labelKo: e.target.value } : o))}
                                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={n.options.optionLabelPlaceholder} />
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
                            {n.options.addOption}
                        </button>
                    </div>
                </div>

                {/* ③ Basic Info */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Package className="w-5 h-5 text-gray-500" />} title={n.basic.title} />
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">SKU <span className="text-red-500">*</span></label>
                            <input required name="sku" value={form.sku} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. COSRX-AHA-001" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{ef.category}</label>
                            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="">{n.basic.selectCategory}</option>
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
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{ef.price}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                <input required type="number" step="0.01" name="priceUsd" value={form.priceUsd} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 pl-6 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{ef.stock}</label>
                            <input type="number" name="stockQty" value={form.stockQty} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>

                        {/* New Arrival toggle */}
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all select-none hover:border-yellow-300 hover:bg-yellow-50 group"
                                style={{ borderColor: form.isNew ? '#F59E0B' : '#E5E7EB', background: form.isNew ? '#FFFBEB' : '' }}>
                                <input type="checkbox" name="isNew" checked={form.isNew} onChange={handleChange} className="sr-only" />
                                <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.isNew ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isNew ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-gray-800 flex items-center gap-1">
                                        <Sparkles className={`w-4 h-4 ${form.isNew ? 'text-yellow-500' : 'text-gray-400'}`} /> {n.basic.isNewLabel}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">{n.basic.isNewDesc}</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ④ Product Specs */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Tag className="w-5 h-5 text-purple-500" />} title={n.specs.title} desc={n.specs.desc} />
                    <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { label: ef.brand, name: 'brandName', placeholder: 'e.g. COSRX, LANEIGE' },
                            { label: ef.volume, name: 'volume', placeholder: 'e.g. 150ml, 50g' },
                            { label: ef.origin, name: 'origin', placeholder: 'e.g. South Korea' },
                            { label: ef.skinType, name: 'skinType', placeholder: 'e.g. All, Dry, Oily' },
                            { label: ef.expiry, name: 'expiryMonths', placeholder: 'e.g. 36' },
                            { label: ef.certs, name: 'certifications', placeholder: 'e.g. Vegan, EWG' },
                        ].map(f => (
                            <div key={f.name}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                                <input name={f.name} value={(form as any)[f.name]} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={f.placeholder} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ⑤ Content */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" />{n.content.title}</h3>
                            <p className="text-xs text-blue-600 mt-0.5">{n.content.desc}</p>
                        </div>
                        <select name="baseLang" value={form.baseLang} onChange={handleChange} className="border border-blue-200 rounded-lg py-1.5 px-2 text-sm text-blue-700 font-bold bg-white focus:outline-none">
                            <option value="ko">🇰🇷 한국어</option>
                            <option value="en">🇺🇸 English</option>
                        </select>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{n.content.productName}</label>
                            <input required name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. COSRX AHA 7 Whitehead Power Liquid 150ml" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{n.content.shortDesc}</label>
                            <input name="shortDesc" value={form.shortDesc} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Exfoliates & refines pores with 7% AHA" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-green-500" />{n.content.ingredients}</label>
                            <textarea name="ingredients" rows={2} value={form.ingredients} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="e.g. AHA (Glycolic Acid) 7%, Panthenol, Niacinamide, Hyaluronic Acid" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500" />{n.content.howToUse}</label>
                            <textarea name="howToUse" rows={3} value={form.howToUse} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder={"1. After cleansing, apply with a cotton pad\n2. Use 2–3x per week\n3. Follow with sunscreen"} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" />{n.content.benefits}</label>
                            <textarea name="benefits" rows={3} value={form.benefits} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder={"• Exfoliates dead skin for a brighter complexion\n• Minimizes pore appearance\n• Gentle low-pH formula"} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{n.content.detailDesc}</label>
                            <textarea name="detailDesc" rows={4} value={form.detailDesc} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="Brand story, product development background, key differentiators..." />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{n.content.seoKeywords}</label>
                            <input name="seoKeywords" value={form.seoKeywords} onChange={handleChange} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. exfoliant, AHA, COSRX, skincare" />
                        </div>
                        {/* Auto-translate option */}
                        <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${doTranslate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                            <input type="checkbox" checked={doTranslate} onChange={e => setDoTranslate(e.target.checked)}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                            <div>
                                <div className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                                    <RefreshCw className={`w-4 h-4 ${doTranslate ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {n.translate.label}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{n.translate.desc}</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Save */}
                <div className="flex justify-end gap-3 pb-8">
                    <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
                        {n.buttons.cancel}
                    </button>
                    <button type="submit" disabled={isLoading} className="px-8 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-blue-600 rounded-xl shadow hover:bg-blue-700 disabled:opacity-70">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading
                            ? (doTranslate ? n.buttons.savingTranslate : n.buttons.saving)
                            : (doTranslate ? n.buttons.saveWithTranslate : n.buttons.save)
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}
