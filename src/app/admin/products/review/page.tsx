'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Clock, CheckCircle, XCircle, Loader2, RefreshCw, ImageIcon, Search,
    ShieldCheck, Award, ChevronDown, ChevronUp, Package, Tag, FileText,
    Globe, DollarSign, Box, ArrowLeft, Eye, Pencil,
} from 'lucide-react';

/* ───────── Types ───────── */
interface PendingProduct {
    id: string;
    sku: string;
    priceUsd: string;
    approvalStatus: string;
    imageUrl?: string;
    brandName?: string;
    createdAt: string;
    supplier?: { companyName: string };
    translations: { langCode: string; name: string }[];
    badgeAuthentic?: boolean;
    badgeKoreanCertified?: boolean;
}

interface ProductDetail {
    id: string;
    sku: string;
    priceUsd: string;
    stockQty: number;
    brandName: string;
    origin: string;
    isNew: boolean;
    isHotSale: boolean;
    hotSalePrice: string | null;
    costPrice: string | null;
    expiryMonths: number | null;
    unitLabel: string | null;
    unitsPerPkg: number | null;
    approvalStatus: string;
    rejectionReason: string | null;
    createdAt: string;
    images: { id: string; url: string; sortOrder: number }[];
    translations: { langCode: string; name: string; shortDesc: string; detailDesc: string; ingredients: string; howToUse: string; benefits: string }[];
    options: { id: string; minQty: number; maxQty: number | null; discountPercent: number; labelKo: string; freeShipping: boolean }[];
    variants: { id: string; variantType: string; variantValue: string; stockQty: number; priceUsd: string | null }[];
    category: { id: string; slug: string; nameKo: string; nameEn?: string } | null;
    supplier: { id: string; companyName: string; brandName?: string } | null;
}

const LANG_LABELS: Record<string, string> = { ko: '한국어', en: 'English', km: 'ខ្មែរ', zh: '中文' };

/* ───────── Badge Selection Panel ───────── */
function ApproveBadgePanel({
    onConfirm, onCancel, isProcessing,
}: {
    onConfirm: (badgeAuthentic: boolean, badgeKoreanCertified: boolean) => void;
    onCancel: () => void;
    isProcessing: boolean;
}) {
    const [badgeAuthentic, setBadgeAuthentic] = useState(false);
    const [badgeKoreanCertified, setBadgeKoreanCertified] = useState(false);

    return (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
            <p className="text-sm font-bold text-green-800">
                ✅ Approve — Select Trust Badges · 신뢰 뱃지 선택
            </p>
            <p className="text-xs text-green-700 opacity-80">
                Select badges to display on the product page.
                <span className="block opacity-70">상품 페이지에 표시할 뱃지를 선택하세요.</span>
            </p>
            <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-green-200 hover:border-pink-300 transition-colors">
                    <input type="checkbox" checked={badgeAuthentic} onChange={e => setBadgeAuthentic(e.target.checked)}
                        className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-gray-300" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-red-400 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-800">100% Authentic Korean Cosmetics</div>
                            <div className="text-[11px] text-gray-400">100% 한국 정품 화장품</div>
                        </div>
                    </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-green-200 hover:border-teal-300 transition-colors">
                    <input type="checkbox" checked={badgeKoreanCertified} onChange={e => setBadgeKoreanCertified(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 border-gray-300" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Award className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-800">Korean Certified</div>
                            <div className="text-[11px] text-gray-400">한국 인증 — 일반 한국 상품에도 적용 가능</div>
                        </div>
                    </div>
                </label>
            </div>
            <div className="flex gap-2 pt-1">
                <button onClick={() => onConfirm(badgeAuthentic, badgeKoreanCertified)} disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Confirm Approval · 승인 확정
                </button>
                <button onClick={onCancel} disabled={isProcessing}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    Cancel · 취소
                </button>
            </div>
        </div>
    );
}

/* ───────── Product Detail Panel ───────── */
function ProductDetailPanel({ productId, onClose, showEdit }: { productId: string; onClose: () => void; showEdit?: boolean }) {
    const [detail, setDetail] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'images' | 'translations' | 'options'>('info');
    const [selectedLang, setSelectedLang] = useState('ko');

    useEffect(() => {
        setLoading(true);
        fetch(`/api/admin/products/${productId}`)
            .then(r => r.json())
            .then(data => setDetail(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) {
        return (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">Loading product details...</span>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                Failed to load product details · 상품 정보를 불러올 수 없습니다
            </div>
        );
    }

    const tr = detail.translations.find(t => t.langCode === selectedLang) || detail.translations[0];

    return (
        <div className="mt-4 bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-blue-50 px-5 py-3 flex items-center justify-between border-b border-blue-200">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Product Details · 상품 상세 정보
                </h3>
                <div className="flex items-center gap-3">
                    {showEdit !== false && (
                        <Link href={`/admin/products/${productId}/edit`}
                            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-800 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                            <Pencil className="w-3 h-3" /> Edit · 편집
                        </Link>
                    )}
                    <button onClick={onClose} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Close · 닫기 ✕
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
                {([
                    { key: 'info', label: '📋 Basic Info', labelKo: '기본정보' },
                    { key: 'images', label: '🖼 Images', labelKo: '이미지' },
                    { key: 'translations', label: '🌐 Translations', labelKo: '번역' },
                    { key: 'options', label: '📦 Options', labelKo: '옵션' },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === tab.key
                            ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700'}`}>
                        {tab.label} <span className="hidden sm:inline text-[10px] opacity-60">· {tab.labelKo}</span>
                    </button>
                ))}
            </div>

            <div className="p-5">
                {/* ── Basic Info Tab ── */}
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoItem label="SKU" value={detail.sku} />
                            <InfoItem label="Price · 가격" value={`$${Number(detail.priceUsd).toFixed(2)}`} />
                            <InfoItem label="Stock · 재고" value={`${detail.stockQty}`} />
                            <InfoItem label="Brand · 브랜드" value={detail.brandName || '-'} />
                            <InfoItem label="Origin · 원산지" value={detail.origin || '-'} />
                            <InfoItem label="Category · 카테고리" value={detail.category?.nameKo || '-'} />
                            <InfoItem label="Seller · 셀러" value={detail.supplier?.companyName || '-'} />
                            {detail.costPrice && <InfoItem label="Cost · 원가" value={`$${Number(detail.costPrice).toFixed(2)}`} />}
                            {detail.hotSalePrice && <InfoItem label="Sale Price · 할인가" value={`$${Number(detail.hotSalePrice).toFixed(2)}`} highlight />}
                            {detail.expiryMonths && <InfoItem label="Expiry · 유효기간" value={`${detail.expiryMonths} months`} />}
                            {detail.unitLabel && detail.unitLabel !== '개' && (
                                <InfoItem
                                    label="Selling Unit · 판매단위"
                                    value={detail.unitsPerPkg ? `1 ${detail.unitLabel} = ${detail.unitsPerPkg} 개` : detail.unitLabel}
                                />
                            )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {detail.isNew && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">NEW</span>}
                            {detail.isHotSale && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">HOT SALE</span>}
                        </div>
                        {/* Product name & description preview */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-bold text-gray-900">{tr?.name || '-'}</p>
                            {tr?.shortDesc && <p className="text-xs text-gray-600 leading-relaxed">{tr.shortDesc}</p>}
                        </div>
                    </div>
                )}

                {/* ── Images Tab ── */}
                {activeTab === 'images' && (
                    <div>
                        {detail.images.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">No images · 이미지 없음</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {detail.images.map((img, i) => (
                                    <div key={img.id} className="relative aspect-square">
                                        <img src={img.url} alt={`Image ${i + 1}`}
                                            className="w-full h-full object-cover rounded-xl border border-gray-200"
                                            onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Error'; }} />
                                        {i === 0 && (
                                            <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">Main</span>
                                        )}
                                        <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Translations Tab ── */}
                {activeTab === 'translations' && (
                    <div className="space-y-3">
                        {/* Language selector */}
                        <div className="flex gap-2 flex-wrap">
                            {detail.translations.map(t => (
                                <button key={t.langCode} onClick={() => setSelectedLang(t.langCode)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${selectedLang === t.langCode
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                                    {LANG_LABELS[t.langCode] || t.langCode}
                                </button>
                            ))}
                        </div>
                        {tr && (
                            <div className="space-y-3">
                                <TranslationField label="Name · 상품명" value={tr.name} />
                                <TranslationField label="Short Description · 짧은 설명" value={tr.shortDesc} />
                                <TranslationField label="Detail Description · 상세 설명" value={tr.detailDesc} long />
                                <TranslationField label="Ingredients · 성분" value={tr.ingredients} long />
                                <TranslationField label="How to Use · 사용법" value={tr.howToUse} long />
                                <TranslationField label="Benefits · 효능" value={tr.benefits} long />
                            </div>
                        )}
                    </div>
                )}

                {/* ── Options Tab ── */}
                {activeTab === 'options' && (
                    <div className="space-y-4">
                        {/* Bulk options */}
                        {detail.options.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-gray-700 mb-2">Quantity Options · 수량 옵션</p>
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Label</th>
                                                <th className="px-3 py-2 text-center">Min Qty</th>
                                                <th className="px-3 py-2 text-center">Max Qty</th>
                                                <th className="px-3 py-2 text-center">Discount</th>
                                                <th className="px-3 py-2 text-center">Free Ship</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {detail.options.map(opt => (
                                                <tr key={opt.id}>
                                                    <td className="px-3 py-2 font-medium text-gray-800">{opt.labelKo || '-'}</td>
                                                    <td className="px-3 py-2 text-center">{opt.minQty}</td>
                                                    <td className="px-3 py-2 text-center">{opt.maxQty ?? '∞'}</td>
                                                    <td className="px-3 py-2 text-center text-blue-600 font-semibold">{opt.discountPercent}%</td>
                                                    <td className="px-3 py-2 text-center">{opt.freeShipping ? '✅' : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {/* Variants */}
                        {detail.variants.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-gray-700 mb-2">Variants · 옵션 변형</p>
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Type</th>
                                                <th className="px-3 py-2 text-left">Value</th>
                                                <th className="px-3 py-2 text-center">Stock</th>
                                                <th className="px-3 py-2 text-center">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {detail.variants.map(v => (
                                                <tr key={v.id}>
                                                    <td className="px-3 py-2 font-medium text-gray-600">{v.variantType}</td>
                                                    <td className="px-3 py-2 text-gray-800">{v.variantValue}</td>
                                                    <td className="px-3 py-2 text-center">{v.stockQty}</td>
                                                    <td className="px-3 py-2 text-center">{v.priceUsd ? `$${Number(v.priceUsd).toFixed(2)}` : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {detail.options.length === 0 && detail.variants.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-8">No options or variants · 옵션/변형 없음</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-[10px] text-gray-400 font-medium mb-0.5">{label}</p>
            <p className={`text-sm font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
}

function TranslationField({ label, value, long }: { label: string; value: string; long?: boolean }) {
    if (!value) return null;
    return (
        <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-[10px] text-gray-400 font-semibold mb-1">{label}</p>
            {long ? (
                <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{value}</div>
            ) : (
                <p className="text-sm text-gray-900 font-medium">{value}</p>
            )}
        </div>
    );
}

/* ───────── Main Page ───────── */
export default function AdminPendingProductsPage() {
    const [products, setProducts] = useState<PendingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [detailId, setDetailId] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/products?approvalStatus=' + filter);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data?.products ?? []));
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleApproval = async (
        id: string,
        status: 'APPROVED' | 'REJECTED',
        opts?: { badgeAuthentic?: boolean; badgeKoreanCertified?: boolean; rejectReason?: string }
    ) => {
        setProcessing(id);
        await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                approvalStatus: status,
                status: status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE',
                rejectionReason: opts?.rejectReason || null,
                badgeAuthentic: opts?.badgeAuthentic ?? false,
                badgeKoreanCertified: opts?.badgeKoreanCertified ?? false,
            }),
        });
        setProcessing(null);
        setApprovingId(null);
        setDetailId(null);
        fetchProducts();
    };

    const reject = (id: string) => {
        const reason = prompt('반려 사유를 입력하세요 (판매자에게 표시됩니다):');
        if (reason !== null) handleApproval(id, 'REJECTED', { rejectReason: reason });
    };

    const filtered = products.filter(p => {
        const name = p.translations.find(t => t.langCode === 'ko')?.name || '';
        const q = search.toLowerCase();
        return !q || name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.supplier?.companyName || '').toLowerCase().includes(q);
    });

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-yellow-500" /> Review Products · 상품 검수 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review full product details before approval · 상품 상세 내용을 확인 후 승인/반려합니다</p>
                </div>
                <button onClick={fetchProducts} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {([
                    { key: 'PENDING', label: '🟡 Under Review · 검수 대기', color: 'text-yellow-700 bg-yellow-50 border-yellow-300' },
                    { key: 'APPROVED', label: '🟢 Approved · 승인됨', color: 'text-green-700 bg-green-50 border-green-300' },
                    { key: 'REJECTED', label: '🔴 Rejected · 반려됨', color: 'text-red-700 bg-red-50 border-red-300' },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => { setFilter(t.key); setApprovingId(null); setDetailId(null); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === t.key ? t.color : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Product name, SKU, Seller · 상품명 또는 SKU 검색..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white shadow-sm" />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">{filter === 'PENDING' ? '🎉 No products under review! · 검수 대기 상품이 없습니다!' : 'No products found · 해당 상품이 없습니다.'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(p => {
                        const name = p.translations.find(t => t.langCode === 'ko')?.name || p.sku;
                        const isProcessing = processing === p.id;
                        const isApprovingThis = approvingId === p.id;
                        const isDetailOpen = detailId === p.id;

                        return (
                            <div key={p.id} className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${isDetailOpen ? 'border-blue-300 ring-1 ring-blue-200' : filter === 'PENDING' ? 'border-yellow-200' : 'border-gray-100'}`}>
                                {/* Product row */}
                                <div className="flex items-center gap-4">
                                    {p.imageUrl
                                        ? <img src={p.imageUrl} alt={name} className="w-16 h-16 object-cover rounded-xl border flex-shrink-0" />
                                        : <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900">{name}</div>
                                        <div className="text-xs text-gray-400">{p.sku} · ${Number(p.priceUsd).toFixed(2)}</div>
                                        <div className="text-xs text-blue-600 mt-0.5">Seller: {p.supplier?.companyName || '-'}</div>
                                        <div className="text-xs text-gray-400">Registered: {new Date(p.createdAt).toLocaleDateString('ko-KR')}</div>
                                        {/* Badge display for approved/rejected */}
                                        {filter !== 'PENDING' && (p.badgeAuthentic || p.badgeKoreanCertified) && (
                                            <div className="flex gap-1.5 mt-1 flex-wrap">
                                                {p.badgeAuthentic && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-pink-600 border border-pink-200">
                                                        <ShieldCheck className="w-3 h-3" /> Authentic
                                                    </span>
                                                )}
                                                {p.badgeKoreanCertified && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-600 border border-teal-200">
                                                        <Award className="w-3 h-3" /> Korean Certified
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        {/* View Details button — always visible */}
                                        <button
                                            onClick={() => setDetailId(isDetailOpen ? null : p.id)}
                                            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors ${isDetailOpen
                                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                        >
                                            <Eye className="w-4 h-4" />
                                            {isDetailOpen ? 'Hide' : 'View'} · {isDetailOpen ? '접기' : '상세'}
                                        </button>

                                        {filter === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => setApprovingId(isApprovingThis ? null : p.id)}
                                                    disabled={isProcessing}
                                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors ${isApprovingThis ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                >
                                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                    Approve · 승인
                                                </button>
                                                <button onClick={() => reject(p.id)} disabled={isProcessing}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 border border-red-200">
                                                    <XCircle className="w-4 h-4" />
                                                    Reject · 반려
                                                </button>
                                            </>
                                        )}

                                        {filter !== 'PENDING' && (
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-center ${filter === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                {filter === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Product detail panel */}
                                {isDetailOpen && (
                                    <ProductDetailPanel
                                        productId={p.id}
                                        onClose={() => setDetailId(null)}
                                    />
                                )}

                                {/* Badge selection panel for approval */}
                                {isApprovingThis && (
                                    <ApproveBadgePanel
                                        onConfirm={(badgeAuthentic, badgeKoreanCertified) =>
                                            handleApproval(p.id, 'APPROVED', { badgeAuthentic, badgeKoreanCertified })
                                        }
                                        onCancel={() => setApprovingId(null)}
                                        isProcessing={isProcessing}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
