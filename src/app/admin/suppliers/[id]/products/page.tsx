'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Package, CheckCircle, XCircle, Clock, Loader2,
    Pencil, Search, RefreshCw, AlertCircle, Building2, ExternalLink
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface SupplierInfo {
    id: string;
    companyName: string;
    brandName?: string;
    contactEmail: string;
    status: string;
    commissionRate: number;
    _count: { products: number };
}

interface Product {
    id: string;
    sku: string;
    approvalStatus: string;
    status: string;
    priceUsd: string;
    brandName?: string;
    createdAt: string;
    translations: { langCode: string; name: string }[];
    images: { url: string }[];
    category: { nameKo: string } | null;
}

const APPROVAL_TABS = [
    { key: 'all',      label: 'All · 전체',        color: 'text-gray-700' },
    { key: 'PENDING',  label: 'Pending · 대기중',   color: 'text-yellow-600' },
    { key: 'APPROVED', label: 'Approved · 승인',    color: 'text-green-600' },
    { key: 'REJECTED', label: 'Rejected · 거절',   color: 'text-red-600' },
];

const approvalBadge: Record<string, string> = {
    PENDING:  'bg-yellow-100 text-yellow-800 border border-yellow-200',
    APPROVED: 'bg-green-100 text-green-700 border border-green-200',
    REJECTED: 'bg-red-100 text-red-700 border border-red-200',
};

const approvalIcon: Record<string, React.ReactNode> = {
    PENDING:  <Clock className="w-3 h-3" />,
    APPROVED: <CheckCircle className="w-3 h-3" />,
    REJECTED: <XCircle className="w-3 h-3" />,
};

/* ─── Page ───────────────────────────────────────────────── */
export default function SupplierProductsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [supplier, setSupplier]         = useState<SupplierInfo | null>(null);
    const [products, setProducts]         = useState<Product[]>([]);
    const [total, setTotal]               = useState(0);
    const [loading, setLoading]           = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [tab, setTab]                   = useState('all');
    const [search, setSearch]             = useState('');
    const [searchInput, setSearchInput]   = useState('');
    const [page, setPage]                 = useState(1);
    const [error, setError]               = useState('');
    const [toast, setToast]               = useState('');

    const PAGE_SIZE = 20;

    /* fetch supplier info */
    const fetchSupplier = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/suppliers/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSupplier(data);
            }
        } catch { /* ignore */ }
    }, [id]);

    /* fetch products */
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ supplierId: id, page: String(page) });
            if (tab !== 'all') params.set('approvalStatus', tab);
            if (search) params.set('search', search);

            const res = await fetch(`/api/admin/products?${params}`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setProducts(data.products ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setError('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id, tab, search, page]);

    useEffect(() => { fetchSupplier(); }, [fetchSupplier]);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    /* approve / reject inline */
    const handleApproval = async (productId: string, action: 'APPROVED' | 'REJECTED') => {
        setActionLoading(productId + action);
        try {
            const res = await fetch(`/api/admin/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvalStatus: action }),
            });
            if (!res.ok) throw new Error('Failed');
            setToast(`Product ${action === 'APPROVED' ? 'approved ✓' : 'rejected ✗'}`);
            setTimeout(() => setToast(''), 3000);
            fetchProducts();
        } catch {
            setToast('Action failed. Please retry.');
            setTimeout(() => setToast(''), 3000);
        } finally {
            setActionLoading(null);
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div>
                            <h1 className="text-base font-bold text-gray-900 leading-tight">
                                {supplier ? supplier.companyName : 'Supplier Products'}
                                <span className="text-gray-400 font-normal ml-1.5 text-sm">· 셀러 상품 관리</span>
                            </h1>
                            {supplier && (
                                <p className="text-xs text-gray-500">{supplier.contactEmail} · Commission {supplier.commissionRate}%</p>
                            )}
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button onClick={() => { fetchSupplier(); fetchProducts(); }}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-400">{total} products</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
                {/* ── Tabs ── */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        {APPROVAL_TABS.map(t => (
                            <button key={t.key}
                                onClick={() => { setTab(t.key); setPage(1); }}
                                className={`flex-1 px-3 py-3 text-sm font-semibold transition-colors ${tab === t.key
                                    ? `${t.color} border-b-2 border-current bg-gray-50`
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Search ── */}
                    <div className="p-3 border-b border-gray-50">
                        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
                            className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    placeholder="Search by name or SKU..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <button type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                                Search
                            </button>
                            {search && (
                                <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                                    className="px-3 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                                    Clear
                                </button>
                            )}
                        </form>
                    </div>

                    {/* ── Product List ── */}
                    {error && (
                        <div className="p-4 flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="p-12 flex items-center justify-center text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading products...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No products found</p>
                            {tab !== 'all' && (
                                <button onClick={() => setTab('all')} className="mt-2 text-blue-500 text-xs hover:underline">
                                    Show all products
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {products.map(product => {
                                const name = product.translations.find(t => t.langCode === 'ko')?.name
                                    || product.translations[0]?.name
                                    || '(No name)';
                                const thumb = product.images[0]?.url;
                                const isPending = product.approvalStatus === 'PENDING';

                                return (
                                    <div key={product.id}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                                        {/* Thumbnail */}
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                            {thumb ? (
                                                <img src={thumb} alt={name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/56x56?text=?'; }} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-xs text-gray-400">{product.sku}</span>
                                                {product.category && (
                                                    <span className="text-xs text-gray-400">· {product.category.nameKo}</span>
                                                )}
                                                <span className="text-xs font-semibold text-blue-600">${product.priceUsd}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${approvalBadge[product.approvalStatus] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                    {approvalIcon[product.approvalStatus]}
                                                    {product.approvalStatus}
                                                </span>
                                                <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-bold border ${product.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {product.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {/* Approve / Reject — only show prominently for PENDING */}
                                            {isPending && (
                                                <>
                                                    <button
                                                        onClick={() => handleApproval(product.id, 'APPROVED')}
                                                        disabled={!!actionLoading}
                                                        title="Approve"
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-60 transition-colors">
                                                        {actionLoading === product.id + 'APPROVED'
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <CheckCircle className="w-3.5 h-3.5" />}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproval(product.id, 'REJECTED')}
                                                        disabled={!!actionLoading}
                                                        title="Reject"
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 disabled:opacity-60 transition-colors">
                                                        {actionLoading === product.id + 'REJECTED'
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <XCircle className="w-3.5 h-3.5" />}
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {/* For approved/rejected — allow re-review */}
                                            {!isPending && (
                                                <button
                                                    onClick={() => handleApproval(product.id, product.approvalStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED')}
                                                    disabled={!!actionLoading}
                                                    title={product.approvalStatus === 'APPROVED' ? 'Reject' : 'Approve'}
                                                    className={`p-1.5 rounded-xl text-white transition-colors disabled:opacity-60 ${product.approvalStatus === 'APPROVED' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
                                                    {actionLoading === product.id + (product.approvalStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED')
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : product.approvalStatus === 'APPROVED'
                                                            ? <XCircle className="w-3.5 h-3.5" />
                                                            : <CheckCircle className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                            {/* Edit link */}
                                            <Link href={`/admin/products/${product.id}/edit`}
                                                title="Edit product"
                                                className="p-1.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Link>
                                            {/* View on store */}
                                            <Link href={`/products/${product.id}`} target="_blank"
                                                title="View on store"
                                                className="p-1.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors">
                                ← Prev
                            </button>
                            <span className="text-sm text-gray-500">
                                Page {page} / {totalPages} <span className="text-gray-400 text-xs ml-1">({total} total)</span>
                            </span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors">
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-2xl shadow-xl z-50 animate-fade-in">
                    {toast}
                </div>
            )}
        </div>
    );
}
