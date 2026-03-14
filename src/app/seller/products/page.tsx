'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, Plus, Loader2, RefreshCw, Clock, CheckCircle, XCircle, Search, ImageIcon, Edit3, AlertCircle } from 'lucide-react';

interface Product {
    id:             string;
    sku:            string;
    priceUsd:       string;
    stockQty:       number;
    status:         string;
    approvalStatus: string;
    isNew:          boolean;
    isHotSale:      boolean;
    imageUrl?:      string;
    brandName?:     string;
    createdAt:      string;
    translations:   { langCode: string; name: string }[];
}

const BADGE: Record<string, { en: string; ko: string; icon: any; cls: string }> = {
    PENDING:  { en: 'Under Review', ko: '검수 대기중', icon: Clock,       cls: 'bg-amber-100 text-amber-700' },
    APPROVED: { en: 'Live',         ko: '판매 승인됨', icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
    REJECTED: { en: 'Rejected',     ko: '반려됨',      icon: XCircle,     cls: 'bg-red-100  text-red-600'   },
};

const TABS: { key: 'ALL'|'PENDING'|'APPROVED'|'REJECTED'; en: string; ko: string }[] = [
    { key: 'ALL',      en: 'All',          ko: '전체'      },
    { key: 'PENDING',  en: 'Under Review', ko: '검수 대기' },
    { key: 'APPROVED', en: 'Live',         ko: '판매중'    },
    { key: 'REJECTED', en: 'Rejected',     ko: '반려'      },
];

export default function SellerProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);
    const [search,   setSearch]   = useState('');
    const [tab,      setTab]      = useState<'ALL'|'PENDING'|'APPROVED'|'REJECTED'>('ALL');

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        const res  = await fetch('/api/seller/products');
        const data = await res.json();
        if (!res.ok) {
            setError(data?.error || 'Failed to load products');
            setProducts([]);
        } else {
            setProducts(Array.isArray(data) ? data : []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = products.filter(p => {
        const enName = p.translations.find(t => t.langCode === 'en')?.name || '';
        const koName = p.translations.find(t => t.langCode === 'ko')?.name || '';
        const q = search.toLowerCase();
        const matchSearch = !q || enName.toLowerCase().includes(q) || koName.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
        const matchTab    = tab === 'ALL' || p.approvalStatus === tab;
        return matchSearch && matchTab;
    });

    const count = (s: string) => s === 'ALL' ? products.length : products.filter(p => p.approvalStatus === s).length;

    return (
        <div className="max-w-5xl mx-auto py-7 px-4">

            {/* Header */}
            <div className="flex items-start justify-between mb-5 gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-teal-500" /> My Products
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">내 상품 — {products.length} items total</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={load} title="Refresh · 새로고침" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <Link href="/seller/products/new"
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-sm">
                        <Plus className="w-4 h-4" />
                        <span>
                            <span className="block leading-tight">New Product</span>
                            <span className="block text-[10px] opacity-70 leading-tight">상품 등록</span>
                        </span>
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors border ${tab === t.key ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'}`}>
                        {t.en} <span className={`text-[10px] ${tab === t.key ? 'opacity-70' : 'opacity-50'}`}>·{t.ko} ({count(t.key)})</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by product name or SKU · 상품명 또는 SKU 검색"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm" />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border gap-3">
                    <AlertCircle className="w-12 h-12 text-amber-400" />
                    <p className="text-gray-800 font-bold">Unable to Load Products</p>
                    <p className="text-sm text-gray-400 text-center">
                        {error === 'No supplier profile'
                            ? 'Supplier profile not registered. Please contact admin.\n공급업체 프로필이 없습니다. 관리자에게 문의하세요.'
                            : error}
                    </p>
                    <button onClick={load} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700">
                        Retry · 다시 시도
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-800 font-bold mb-1">No Products Found</p>
                    <p className="text-sm text-gray-400 mb-4">등록된 상품이 없습니다.</p>
                    <Link href="/seller/products/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700">
                        <Plus className="w-4 h-4" /> Register First Product · 첫 상품 등록
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b text-xs text-gray-500 font-semibold uppercase tracking-wide">
                                <th className="py-3 px-4">Image</th>
                                <th className="py-3 px-4">Product Name</th>
                                <th className="py-3 px-4">Price / Stock</th>
                                <th className="py-3 px-4">Status · 상태</th>
                                <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                                <th className="py-3 px-4">Edit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(p => {
                                const enName    = p.translations.find(t => t.langCode === 'en')?.name || '';
                                const koName    = p.translations.find(t => t.langCode === 'ko')?.name || p.sku;
                                const badge     = BADGE[p.approvalStatus] ?? { en: 'Pending', ko: '대기중', icon: Clock, cls: 'bg-gray-100 text-gray-500' };
                                const BadgeIcon = badge.icon;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            {p.imageUrl
                                                ? <img src={p.imageUrl} alt={enName} className="w-12 h-12 object-cover rounded-lg border" />
                                                : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-gray-900 text-sm leading-tight">{enName || koName}</div>
                                            {enName && koName && enName !== koName && (
                                                <div className="text-[11px] text-gray-400">{koName}</div>
                                            )}
                                            <div className="text-[11px] text-gray-300 font-mono">{p.sku}</div>
                                            {p.approvalStatus === 'REJECTED' && (
                                                <div className="text-xs text-red-500 mt-0.5">
                                                    Re-register after reviewing rejection reason · 반려 사유 확인 후 재등록
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-sm">${Number(p.priceUsd).toFixed(2)}</div>
                                            <div className={`text-xs ${p.stockQty === 0 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                                {p.stockQty === 0 ? 'Out of stock' : `Stock: ${p.stockQty}`}
                                                <span className="text-gray-300 ml-1">· 재고</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                                                <BadgeIcon className="w-3 h-3" /> {badge.en}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-0.5 pl-1">{badge.ko}</div>
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell text-xs text-gray-400">
                                            {new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link href={`/seller/products/${p.id}/edit`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-600 rounded-lg transition-colors">
                                                <Edit3 className="w-3 h-3" /> Edit
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Review notice */}
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700 font-semibold">📋 Review Process · 검수 안내</p>
                <p className="text-xs text-blue-600 mt-1">
                    Products go live after admin review (1–2 business days).
                    <span className="opacity-70 ml-1">· 등록 상품은 관리자 검수 후 판매됩니다. 1~2 영업일 소요.</span>
                </p>
            </div>
        </div>
    );
}
