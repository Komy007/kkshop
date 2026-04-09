'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
    Flame, Sparkles, Crown, Star,
    Search, Plus, X, Loader2, LayoutGrid,
    RefreshCw, CheckCircle, XCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type SectionKey = 'hot' | 'new' | 'popular' | 'todaypick';

interface SectionProduct {
    id: string;
    name: string;
    priceUsd: string;
    hotSalePrice: string | null;
    displayPriority: number;
    isHotSale: boolean;
    isNew: boolean;
    isTodayPick: boolean;
    reviewAvg: string;
    reviewCount: number;
    imageUrl: string | null;
}

interface SearchResult {
    id: string;
    name: string;
    priceUsd: string;
    imageUrl: string | null;
}

// ── Section definitions ───────────────────────────────────────────────────────

const SECTIONS: {
    key: SectionKey;
    label: string;
    labelKo: string;
    icon: React.ElementType;
    flagField: 'isHotSale' | 'isNew' | 'isTodayPick' | null;
    patchField: string | null;
    color: string;
    iconColor: string;
}[] = [
    {
        key: 'hot',
        label: 'Hot Deals',
        labelKo: '핫딜',
        icon: Flame,
        flagField: 'isHotSale',
        patchField: 'isHotSale',
        color: 'from-orange-500 to-red-500',
        iconColor: 'text-orange-500',
    },
    {
        key: 'new',
        label: 'New Arrivals',
        labelKo: '신상품',
        icon: Sparkles,
        flagField: 'isNew',
        patchField: 'isNew',
        color: 'from-blue-500 to-cyan-500',
        iconColor: 'text-blue-500',
    },
    {
        key: 'popular',
        label: 'Popular',
        labelKo: '인기 상품',
        icon: Crown,
        flagField: null,
        patchField: null,
        color: 'from-purple-500 to-pink-500',
        iconColor: 'text-purple-500',
    },
    {
        key: 'todaypick',
        label: "Today's Picks",
        labelKo: '오늘의 픽',
        icon: Star,
        flagField: 'isTodayPick',
        patchField: 'isTodayPick',
        color: 'from-yellow-500 to-amber-500',
        iconColor: 'text-yellow-500',
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function patchProduct(id: string, data: Record<string, unknown>) {
    const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Update failed');
    }
    return res.json();
}

// ── Add Product Modal ─────────────────────────────────────────────────────────

function AddProductModal({
    section,
    onClose,
    onAdded,
}: {
    section: (typeof SECTIONS)[number];
    onClose: () => void;
    onAdded: () => void;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState<string | null>(null);
    const [error, setError] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const search = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return; }
        setSearching(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=10`);
            const data = await res.json();
            const raw: any[] = Array.isArray(data) ? data : (data.products ?? []);
            setResults(
                raw.map((p: any) => ({
                    id: String(p.id),
                    name: p.name ?? p.translations?.[0]?.name ?? `#${p.id}`,
                    priceUsd: String(p.priceUsd ?? '0'),
                    imageUrl: p.imageUrl ?? p.images?.[0]?.url ?? null,
                }))
            );
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleQueryChange = (v: string) => {
        setQuery(v);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => search(v), 350);
    };

    const handleAdd = async (productId: string) => {
        if (!section.patchField) return;
        setAdding(productId);
        setError('');
        try {
            await patchProduct(productId, { [section.patchField]: true });
            onAdded();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="font-bold text-slate-800 text-base">
                            Add to {section.label}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{section.labelKo}에 상품 추가</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search input */}
                <div className="px-5 py-3 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search product by name…"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                        )}
                    </div>
                    {error && (
                        <p className="mt-2 text-xs text-red-500">{error}</p>
                    )}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-3 py-2">
                    {results.length === 0 && query.trim() && !searching && (
                        <p className="text-center text-sm text-slate-400 py-8">No products found</p>
                    )}
                    {results.length === 0 && !query.trim() && (
                        <p className="text-center text-sm text-slate-400 py-8">Type to search products</p>
                    )}
                    {results.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleAdd(p.id)}
                            disabled={adding === p.id}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                        >
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                                {p.imageUrl ? (
                                    <Image
                                        src={p.imageUrl}
                                        alt={p.name}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                        No img
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                                <p className="text-xs text-slate-400">${parseFloat(p.priceUsd).toFixed(2)}</p>
                            </div>
                            {adding === p.id ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                            ) : (
                                <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Product Row ───────────────────────────────────────────────────────────────

function ProductRow({
    product,
    section,
    onRefresh,
}: {
    product: SectionProduct;
    section: (typeof SECTIONS)[number];
    onRefresh: () => void;
}) {
    const [priority, setPriority] = useState(product.displayPriority);
    const [savingPriority, setSavingPriority] = useState(false);
    const [savingFlag, setSavingFlag] = useState(false);
    const [error, setError] = useState('');

    // Current flag value for this section
    const flagValue: boolean =
        section.flagField === 'isHotSale'
            ? product.isHotSale
            : section.flagField === 'isNew'
            ? product.isNew
            : section.flagField === 'isTodayPick'
            ? product.isTodayPick
            : false;

    const handlePriorityBlur = async () => {
        if (priority === product.displayPriority) return;
        setSavingPriority(true);
        setError('');
        try {
            await patchProduct(product.id, { displayPriority: priority });
        } catch (e: any) {
            setError(e.message);
            setPriority(product.displayPriority);
        } finally {
            setSavingPriority(false);
        }
    };

    const handleFlagToggle = async () => {
        if (!section.patchField) return;
        const newVal = !flagValue;
        setSavingFlag(true);
        setError('');
        try {
            await patchProduct(product.id, { [section.patchField]: newVal });
            onRefresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSavingFlag(false);
        }
    };

    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden shadow-sm">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs text-center leading-tight px-1">
                        No image
                    </div>
                )}
            </div>

            {/* Name + price */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">
                        ${parseFloat(product.priceUsd).toFixed(2)}
                    </span>
                    {product.hotSalePrice && (
                        <span className="text-xs text-orange-500 font-medium">
                            Hot ${parseFloat(product.hotSalePrice).toFixed(2)}
                        </span>
                    )}
                    {product.reviewCount > 0 && (
                        <span className="text-xs text-slate-400">
                            ★ {parseFloat(product.reviewAvg).toFixed(1)} ({product.reviewCount})
                        </span>
                    )}
                </div>
                {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
            </div>

            {/* Display Priority */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                    Priority
                </label>
                <div className="relative">
                    <input
                        type="number"
                        min={0}
                        max={999}
                        value={priority}
                        onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                        onBlur={handlePriorityBlur}
                        className="w-16 text-center text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    {savingPriority && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
                            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Section flag toggle (only for flaggable sections) */}
            {section.flagField && (
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {section.flagField === 'isHotSale'
                            ? 'Hot'
                            : section.flagField === 'isNew'
                            ? 'New'
                            : 'Pick'}
                    </label>
                    <button
                        onClick={handleFlagToggle}
                        disabled={savingFlag}
                        className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
                            flagValue ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                        aria-label={`Toggle ${section.flagField}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                flagValue ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                        {savingFlag && (
                            <span className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-3 h-3 text-blue-300 animate-spin" />
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomepageSectionsPage() {
    const [activeTab, setActiveTab] = useState<SectionKey>('hot');
    const [products, setProducts] = useState<SectionProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const activeSection = SECTIONS.find((s) => s.key === activeTab)!;

    const fetchSection = useCallback(async (section: SectionKey) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/homepage-sections?section=${section}`);
            const data = await res.json();
            setProducts(Array.isArray(data.products) ? data.products : []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSection(activeTab);
    }, [activeTab, fetchSection]);

    const handleTabChange = (key: SectionKey) => {
        if (key !== activeTab) {
            setActiveTab(key);
            setProducts([]);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-5 bg-slate-100 min-h-full">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-blue-600" />
                        <h1 className="text-xl font-bold text-slate-800">Homepage Sections</h1>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">홈페이지 섹션 관리 — Hot Deals, New Arrivals, Popular, Today&apos;s Picks</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchSection(activeTab)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    {activeSection.patchField && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl p-1 shadow-sm flex gap-1 overflow-x-auto">
                {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const active = s.key === activeTab;
                    return (
                        <button
                            key={s.key}
                            onClick={() => handleTabChange(s.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center ${
                                active
                                    ? `bg-gradient-to-r ${s.color} text-white shadow-sm`
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{s.label}</span>
                            <span className="sm:hidden text-xs">{s.labelKo}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        {React.createElement(activeSection.icon, {
                            className: `w-4 h-4 ${activeSection.iconColor}`,
                        })}
                        <span className="font-semibold text-slate-700 text-sm">
                            {activeSection.label}
                        </span>
                        <span className="text-xs text-slate-400">— {activeSection.labelKo}</span>
                        {!loading && (
                            <span className="ml-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                {products.length}
                            </span>
                        )}
                    </div>
                    {activeTab === 'popular' && (
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                            Auto-sorted by rating
                        </span>
                    )}
                    {activeTab === 'new' && (
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                            Auto-sorted by newest
                        </span>
                    )}
                </div>

                {/* Section hint */}
                {(activeTab === 'hot' || activeTab === 'todaypick') && (
                    <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-600">
                            Toggle the{' '}
                            <strong>
                                {activeTab === 'hot' ? 'Hot' : 'Pick'}
                            </strong>{' '}
                            switch to remove a product from this section. Use{' '}
                            <strong>Add Product</strong> to include a new product.
                        </p>
                    </div>
                )}
                {(activeTab === 'new' || activeTab === 'popular') && (
                    <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500">
                            {activeTab === 'new'
                                ? 'Shows the 20 most recently added active products. Toggle isNew on/off per product to pin or unpin the "NEW" badge.'
                                : 'Shows the 20 highest-rated active products. Ranking is automatic based on review average and count.'}
                        </p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                )}

                {/* Empty */}
                {!loading && products.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        {React.createElement(activeSection.icon, { className: 'w-10 h-10 mb-3 opacity-20' })}
                        <p className="text-sm font-medium">No products in this section</p>
                        {activeSection.patchField && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-3 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add first product
                            </button>
                        )}
                    </div>
                )}

                {/* Product list */}
                {!loading && products.length > 0 && (
                    <div>
                        {products.map((product) => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                section={activeSection}
                                onRefresh={() => fetchSection(activeTab)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <AddProductModal
                    section={activeSection}
                    onClose={() => setShowAddModal(false)}
                    onAdded={() => fetchSection(activeTab)}
                />
            )}
        </div>
    );
}
