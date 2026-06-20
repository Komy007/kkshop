'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Save, Loader2, Globe, Upload, X, ImagePlus, Package, Tag, Leaf,
    Droplets, Star, Sparkles, RefreshCw, DollarSign, AlertTriangle, ArrowLeft,
    Flame, CheckCircle, Plus, FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import DraggableImageGrid from '@/components/DraggableImageGrid';
import RichTextEditor from '@/components/RichTextEditor';
import ImportFromUrlsButton from '@/components/ImportFromUrlsButton';
import { useTranslations } from '@/i18n/useTranslations';

/**
 * Unified image item — either an existing DB row OR a new local-file upload.
 * - existing: has `existingId` + `url` (GCS URL used as both preview and final URL)
 * - new:      has `file` + `preview` (blob: URL); `url` is set after upload at submit time
 */
interface EditImageItem {
    existingId?: string;
    url?: string;
    file?: File;
    preview: string;
    alt?: string;
}

interface ImageItem { id?: string; url: string; isNew?: boolean; file?: File; preview?: string; }
const MAX_MAIN_IMAGES = 10;
const MAX_DETAIL_IMAGES = 50;
interface Category { id: string; slug: string; nameKo: string; isSystem?: boolean; }
interface Supplier { id: string; companyName: string; brandName?: string | null; }

interface ProductData {
    id: string; sku: string; priceUsd: string; costPrice: string | null;
    stockQty: number; stockAlertQty: number;
    categoryId: string | null; supplierId: string | null;
    status: string; approvalStatus: string; isNew: boolean;
    isHotSale: boolean; hotSalePrice: string | null;
    hotSaleStartAt: string | null; hotSaleEndAt: string | null;
    brandName: string | null; volume: string | null; skinType: string | null;
    origin: string | null; expiryMonths: number | null; certifications: string | null;
    images: { id: string; url: string; sortOrder: number }[];
    options: { id: string; minQty: number; maxQty: number | null; discountPct: string; freeShipping: boolean; labelKo: string | null; labelEn: string | null }[];
    translations: { langCode: string; name: string; shortDesc: string | null; detailDesc: string | null; ingredients: string | null; howToUse: string | null; benefits: string | null; seoKeywords: string | null }[];
}

const SIZE_PRESETS   = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const VOLUME_PRESETS = ['30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '300ml', '500ml', '1L'];
const UNIT_LABELS    = ['pc', 'box', 'pack', 'set', 'bottle', 'tube', 'sheet', 'piece', 'capsule'];
const vInp = "px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

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

    // 4-language direct edit state
    type LangFields = { name: string; shortDesc: string; detailDesc: string; ingredients: string; howToUse: string; benefits: string; seoKeywords: string };
    const EMPTY_LANG: LangFields = { name: '', shortDesc: '', detailDesc: '', ingredients: '', howToUse: '', benefits: '', seoKeywords: '' };
    const [langTranslations, setLangTranslations] = useState<Record<string, LangFields>>({ ko: { ...EMPTY_LANG }, en: { ...EMPTY_LANG }, km: { ...EMPTY_LANG }, zh: { ...EMPTY_LANG } });
    const [activeLangTab, setActiveLangTab] = useState<'ko' | 'en' | 'km' | 'zh'>('ko');
    const [isAutoTranslating, setIsAutoTranslating] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Unified image state (new model: full-replace sync) ──
    // Each list is the authoritative source — both existing DB rows and new uploads live in one array.
    const [mainImageList, setMainImageList] = useState<EditImageItem[]>([]);
    const [detailImageList, setDetailImageList] = useState<EditImageItem[]>([]);
    const [showAltEditor, setShowAltEditor] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [dragActiveDetail, setDragActiveDetail] = useState(false);
    const detailFileInputRef = useRef<HTMLInputElement>(null);

    const [bulkDiscountEnabled, setBulkDiscountEnabled] = useState(false);
    const [options, setOptions] = useState<any[]>([]);

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
        sku: '', priceUsd: '', costPrice: '', stockQty: '0', stockAlertQty: '10',
        categoryId: '', supplierId: '', status: 'ACTIVE', approvalStatus: 'APPROVED',
        rejectionReason: '',
        isNew: false, isHotSale: false, hotSalePrice: '',
        hotSaleStartAt: '', hotSaleEndAt: '',
        badgeAuthentic: false, badgeKoreanCertified: false,
        isTodayPick: false,
        displayPriority: 0,
        brandName: '', volume: '', skinType: '', origin: '',
        expiryMonths: '', certifications: '',
        unitLabel: '개', unitsPerPkg: '',
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
                    rejectionReason: p.rejectionReason ?? '',
                    isNew: p.isNew ?? false,
                    isHotSale: p.isHotSale ?? false,
                    hotSalePrice: p.hotSalePrice ?? '',
                    hotSaleStartAt: p.hotSaleStartAt ? new Date(p.hotSaleStartAt).toISOString().slice(0, 16) : '',
                    hotSaleEndAt: p.hotSaleEndAt ? new Date(p.hotSaleEndAt).toISOString().slice(0, 16) : '',
                    badgeAuthentic: p.badgeAuthentic ?? false,
                    badgeKoreanCertified: p.badgeKoreanCertified ?? false,
                    isTodayPick: p.isTodayPick ?? false,
                    displayPriority: p.displayPriority ?? 0,
                    brandName: p.brandName ?? '',
                    volume: p.volume ?? '',
                    skinType: p.skinType ?? '',
                    origin: p.origin ?? '',
                    expiryMonths: p.expiryMonths ? String(p.expiryMonths) : '',
                    certifications: p.certifications ?? '',
                    unitLabel: p.unitLabel ?? '개',
                    unitsPerPkg: p.unitsPerPkg ? String(p.unitsPerPkg) : '',
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
                // Initialize unified image lists from API response
                setMainImageList(
                    (p.images ?? []).map((img: any) => ({
                        existingId: img.id,
                        url: img.url,
                        preview: img.url,
                        alt: img.altText ?? '',
                    }))
                );
                setDetailImageList(
                    (p.detailImages ?? []).map((img: any) => ({
                        existingId: img.id,
                        url: img.url,
                        preview: img.url,
                        alt: img.altText ?? '',
                    }))
                );

                // Initialize 4-language direct edit state from API
                const langs = ['ko', 'en', 'km', 'zh'];
                const langMap: Record<string, LangFields> = {};
                langs.forEach(lang => {
                    const tr = p.translations?.find((t: any) => t.langCode === lang) ?? {};
                    langMap[lang] = {
                        name: tr.name ?? '',
                        shortDesc: tr.shortDesc ?? '',
                        detailDesc: tr.detailDesc ?? '',
                        ingredients: tr.ingredients ?? '',
                        howToUse: tr.howToUse ?? '',
                        benefits: tr.benefits ?? '',
                        seoKeywords: tr.seoKeywords ?? '',
                    };
                });
                setLangTranslations(langMap);
                const rawOpts = p.options?.map((o: any) => ({
                    id: o.id, minQty: String(o.minQty), maxQty: o.maxQty ? String(o.maxQty) : '',
                    discountPct: o.discountPct, freeShipping: o.freeShipping,
                    labelKo: o.labelKo ?? '', labelEn: o.labelEn ?? '',
                })) ?? [];
                setOptions(rawOpts);
                if (rawOpts.length > 0) setBulkDiscountEnabled(true);
                // Load variants — each type independently
                if (p.variants && p.variants.length > 0) {
                    const colorRows  = p.variants.filter((v: any) => ['COLOR','color'].includes(v.variantType));
                    const sizeRows   = p.variants.filter((v: any) => ['SIZE','size'].includes(v.variantType));
                    const volumeRows = p.variants.filter((v: any) => v.variantType === 'VOLUME');
                    const otherRows  = p.variants.filter((v: any) => ['OTHER','custom'].includes(v.variantType));
                    if (colorRows.length > 0) { setEnableColor(true); setColorVars(colorRows.map((v: any) => { const parts = (v.variantValue || '').split('|'); return { name: parts[0] || '', hex: parts[1] || '#FF6B6B', stock: String(v.stockQty ?? 0), price: v.priceUsd ?? '' }; })); }
                    if (sizeRows.length > 0)   { setEnableSize(true);  setSizeVars(sizeRows.map((v: any) => ({ label: v.variantValue || '', stock: String(v.stockQty ?? 0), price: v.priceUsd ?? '' }))); }
                    if (volumeRows.length > 0) { setEnableVolume(true); setVolumeVars(volumeRows.map((v: any) => ({ label: v.variantValue || '', stock: String(v.stockQty ?? 0), price: v.priceUsd ?? '' }))); }
                    if (otherRows.length > 0)  { setEnableCustom(true); setCustomVars(otherRows.map((v: any) => ({ label: v.variantValue || '', stock: String(v.stockQty ?? 0), price: v.priceUsd ?? '' }))); }
                }
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
        const value = target.type === 'checkbox'
            ? (target as HTMLInputElement).checked
            : target.type === 'number' && target.name === 'displayPriority'
                ? Math.max(0, Math.min(999, parseInt(target.value) || 0))
                : target.value;
        setForm(prev => ({ ...prev, [target.name]: value }));
    };

    const addMainFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        const toAdd = arr.slice(0, Math.max(0, MAX_MAIN_IMAGES - mainImageList.length));
        setMainImageList(prev => [
            ...prev,
            ...toAdd.map(file => ({ file, preview: URL.createObjectURL(file) })),
        ]);
    }, [mainImageList.length]);

    const addDetailFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        const toAdd = arr.slice(0, Math.max(0, MAX_DETAIL_IMAGES - detailImageList.length));
        setDetailImageList(prev => [
            ...prev,
            ...toAdd.map(file => ({ file, preview: URL.createObjectURL(file) })),
        ]);
    }, [detailImageList.length]);

    // Global paste handler — Ctrl+V로 이미지 파일 또는 URL 텍스트 직접 붙여넣기
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
            const items = e.clipboardData?.items;
            if (!items) return;

            // 우선순위 1: 이미지 바이너리 (우클릭 → 이미지 복사, 스크린샷 등)
            const imageFiles: File[] = [];
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) imageFiles.push(file);
                }
            }
            if (imageFiles.length > 0) {
                if (mainImageList.length < MAX_MAIN_IMAGES) addMainFiles(imageFiles);
                else addDetailFiles(imageFiles);
                return;
            }

            // 우선순위 2: URL 텍스트 (우클릭 → 이미지 주소 복사, URL 목록 붙여넣기)
            const textItem = Array.from(items).find(i => i.type === 'text/plain');
            if (!textItem) return;
            textItem.getAsString(async (text) => {
                const urls = text.split(/[\r\n,]+/).map(s => s.trim()).filter(s => /^https?:\/\//i.test(s));
                if (urls.length === 0) return;
                try {
                    const res = await fetch('/api/upload/from-urls', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ urls: urls.slice(0, 50), crop: 'square' }),
                    });
                    const data = await res.json();
                    const imported: string[] = (data.results ?? [])
                        .filter((r: { ok: boolean; gcsUrl?: string }) => r.ok && r.gcsUrl)
                        .map((r: { ok: boolean; gcsUrl?: string }) => r.gcsUrl as string);
                    if (imported.length > 0) {
                        setMainImageList(prev => [
                            ...prev,
                            ...imported.slice(0, Math.max(0, MAX_MAIN_IMAGES - prev.length)).map(url => ({ url, preview: url })),
                        ]);
                    }
                } catch {}
            });
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [addMainFiles, addDetailFiles, mainImageList.length]);

    const removeMainImage = (idx: number) => {
        setMainImageList(prev => {
            const item = prev[idx];
            if (item?.file) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== idx);
        });
    };
    const removeDetailImage = (idx: number) => {
        setDetailImageList(prev => {
            const item = prev[idx];
            if (item?.file) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== idx);
        });
    };
    const reorderMain = (from: number, to: number) => {
        setMainImageList(prev => {
            const arr = [...prev];
            // splice(from,1)[0] は有効インデックスが保証されるので ! アサーション使用
            const m = arr.splice(from, 1)[0]!;
            arr.splice(to, 0, m);
            return arr;
        });
    };
    const reorderDetail = (from: number, to: number) => {
        setDetailImageList(prev => {
            const arr = [...prev];
            const m = arr.splice(from, 1)[0]!;
            arr.splice(to, 0, m);
            return arr;
        });
    };
    const setMainAlt = (idx: number, alt: string) =>
        setMainImageList(prev => prev.map((it, i) => i === idx ? { ...it, alt } : it));
    const setDetailAlt = (idx: number, alt: string) =>
        setDetailImageList(prev => prev.map((it, i) => i === idx ? { ...it, alt } : it));

    // Upload any items that don't yet have a remote URL.
    // Returns the resolved [{id?, url, alt?}] payload format ready for the API.
    const resolveList = async (list: EditImageItem[], square = false): Promise<Array<{ id?: string; url: string; alt?: string }>> => {
        const out: Array<{ id?: string; url: string; alt?: string }> = [];
        const endpoint = square ? '/api/upload?crop=square' : '/api/upload';
        for (const it of list) {
            if (it.existingId && it.url) {
                // exactOptionalPropertyTypes: undefined 값은 키를 생략해야 함
                out.push({ id: it.existingId, url: it.url, ...(it.alt !== undefined && { alt: it.alt }) });
                continue;
            }
            if (it.file) {
                const fd = new FormData();
                fd.append('file', it.file);
                const res = await fetch(endpoint, { method: 'POST', body: fd });
                const data = await res.json();
                if (data.url) out.push({ url: data.url, ...(it.alt !== undefined && { alt: it.alt }) });
            } else if (it.url) {
                out.push({ url: it.url, ...(it.alt !== undefined && { alt: it.alt }) });
            }
        }
        return out;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setErrorMsg(''); setSuccessMsg('');
        try {
            // Resolve both image lists — upload new files, build {id?, url, alt?} arrays
            // Main: 1:1 square crop · Detail: aspect-preserving
            const mainImagesPayload   = await resolveList(mainImageList, true);
            const detailImagesPayload = await resolveList(detailImageList, false);
            // Build directTranslations for all 4 languages
            // If retranslate is true, we use KO as base and server will auto-translate
            // If false, we send all 4 language fields directly
            const directTranslations = retranslate
                ? undefined
                : Object.entries(langTranslations).map(([langCode, fields]) => ({ langCode, ...fields }));

            const res = await fetch(`/api/admin/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    // When retranslate=true: use KO fields from langTranslations as baseLang source
                    // langTranslations['ko'] — noUncheckedIndexedAccess で | undefined になるため ?? で保護
                    ...(() => {
                        const ko = langTranslations['ko'] ?? ({} as LangFields);
                        return {
                            name:        ko.name        || form.name,
                            shortDesc:   ko.shortDesc   || form.shortDesc,
                            detailDesc:  ko.detailDesc  || form.detailDesc,
                            ingredients: ko.ingredients || form.ingredients,
                            howToUse:    ko.howToUse    || form.howToUse,
                            benefits:    ko.benefits    || form.benefits,
                            seoKeywords: ko.seoKeywords || form.seoKeywords,
                        };
                    })(),
                    baseLang: 'ko',
                    isNew: form.isNew,
                    isHotSale: form.isHotSale,
                    hotSalePrice: form.hotSalePrice || null,
                    hotSaleStartAt: (form as any).hotSaleStartAt || null,
                    hotSaleEndAt: (form as any).hotSaleEndAt || null,
                    costPrice: form.costPrice || null,
                    categoryId: form.categoryId || null,
                    supplierId: form.supplierId || null,
                    expiryMonths: form.expiryMonths ? parseInt(form.expiryMonths) : null,
                    retranslate,
                    directTranslations,
                    mainImages: mainImagesPayload,
                    detailImages: detailImagesPayload,
                    unitLabel: form.unitLabel,
                    unitsPerPkg: (form as any).unitsPerPkg ? parseInt((form as any).unitsPerPkg) : null,
                    options: bulkDiscountEnabled ? options.map((o, i) => ({ ...o, sortOrder: i })) : [],
                    variants: (() => {
                        const v: any[] = [];
                        if (enableColor)  colorVars.filter(c => c.name.trim()).forEach((c, i) => v.push({ variantType: 'COLOR', variantValue: `${c.name.trim()}|${c.hex}`, stockQty: parseInt(c.stock) || 0, priceUsd: c.price || null, sortOrder: i }));
                        if (enableSize)   sizeVars.filter(s => s.label.trim()).forEach((s, i) => v.push({ variantType: 'SIZE', variantValue: s.label.trim(), stockQty: parseInt(s.stock) || 0, priceUsd: s.price || null, sortOrder: i }));
                        if (enableVolume) volumeVars.filter(vv => vv.label.trim()).forEach((vv, i) => v.push({ variantType: 'VOLUME', variantValue: vv.label.trim(), stockQty: parseInt(vv.stock) || 0, priceUsd: vv.price || null, sortOrder: i }));
                        if (enableCustom) customVars.filter(c => c.label.trim()).forEach((c, i) => v.push({ variantType: 'OTHER', variantValue: c.label.trim(), stockQty: parseInt(c.stock) || 0, priceUsd: c.price || null, sortOrder: i }));
                        return v;
                    })(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fail');
            setSuccessMsg(retranslate ? 'Auto-translated & Saved · 자동번역 완료' : 'Saved successfully · 저장 완료');
            // Refresh images + translations from server
            const fresh = await fetch(`/api/admin/products/${productId}`).then(r => r.json());
            setMainImageList(
                (fresh.images ?? []).map((img: any) => ({
                    existingId: img.id, url: img.url, preview: img.url, alt: img.altText ?? '',
                }))
            );
            setDetailImageList(
                (fresh.detailImages ?? []).map((img: any) => ({
                    existingId: img.id, url: img.url, preview: img.url, alt: img.altText ?? '',
                }))
            );
            setAllTranslations(fresh.translations ?? []);
            // Update lang translations state from fresh data
            const freshLangs: Record<string, LangFields> = {};
            ['ko', 'en', 'km', 'zh'].forEach(lang => {
                const tr = fresh.translations?.find((t: any) => t.langCode === lang) ?? {};
                freshLangs[lang] = {
                    name: tr.name ?? '', shortDesc: tr.shortDesc ?? '',
                    detailDesc: tr.detailDesc ?? '', ingredients: tr.ingredients ?? '',
                    howToUse: tr.howToUse ?? '', benefits: tr.benefits ?? '',
                    seoKeywords: tr.seoKeywords ?? '',
                };
            });
            setLangTranslations(freshLangs);
            
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
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
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

                {/* ① Main Gallery — top of product page (thumbnails + swipe) */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <ImagePlus className="w-5 h-5 text-blue-500" />
                                Main Gallery <span className="text-xs text-gray-400 font-normal">메인 썸네일</span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">상품 상세 페이지 상단 + 목록 썸네일 · <span className="text-blue-600 font-semibold">1:1 자동 크롭</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ImportFromUrlsButton
                                target="main"
                                remaining={MAX_MAIN_IMAGES - mainImageList.length}
                                accent="blue"
                                onImported={(urls) => {
                                    setMainImageList(prev => [
                                        ...prev,
                                        ...urls.slice(0, MAX_MAIN_IMAGES - prev.length).map(url => ({ url, preview: url })),
                                    ]);
                                }}
                            />
                            <span className={`text-xs font-bold tabular-nums ${mainImageList.length >= MAX_MAIN_IMAGES ? 'text-red-500' : 'text-gray-500'}`}>
                                {mainImageList.length} / {MAX_MAIN_IMAGES}
                            </span>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        {mainImageList.length > 0 && (
                            <DraggableImageGrid
                                images={mainImageList.map((img, i) => ({
                                    id: img.existingId ?? img.preview,
                                    src: img.preview,
                                    borderColor: img.file ? 'border-blue-200' : 'border-gray-200',
                                    // exactOptionalPropertyTypes: undefined 불가 → 조건부 spread
                                    ...(img.file && { badge: 'NEW', badgeColor: 'bg-blue-500' }),
                                }))}
                                onReorder={reorderMain}
                                onRemove={removeMainImage}
                                coverLabel={t.common.confirm === '확인' ? '대표' : 'Main'}
                                layout="grid4"
                            />
                        )}
                        {mainImageList.length < MAX_MAIN_IMAGES && (
                            <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                                onDragEnter={() => setDragActive(true)}
                                onDragLeave={() => setDragActive(false)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => { e.preventDefault(); setDragActive(false); addMainFiles(e.dataTransfer.files); }}
                                onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                                <p className="text-sm text-gray-500">클릭 · 드래그 · Ctrl+V 붙여넣기</p>
                                <p className="text-xs text-gray-400 mt-0.5">자동 WebP 변환 · 최대 1600px</p>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                                    onChange={e => e.target.files && addMainFiles(e.target.files)} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ①-B Detail Page Images — long-form story in Description tab */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-500" />
                                Detail Page Images <span className="text-xs text-gray-400 font-normal">상세 페이지 이미지</span>
                            </h3>
                            <p className="text-xs text-purple-700 mt-0.5">Description 탭에 세로로 연속 표시 (Coupang/Tmall 스타일) · 원본 비율 유지</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                            <ImportFromUrlsButton
                                target="detail"
                                remaining={MAX_DETAIL_IMAGES - detailImageList.length}
                                accent="purple"
                                onImported={(urls) => {
                                    setDetailImageList(prev => [
                                        ...prev,
                                        ...urls.slice(0, MAX_DETAIL_IMAGES - prev.length).map(url => ({ url, preview: url })),
                                    ]);
                                }}
                            />
                            <span className={`text-xs font-bold tabular-nums whitespace-nowrap ${detailImageList.length >= MAX_DETAIL_IMAGES ? 'text-red-500' : 'text-purple-600'}`}>
                                {detailImageList.length} / {MAX_DETAIL_IMAGES}
                            </span>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        {detailImageList.length > 0 && (
                            <DraggableImageGrid
                                images={detailImageList.map((img) => ({
                                    id: img.existingId ?? img.preview,
                                    src: img.preview,
                                    borderColor: img.file ? 'border-purple-200' : 'border-gray-200',
                                    ...(img.file && { badge: 'NEW', badgeColor: 'bg-purple-500' }),
                                }))}
                                onReorder={reorderDetail}
                                onRemove={removeDetailImage}
                                layout="grid4"
                            />
                        )}
                        {detailImageList.length < MAX_DETAIL_IMAGES && (
                            <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragActiveDetail ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400'}`}
                                onDragEnter={() => setDragActiveDetail(true)}
                                onDragLeave={() => setDragActiveDetail(false)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => { e.preventDefault(); setDragActiveDetail(false); addDetailFiles(e.dataTransfer.files); }}
                                onClick={() => detailFileInputRef.current?.click()}>
                                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                                <p className="text-sm text-gray-500">최대 50장 · K-뷰티 스토리텔링</p>
                                <input ref={detailFileInputRef} type="file" accept="image/*" multiple className="hidden"
                                    onChange={e => e.target.files && addDetailFiles(e.target.files)} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ①-C Alt Text editor — optional SEO/accessibility */}
                {(mainImageList.length > 0 || detailImageList.length > 0) && (
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                        <button type="button" onClick={() => setShowAltEditor(p => !p)}
                            className="w-full px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors">
                            <div className="text-left">
                                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-500" />
                                    Alt Text (Optional · SEO/접근성)
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">비워두면 상품명 기반으로 자동 생성됩니다.</p>
                            </div>
                            {showAltEditor ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {showAltEditor && (
                            <div className="p-5 space-y-4">
                                {mainImageList.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-600 mb-2">Main Gallery</p>
                                        <div className="space-y-2">
                                            {mainImageList.map((img, i) => (
                                                <div key={img.existingId ?? img.preview} className="flex items-center gap-3">
                                                    <img src={img.preview} className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                                    <input type="text" value={img.alt || ''} onChange={e => setMainAlt(i, e.target.value)}
                                                        placeholder={`${langTranslations['ko']?.name || form.name || 'Product'} - ${i + 1}`} maxLength={255}
                                                        className="flex-1 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {detailImageList.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-purple-600 mb-2">Detail Images</p>
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                            {detailImageList.map((img, i) => (
                                                <div key={img.existingId ?? img.preview} className="flex items-center gap-3">
                                                    <img src={img.preview} className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                                    <input type="text" value={img.alt || ''} onChange={e => setDetailAlt(i, e.target.value)}
                                                        placeholder={`${langTranslations['ko']?.name || form.name || 'Product'} detail ${i + 1}`} maxLength={255}
                                                        className="flex-1 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

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
                                <option value="APPROVED">✅ Approved · 승인됨</option>
                                <option value="PENDING">🟡 Pending Review · 검수 대기</option>
                                <option value="REJECTED">❌ Rejected · 반려</option>
                            </select>
                        </div>
                        {/* 반려 사유 */}
                        {form.approvalStatus === 'REJECTED' && (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-red-600 mb-1">
                                    Rejection Reason · 반려 사유
                                    <span className="ml-1 font-normal text-gray-400">(shown to seller · 셀러에게 표시됨)</span>
                                </label>
                                <textarea name="rejectionReason" value={form.rejectionReason} onChange={handleChange} rows={2}
                                    placeholder="e.g. Missing product images, incorrect price · 예: 상품 이미지 누락, 가격 오류"
                                    className="w-full border border-red-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none bg-red-50/30 resize-none" />
                            </div>
                        )}
                        {/* isNew / isHotSale — buttons (not label+checkbox) prevent sr-only focus from triggering scrollIntoView */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={form.isNew}
                                onClick={() => setForm(prev => ({ ...prev, isNew: !prev.isNew }))}
                                className="flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all select-none text-left hover:border-yellow-300 hover:bg-yellow-50"
                                style={{ borderColor: form.isNew ? '#F59E0B' : '#E5E7EB', background: form.isNew ? '#FFFBEB' : '' }}
                            >
                                <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${form.isNew ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isNew ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <Sparkles className={`w-3.5 h-3.5 ${form.isNew ? 'text-yellow-500' : 'text-gray-400'}`} /> NEW
                                </span>
                            </button>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={form.isHotSale}
                                onClick={() => setForm(prev => ({ ...prev, isHotSale: !prev.isHotSale }))}
                                className="flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all select-none text-left hover:border-red-300 hover:bg-red-50"
                                style={{ borderColor: form.isHotSale ? '#EF4444' : '#E5E7EB', background: form.isHotSale ? '#FEF2F2' : '' }}
                            >
                                <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${form.isHotSale ? 'bg-red-500' : 'bg-gray-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isHotSale ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <Flame className={`w-3.5 h-3.5 ${form.isHotSale ? 'text-red-500' : 'text-gray-400'}`} /> HOT
                                </span>
                            </button>
                        </div>
                        {form.isHotSale && (
                            <>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.edit.fields.hotPrice}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                    <input type="number" step="0.01" name="hotSalePrice" value={form.hotSalePrice} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg py-2 pl-6 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Schedule (Optional)</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Start</label>
                                        <input
                                            type="datetime-local"
                                            name="hotSaleStartAt"
                                            value={(form as any).hotSaleStartAt}
                                            onChange={handleChange}
                                            className={`${vInp} w-full`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">End</label>
                                        <input
                                            type="datetime-local"
                                            name="hotSaleEndAt"
                                            value={(form as any).hotSaleEndAt}
                                            onChange={handleChange}
                                            className={`${vInp} w-full`}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Leave empty for immediate activation. Set dates to auto-schedule.</p>
                            </div>
                            </>
                        )}
                    {/* Trust Badges */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                            Trust Badges · 신뢰 뱃지 <span className="text-gray-400 font-normal">(상품 페이지에 표시)</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border-2 transition-all select-none ${form.badgeAuthentic ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}`}>
                                <input type="checkbox" name="badgeAuthentic" checked={form.badgeAuthentic} onChange={handleChange} className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-gray-300" />
                                <span className="text-sm font-semibold text-gray-700">🛡 100% Authentic Korean Cosmetics</span>
                                <span className="text-[10px] text-gray-400">화장품 전용</span>
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border-2 transition-all select-none ${form.badgeKoreanCertified ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-200'}`}>
                                <input type="checkbox" name="badgeKoreanCertified" checked={form.badgeKoreanCertified} onChange={handleChange} className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 border-gray-300" />
                                <span className="text-sm font-semibold text-gray-700">🏅 Korean Certified</span>
                                <span className="text-[10px] text-gray-400">일반 한국 상품 가능</span>
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border-2 transition-all select-none ${form.isTodayPick ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-200'}`}>
                                <input type="checkbox" name="isTodayPick" checked={form.isTodayPick} onChange={handleChange} className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-400 border-gray-300" />
                                <span className="text-sm font-semibold text-gray-700">⭐ Today&apos;s Pick</span>
                                <span className="text-[10px] text-gray-400">홈 Today&apos;s Picks 섹션 고정</span>
                            </label>
                        </div>
                    </div>

                    {/* Display Priority */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            🔝 노출 우선순위 <span className="text-gray-400 font-normal">(높을수록 홈/섹션 맨 앞 노출)</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number" name="displayPriority" min="0" max="999"
                                value={form.displayPriority} onChange={handleChange}
                                className="w-28 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <span className="text-xs text-gray-400">0 = 일반 · 10 이상 = 상위 노출 · 최대 999</span>
                        </div>
                        <div className="mt-1 flex gap-2">
                            {[0, 10, 50, 100].map(v => (
                                <button key={v} type="button"
                                    onClick={() => setForm(f => ({ ...f, displayPriority: v }))}
                                    className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${form.displayPriority === v ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-500 hover:border-blue-300'}`}>
                                    {v === 0 ? '일반(0)' : v === 10 ? '약(10)' : v === 50 ? '중(50)' : '강(100)'}
                                </button>
                            ))}
                        </div>
                    </div>
                    </div>
                </div>

                {/* ③ 수량별 할인 옵션 */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <Sec icon={<Star className="w-5 h-5 text-yellow-500" />} title={t.admin.edit.sections.options} desc="" />
                    <div className="p-5 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <button type="button" role="switch" aria-checked={bulkDiscountEnabled} onClick={() => setBulkDiscountEnabled(p => !p)}
                                className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${bulkDiscountEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${bulkDiscountEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-sm font-semibold text-gray-800">수량 할인 사용 <span className="text-xs text-gray-400 font-normal">· Bulk discount</span></span>
                        </label>
                        {bulkDiscountEnabled && options.map((opt, i) => (
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
                                    {i === options.length - 1 && (
                                        <p className="text-[10px] text-amber-600 mt-1">최고 티어는 비워두면 수량 무제한 적용</p>
                                    )}
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
                        {bulkDiscountEnabled && (
                            <button type="button" onClick={() => setOptions([...options, { minQty: '10', maxQty: '', discountPct: '10', freeShipping: false, labelKo: '' }])}
                                className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700">
                                {t.admin.edit.buttons.addOption}
                            </button>
                        )}
                    </div>
                </div>

                {/* ③-B Product Variants */}
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
                                {enableColor && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-700">🎨 Color Variants</p>
                                        <div className="grid grid-cols-[40px_1fr_72px_88px_28px] gap-2 px-1 text-xs font-semibold text-gray-400"><span /><span>Color name</span><span className="text-center">Stock</span><span className="text-center">Price (opt)</span><span /></div>
                                        {colorVars.map((cv, i) => (<div key={i} className="grid grid-cols-[40px_1fr_72px_88px_28px] gap-2 items-center bg-gray-50 rounded-xl p-2.5 border border-gray-100"><input type="color" value={cv.hex} onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, hex: e.target.value } : c))} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" /><input value={cv.name} onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))} placeholder="e.g. Rose Pink" className={vInp} /><input type="number" value={cv.stock} onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, stock: e.target.value } : c))} className={`text-center ${vInp}`} min="0" /><input type="number" step="0.01" value={cv.price} onChange={e => setColorVars(p => p.map((c, idx) => idx === i ? { ...c, price: e.target.value } : c))} placeholder="—" className={`text-center ${vInp}`} />{colorVars.length > 1 ? <button type="button" onClick={() => setColorVars(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></button> : <span />}</div>))}
                                        {colorVars.length < 10 && <button type="button" onClick={() => setColorVars(p => [...p, { name: '', hex: '#4A90E2', stock: '0', price: '' }])} className="text-sm font-bold text-blue-600 flex items-center gap-1.5 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"><Plus className="w-4 h-4" /> Add Color</button>}
                                    </div>
                                )}
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
                        {/* Selling Unit */}
                        <div className="col-span-2 md:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Selling Unit <span className="text-gray-400 font-normal">· 판매 단위</span></label>
                            <div className="flex items-center gap-3">
                                <select name="unitLabel" value={(form as any).unitLabel ?? 'pc'} onChange={handleChange} className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white w-28">
                                    {UNIT_LABELS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                {(form as any).unitLabel && (form as any).unitLabel !== 'pc' && (form as any).unitLabel !== '개' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 whitespace-nowrap">1 {(form as any).unitLabel} =</span>
                                        <input type="number" name="unitsPerPkg" min="1" value={(form as any).unitsPerPkg ?? ''} onChange={handleChange} placeholder="e.g. 12" className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-24" />
                                        <span className="text-xs text-gray-400">pc</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ⑤ 4-Language Content Editor */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                4-Language Content Editor
                                <span className="text-xs font-normal text-blue-500">· 4개국어 직접 편집</span>
                            </h3>
                            <p className="text-xs text-blue-600 mt-0.5">Edit each language tab directly, or use Auto-Translate to generate from Korean · 각 언어를 직접 수정하거나 자동번역 사용</p>
                        </div>
                        {/* Auto-translate button */}
                        <button
                            type="button"
                            disabled={isAutoTranslating}
                            onClick={async () => {
                                setIsAutoTranslating(true);
                                setRetranslate(true);
                                // Trigger submit with retranslate=true will be handled on form submit
                                // Instead, we preview by setting retranslate flag
                                setIsAutoTranslating(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${retranslate ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300 hover:border-blue-500'}`}
                            title="On Save: auto-translate Korean fields to EN/KM/ZH"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isAutoTranslating ? 'animate-spin' : ''}`} />
                            {retranslate ? '✓ Auto-Translate ON' : 'Auto-Translate from KO'}
                            <span className="opacity-70 font-normal">· 자동번역</span>
                        </button>
                    </div>

                    {/* Language tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50">
                        {([
                            { code: 'ko', flag: '🇰🇷', label: 'Korean', sub: '한국어' },
                            { code: 'en', flag: '🇺🇸', label: 'English', sub: 'EN' },
                            { code: 'km', flag: '🇰🇭', label: 'Khmer', sub: 'ភាសាខ្មែរ' },
                            { code: 'zh', flag: '🇨🇳', label: 'Chinese', sub: '中文' },
                        ] as { code: 'ko' | 'en' | 'km' | 'zh'; flag: string; label: string; sub: string }[]).map(({ code, flag, label, sub }) => {
                            const hasTrans = allTranslations.some(tr => tr.langCode === code && tr.name);
                            const isActive = activeLangTab === code;
                            return (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setActiveLangTab(code)}
                                    className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-bold border-b-2 transition-all ${isActive ? 'border-blue-500 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'}`}
                                >
                                    <span className="text-base mb-0.5">{flag}</span>
                                    <span>{label}</span>
                                    <span className="font-normal opacity-60">{sub}</span>
                                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${hasTrans ? 'bg-green-400' : 'bg-gray-300'}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content */}
                    <div className="p-5 space-y-4">
                        {retranslate && activeLangTab !== 'ko' && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                                <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                                Auto-Translate is ON — this language will be auto-generated from Korean on save · 저장 시 한국어 기준으로 자동번역됩니다
                            </div>
                        )}

                        {(['name', 'shortDesc', 'detailDesc', 'ingredients', 'howToUse', 'benefits', 'seoKeywords'] as const).map(field => {
                            const labels: Record<string, { en: string; ko: string; rows?: number }> = {
                                name:        { en: 'Product Name', ko: '상품명', rows: 1 },
                                shortDesc:   { en: 'Short Description', ko: '짧은 설명', rows: 2 },
                                detailDesc:  { en: 'Detailed Description', ko: '상세 설명', rows: 5 },
                                ingredients: { en: 'Key Ingredients', ko: '성분 정보', rows: 3 },
                                howToUse:    { en: 'How to Use', ko: '사용 방법', rows: 2 },
                                benefits:    { en: 'Benefits / Features', ko: '효능/특징', rows: 2 },
                                seoKeywords: { en: 'SEO Keywords', ko: 'SEO 키워드', rows: 1 },
                            };
                            // field は as const 配列由来で labels の全キーに一致するため ! アサーション
                            const lbl = labels[field]!;
                            const rows = lbl.rows ?? 2;
                            const val = langTranslations[activeLangTab]?.[field] ?? '';
                            const onChange = (v: string) => setLangTranslations(prev => ({
                                ...prev,
                                [activeLangTab]: { ...(prev[activeLangTab] ?? {}), [field]: v } as LangFields,
                            }));
                            return (
                                <div key={field}>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        {lbl.en}
                                        <span className="text-[10px] text-gray-400 font-normal ml-1.5">{lbl.ko}</span>
                                        {field === 'name' && <span className="text-red-500 ml-0.5">*</span>}
                                    </label>
                                    {rows === 1 ? (
                                        <input
                                            value={val}
                                            onChange={e => onChange(e.target.value)}
                                            disabled={retranslate && activeLangTab !== 'ko'}
                                            className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                        />
                                    ) : field === 'detailDesc' ? (
                                        // Rich-text editor for detail description (supports tables, lists, formatting, embedded images)
                                        retranslate && activeLangTab !== 'ko' ? (
                                            <div className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400 min-h-[180px]">
                                                Auto-translated from Korean on save · 저장 시 한국어에서 자동번역
                                            </div>
                                        ) : (
                                            <RichTextEditor
                                                value={val}
                                                onChange={onChange}
                                                placeholder="상세 설명 · brand story, key features, comparisons, ingredients tables…"
                                                minHeight={200}
                                            />
                                        )
                                    ) : (
                                        <textarea
                                            rows={rows}
                                            value={val}
                                            onChange={e => onChange(e.target.value)}
                                            disabled={retranslate && activeLangTab !== 'ko'}
                                            className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none disabled:bg-gray-50 disabled:text-gray-400"
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {/* Auto-translate toggle */}
                        <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${retranslate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                            <input type="checkbox" checked={retranslate} onChange={e => setRetranslate(e.target.checked)}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                            <div>
                                <div className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                                    <RefreshCw className={`w-4 h-4 ${retranslate ? 'text-blue-600' : 'text-gray-400'}`} />
                                    Auto-Translate All Languages from Korean
                                    <span className="text-[10px] font-normal text-gray-500">· 한국어 기준 4개국어 자동번역</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">On save, EN / KM / ZH will be auto-generated via Google Translate · 저장 시 구글 번역으로 자동 생성됩니다</div>
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

        </div>
    );
}
