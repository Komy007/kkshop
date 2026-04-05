'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Globe, Upload, X, ImagePlus, Package, Tag, Leaf, Droplets, Star, Sparkles, RefreshCw, Plus } from 'lucide-react';
import DraggableImageGrid from '@/components/DraggableImageGrid';
import { useTranslations } from '@/i18n/useTranslations';

interface ImageItem { file: File; preview: string; url?: string; }
interface Category { id: string; slug: string; nameKo: string; nameEn?: string; parentId?: string | null; }

const MAX_IMAGES = 10;
const SIZE_PRESETS   = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const VOLUME_PRESETS = ['30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '300ml', '500ml', '1L'];
const UNIT_LABELS    = ['개', 'box', 'pack', 'set', '병', '튜브', '매', '장', '캡슐'];
const vInp = "px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

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
    const [bulkDiscountEnabled, setBulkDiscountEnabled] = useState(false);
    const [options, setOptions] = useState<{ minQty: string; maxQty: string; discountPct: string; freeShipping: boolean; labelKo: string }[]>([]);

    // ── Variant state ──
    const [enableColor,  setEnableColor]  = useState(false);
    const [enableSize,   setEnableSize]   = useState(false);
    const [enableVolume, setEnableVolume] = useState(false);
    const [enableCustom, setEnableCustom] = useState(false);
    const [colorVars,  setColorVars]  = useState([{ name: '', hex: '#FF6B6B', stock: '0', price: '' }]);
    const [sizeVars,   setSizeVars]   = useState<{ label: string; stock: string; price: string }[]>([]);
    const [volumeVars, setVolumeVars] = useState<{ label: string; stock: string; price: string }[]>([]);
    const [customVars, setCustomVars] = useState([{ label: '', stock: '0', price: '' }]);

    const [form, setForm] = useState({
        sku: '', priceUsd: '', stockQty: '100',
        categoryId: '', isNew: false,
        baseLang: 'ko',
        brandName: '', volume: '', skinType: '', origin: '대한민국',
        expiryMonths: '', certifications: '',
        unitLabel: '개', unitsPerPkg: '',
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
                        unitLabel: data.unitLabel ?? prev.unitLabel,
                        unitsPerPkg: data.unitsPerPkg ? String(data.unitsPerPkg) : prev.unitsPerPkg,
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

    const reorderImages = (from: number, to: number) => {
        setImages(prev => {
            const arr = [...prev];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return arr;
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

            // ── Build multi-type variants payload ──
            const variantsPayload: any[] = [];
            if (enableColor) colorVars.filter(v => v.name.trim()).forEach((v, i) => variantsPayload.push({ variantType: 'COLOR', variantValue: `${v.name.trim()}|${v.hex}`, stockQty: parseInt(v.stock) || 0, priceUsd: v.price || null, sortOrder: i }));
            if (enableSize)  sizeVars.filter(v => v.label.trim()).forEach((v, i) => variantsPayload.push({ variantType: 'SIZE', variantValue: v.label.trim(), stockQty: parseInt(v.stock) || 0, priceUsd: v.price || null, sortOrder: i }));
            if (enableVolume) volumeVars.filter(v => v.label.trim()).forEach((v, i) => variantsPayload.push({ variantType: 'VOLUME', variantValue: v.label.trim(), stockQty: parseInt(v.stock) || 0, priceUsd: v.price || null, sortOrder: i }));
            if (enableCustom) customVars.filter(v => v.label.trim()).forEach((v, i) => variantsPayload.push({ variantType: 'OTHER', variantValue: v.label.trim(), stockQty: parseInt(v.stock) || 0, priceUsd: v.price || null, sortOrder: i }));

            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    imageUrls,
                    isNew: form.isNew,
                    categoryId: form.categoryId || null,
                    expiryMonths: form.expiryMonths ? parseInt(form.expiryMonths) : null,
                    unitsPerPkg: form.unitsPerPkg ? parseInt(form.unitsPerPkg) : null,
                    options: bulkDiscountEnabled ? options : [],
                    variants: variantsPayload,
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
                            <div className={images.length < MAX_IMAGES ? 'mt-4' : ''}>
                                <DraggableImageGrid
                                    images={images.map((img, i) => ({ id: `img-${i}-${img.preview.slice(-8)}`, src: img.preview }))}
                                    onReorder={reorderImages}
                                    onRemove={removeImage}
                                    coverLabel={n.images.cover}
                                    layout="grid3"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ② Bulk Discount Options */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Star className="w-5 h-5 text-yellow-500" />} title={n.options.title} desc={n.options.desc} />
                    <div className="p-5 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <button type="button" role="switch" aria-checked={bulkDiscountEnabled} onClick={() => setBulkDiscountEnabled(p => !p)}
                                className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${bulkDiscountEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${bulkDiscountEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-sm font-semibold text-gray-800">Enable bulk discount <span className="text-xs text-gray-400 font-normal">수량 할인 설정</span></span>
                        </label>
                        {bulkDiscountEnabled && options.map((opt, i) => (
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
                        {bulkDiscountEnabled && (
                            <button type="button" onClick={() => setOptions([...options, { minQty: '10', maxQty: '', discountPct: '10', freeShipping: false, labelKo: '' }])}
                                className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700">
                                {n.options.addOption}
                            </button>
                        )}
                    </div>
                </div>

                {/* ②-B Product Variants */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Tag className="w-5 h-5 text-indigo-500" />} title="Product Variants · 상품 옵션" desc="색상 / 사이즈 / 용량 / 기타 (복수 선택 가능)" />
                    <div className="p-5 space-y-4">
                        {/* Multi-type checkboxes */}
                        <div className="flex flex-wrap gap-2">
                            {([
                                { key: 'color',  label: '🎨 Color',  val: enableColor,  set: setEnableColor  },
                                { key: 'size',   label: '📏 Size',   val: enableSize,   set: setEnableSize   },
                                { key: 'volume', label: '🧴 Volume', val: enableVolume, set: setEnableVolume },
                                { key: 'custom', label: '🏷️ Custom', val: enableCustom, set: setEnableCustom },
                            ] as const).map(({ key, label, val, set: setter }) => (
                                <label key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm font-semibold transition-all select-none ${val ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'}`}>
                                    <input type="checkbox" checked={val} onChange={() => setter(p => !p)} className="hidden" />
                                    {label}
                                </label>
                            ))}
                        </div>

                        {(enableColor || enableSize || enableVolume || enableCustom) && (
                            <div className="space-y-6">
                                {/* Color */}
                                {enableColor && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-700">🎨 Color Variants</p>
                                        <div className="grid grid-cols-[40px_1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400">
                                            <span /><span>Color name · 색상명</span><span className="text-center">Stock</span><span className="text-center">Price (opt)</span><span />
                                        </div>
                                        {colorVars.map((cv, i) => (
                                            <div key={i} className="grid grid-cols-[40px_1fr_72px_88px_28px] gap-2 items-center bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                                <input type="color" value={cv.hex} onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, hex: e.target.value } : c))} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                                                <input value={cv.name} onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))} placeholder="e.g. Rose Pink" className={vInp} />
                                                <input type="number" value={cv.stock} onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))} className={`text-center ${vInp}`} min="0" />
                                                <input type="number" step="0.01" value={cv.price} onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, price: e.target.value } : c))} placeholder="—" className={`text-center ${vInp}`} />
                                                {colorVars.length > 1 ? <button type="button" onClick={() => setColorVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button> : <span />}
                                            </div>
                                        ))}
                                        {colorVars.length < 10 && <button type="button" onClick={() => setColorVars(p => [...p, { name: '', hex: '#4A90E2', stock: '0', price: '' }])} className="text-sm font-bold text-blue-600 flex items-center gap-1.5 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"><Plus className="w-4 h-4" /> Add Color</button>}
                                    </div>
                                )}
                                {/* Size */}
                                {enableSize && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-700">📏 Size Variants</p>
                                        <div className="flex flex-wrap gap-2">
                                            {SIZE_PRESETS.map(s => { const added = sizeVars.some(v => v.label === s); return <button key={s} type="button" onClick={() => !added && setSizeVars(p => [...p, { label: s, stock: '0', price: '' }])} disabled={added} className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${added ? 'bg-blue-100 text-blue-600 border-blue-200 opacity-50 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-700'}`}>{s}</button>; })}
                                            <button type="button" onClick={() => setSizeVars(p => [...p, { label: '', stock: '0', price: '' }])} className="px-3 py-1.5 rounded-lg text-sm font-bold border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Custom</button>
                                        </div>
                                        {sizeVars.length > 0 && <div className="space-y-2">{sizeVars.map((sv, i) => (<div key={i} className="grid grid-cols-[1fr_72px_88px_28px] gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100"><input value={sv.label} onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, label: e.target.value } : s))} placeholder="e.g. M" className={`font-semibold ${vInp}`} /><input type="number" value={sv.stock} onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, stock: e.target.value } : s))} className={`text-center ${vInp}`} min="0" /><input type="number" step="0.01" value={sv.price} onChange={e => setSizeVars(p => p.map((s, idx) => idx === i ? { ...s, price: e.target.value } : s))} placeholder="—" className={`text-center ${vInp}`} /><button type="button" onClick={() => setSizeVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button></div>))}</div>}
                                    </div>
                                )}
                                {/* Volume */}
                                {enableVolume && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-700">🧴 Volume Variants</p>
                                        <div className="flex flex-wrap gap-2">
                                            {VOLUME_PRESETS.map(v => { const added = volumeVars.some(vv => vv.label === v); return <button key={v} type="button" onClick={() => !added && setVolumeVars(p => [...p, { label: v, stock: '0', price: '' }])} disabled={added} className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${added ? 'bg-blue-100 text-blue-600 border-blue-200 opacity-50 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-700'}`}>{v}</button>; })}
                                            <button type="button" onClick={() => setVolumeVars(p => [...p, { label: '', stock: '0', price: '' }])} className="px-3 py-1.5 rounded-lg text-sm font-bold border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Custom</button>
                                        </div>
                                        {volumeVars.length > 0 && <div className="space-y-2">{volumeVars.map((vv, i) => (<div key={i} className="grid grid-cols-[1fr_72px_88px_28px] gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100"><input value={vv.label} onChange={e => setVolumeVars(p => p.map((v, idx) => idx === i ? { ...v, label: e.target.value } : v))} placeholder="e.g. 100ml" className={`font-semibold ${vInp}`} /><input type="number" value={vv.stock} onChange={e => setVolumeVars(p => p.map((v, idx) => idx === i ? { ...v, stock: e.target.value } : v))} className={`text-center ${vInp}`} min="0" /><input type="number" step="0.01" value={vv.price} onChange={e => setVolumeVars(p => p.map((v, idx) => idx === i ? { ...v, price: e.target.value } : v))} placeholder="—" className={`text-center ${vInp}`} /><button type="button" onClick={() => setVolumeVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button></div>))}</div>}
                                    </div>
                                )}
                                {/* Custom */}
                                {enableCustom && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-700">🏷️ Custom Variants</p>
                                        <div className="grid grid-cols-[1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400"><span>Option name</span><span className="text-center">Stock</span><span className="text-center">Price (opt)</span><span /></div>
                                        {customVars.map((cv, i) => (<div key={i} className="grid grid-cols-[1fr_72px_88px_28px] gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100"><input value={cv.label} onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, label: e.target.value } : c))} placeholder="e.g. Starter Kit" className={vInp} /><input type="number" value={cv.stock} onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))} className={`text-center ${vInp}`} min="0" /><input type="number" step="0.01" value={cv.price} onChange={e => setCustomVars(p => p.map((c, idx) => idx === i ? { ...c, price: e.target.value } : c))} placeholder="—" className={`text-center ${vInp}`} />{customVars.length > 1 ? <button type="button" onClick={() => setCustomVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button> : <span />}</div>))}
                                        <button type="button" onClick={() => setCustomVars(p => [...p, { label: '', stock: '0', price: '' }])} className="text-sm font-bold text-blue-600 flex items-center gap-1.5 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"><Plus className="w-4 h-4" /> Add Option</button>
                                    </div>
                                )}
                            </div>
                        )}
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
                        {/* Selling Unit */}
                        <div className="col-span-2 md:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Selling Unit <span className="text-gray-400 font-normal">· 판매 단위</span></label>
                            <div className="flex items-center gap-3">
                                <select name="unitLabel" value={form.unitLabel} onChange={handleChange} className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white w-28">
                                    {UNIT_LABELS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                {form.unitLabel !== '개' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 whitespace-nowrap">1 {form.unitLabel} =</span>
                                        <input type="number" name="unitsPerPkg" min="1" value={form.unitsPerPkg} onChange={handleChange} placeholder="e.g. 12" className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-24" />
                                        <span className="text-xs text-gray-400">개</span>
                                    </div>
                                )}
                            </div>
                        </div>
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
