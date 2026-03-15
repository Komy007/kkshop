'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, Trash2, Package, RefreshCw, Loader2,
    Image as ImageIcon, Sparkles, Edit3, CheckCircle, XCircle, FolderInput, Copy,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';

interface Category { id: string; slug: string; nameKo: string; isSystem: boolean; }
interface Product {
    id: string; sku: string; priceUsd: string; costPrice?: string | null; stockQty: number;
    stockAlertQty?: number; status: string; approvalStatus: string;
    imageUrl?: string; brandName?: string; isNew: boolean;
    supplierId?: string | null; createdAt: string;
    translations: { langCode: string; name: string }[];
    _count: { images: number };
    category?: { id: string; slug: string; nameKo: string } | null;
}

export default function AdminProductsPage() {
    const router = useRouter();
    const t = useTranslations();
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [activeSlug, setActiveSlug] = useState('all');
    const [deleting,       setDeleting]       = useState<string | null>(null);
    const [movingId,       setMovingId]       = useState<string | null>(null);
    const [moveCategoryId, setMoveCategoryId] = useState('');
    const [approvingId,    setApprovingId]    = useState<string | null>(null); // row open for approve/reject
    const [rejectReason,   setRejectReason]   = useState('');
    const [actionLoading,  setActionLoading]  = useState<string | null>(null);
    const [approvalFilter, setApprovalFilter] = useState('all'); // 'all' | 'PENDING'
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    const fetchProducts = useCallback(async (p = page, q = search, slug = activeSlug, apf = approvalFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p) });
            if (q) params.set('search', q);
            if (slug && slug !== 'all') params.set('category', slug);
            if (apf && apf !== 'all') params.set('approvalStatus', apf);

            const [pRes, cRes] = await Promise.all([
                fetch(`/api/admin/products?${params}`),
                categories.length ? Promise.resolve(null) : fetch('/api/admin/categories'),
            ]);
            const pData = await pRes.json();
            setProducts(Array.isArray(pData.products) ? pData.products : []);
            setTotal(pData.total ?? 0);
            setPageSize(pData.pageSize ?? 50);

            if (cRes) {
                const cData = await cRes.json();
                setCategories(Array.isArray(cData) ? cData : []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, activeSlug, approvalFilter, categories.length]);

    // Initial load - restore filters + scroll from sessionStorage
    useEffect(() => {
        const saved = sessionStorage.getItem('admin_products_filters');
        if (saved) {
            try {
                const { search: s, activeSlug: a, page: pg } = JSON.parse(saved);
                const restoredSearch = s || '';
                const restoredSlug = a || 'all';
                const restoredPage = pg || 1;
                setSearchInput(restoredSearch);
                setSearch(restoredSearch);
                setActiveSlug(restoredSlug);
                setPage(restoredPage);
                return; // fetchProducts will be called by the state change effects below
            } catch {}
        }
        fetchProducts(1, '', 'all');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Restore scroll position after products finish loading
    useEffect(() => {
        if (!loading && products.length > 0) {
            const savedScroll = sessionStorage.getItem('admin_products_scroll');
            if (savedScroll) {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
                    }, 50);
                });
            }
        }
    }, [loading, products.length]);

    // Save scroll position continuously while browsing
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('admin_products_scroll', window.scrollY.toString());
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch when page/search/category/approvalFilter changes (but not on initial mount)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        sessionStorage.setItem('admin_products_filters', JSON.stringify({ search, activeSlug, page }));
        sessionStorage.removeItem('admin_products_scroll');
        fetchProducts(page, search, activeSlug, approvalFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, activeSlug, approvalFilter]);

    const handleSearchChange = (val: string) => {
        setSearchInput(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            setSearch(val);
        }, 400);
    };

    const handleTabChange = (slug: string) => {
        setActiveSlug(slug);
        setPage(1);
    };

    const handleEdit = (id: string) => {
        // Explicitly save scroll position before navigating to edit page
        sessionStorage.setItem('admin_products_scroll', window.scrollY.toString());
        router.push(`/admin/products/${id}/edit`);
    };

    const tabs = [
        { slug: 'all', nameKo: '전체' },
        ...categories.sort((a, b) => (a.isSystem ? 1 : 0) - (b.isSystem ? 1 : 0)),
    ];
    const tabName = (tab: any) => tab.slug === 'all' ? t.shortcuts.all : tab.nameKo;

    const handleClone = async (id: string) => {
        const p = await fetch(`/api/admin/products/${id}`).then(r => r.json());
        if (!p) return;
        const koTrans = p.translations?.find((t: any) => t.langCode === 'ko') ?? {};
        sessionStorage.setItem('cloneProduct', JSON.stringify({
            ...p, sku: '', name: koTrans.name, shortDesc: koTrans.shortDesc,
            detailDesc: koTrans.detailDesc, ingredients: koTrans.ingredients,
            howToUse: koTrans.howToUse, benefits: koTrans.benefits, seoKeywords: koTrans.seoKeywords,
        }));
        router.push('/admin/products/new?clone=1');
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" - ${t.common.delete}?`)) return;
        setDeleting(id);
        await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
        setDeleting(null);
        fetchProducts(page, search, activeSlug);
    };

    const patch = async (id: string, data: Record<string, any>) => {
        await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });
        fetchProducts(page, search, activeSlug);
    };

    const toggleStatus = (p: Product) => patch(p.id, { status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    const toggleIsNew  = (p: Product) => patch(p.id, { isNew: !p.isNew });

    const handleApprove = async (id: string) => {
        setActionLoading(id + '_approve');
        await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, approvalStatus: 'APPROVED', status: 'ACTIVE' }),
        });
        setActionLoading(null);
        setApprovingId(null);
        fetchProducts(page, search, activeSlug, approvalFilter);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id + '_reject');
        await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, approvalStatus: 'REJECTED', status: 'INACTIVE', rejectionReason: rejectReason }),
        });
        setActionLoading(null);
        setApprovingId(null);
        setRejectReason('');
        fetchProducts(page, search, activeSlug, approvalFilter);
    };
    const moveCategory = async (id: string) => {
        await patch(id, { categoryId: moveCategoryId || null });
        setMovingId(null);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-500" /> {t.admin.products.title}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {t.admin.products.totalCount.replace('{count}', total.toLocaleString())}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchProducts(page, search, activeSlug)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button onClick={() => { sessionStorage.removeItem('admin_products_scroll'); router.push('/admin/products/new'); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm">
                        <Plus className="w-4 h-4" /> {t.admin.products.newProduct}
                    </button>
                </div>
            </div>

            {/* Approval filter pills */}
            <div className="flex gap-2 mb-3 flex-wrap">
                {[
                    { val: 'all',     label: 'All Products',      labelKo: '전체 상품',   color: 'blue'   },
                    { val: 'PENDING', label: '🔔 Pending Review', labelKo: '검수 대기',   color: 'amber'  },
                    { val: 'APPROVED',label: 'Approved',          labelKo: '승인됨',      color: 'green'  },
                    { val: 'REJECTED',label: 'Rejected',          labelKo: '반려됨',      color: 'red'    },
                ].map(f => (
                    <button key={f.val} onClick={() => { setApprovalFilter(f.val); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${approvalFilter === f.val
                            ? f.color === 'amber' ? 'bg-amber-500 text-white border-amber-500'
                            : f.color === 'green' ? 'bg-green-600 text-white border-green-600'
                            : f.color === 'red'   ? 'bg-red-600 text-white border-red-600'
                            : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                        {f.label}
                        <span className="opacity-60 ml-1">· {f.labelKo}</span>
                    </button>
                ))}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                {tabs.map(tab => (
                    <button key={tab.slug} onClick={() => handleTabChange(tab.slug)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${activeSlug === tab.slug ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                        {tabName(tab)}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" value={searchInput} onChange={e => handleSearchChange(e.target.value)}
                    placeholder={t.admin.products.searchPlaceholder}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">{search ? t.common.noResults : t.admin.products.searchPlaceholder}</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                                        <th className="py-3 px-4">{t.admin.products.table.image}</th>
                                        <th className="py-3 px-4">{t.admin.products.table.name}</th>
                                        <th className="py-3 px-4 hidden md:table-cell">{t.admin.products.table.category}</th>
                                        <th className="py-3 px-4">{t.admin.products.table.priceStock}</th>
                                        <th className="py-3 px-4 hidden lg:table-cell">{t.admin.products.table.margin}</th>
                                        <th className="py-3 px-4">{t.admin.products.table.status}</th>
                                        <th className="py-3 px-4 hidden md:table-cell">Review <span className="opacity-60">· 검수</span></th>
                                        <th className="py-3 px-4">{t.admin.products.table.isNew}</th>
                                        <th className="py-3 px-4 text-right">{t.admin.products.table.manage}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {products.map(p => {
                                        const koName = p.translations.find(tr => tr.langCode === 'ko')?.name || p.sku;
                                        const statusMap: any = {
                                            ACTIVE: t.admin.products.status.active,
                                            INACTIVE: t.admin.products.status.inactive,
                                            SOLDOUT: t.admin.products.status.soldout,
                                        };
                                        return (
                                            <React.Fragment key={p.id}>
                                                <tr className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        {p.imageUrl
                                                            ? <img src={p.imageUrl.startsWith('http') || p.imageUrl.startsWith('/') ? p.imageUrl : `/${p.imageUrl}`}
                                                                alt={koName} className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image'; }} />
                                                            : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>
                                                        }
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-gray-900 text-sm line-clamp-1">{koName}</div>
                                                        <div className="text-xs text-gray-400">{p.sku}</div>
                                                        {p._count.images > 0 && <div className="text-xs text-blue-400">🖼 +{p._count.images}장</div>}
                                                    </td>
                                                    <td className="py-3 px-4 hidden md:table-cell">
                                                        <button onClick={() => { setMovingId(p.id); setMoveCategoryId(p.category?.id || ''); }}
                                                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
                                                            <FolderInput className="w-3.5 h-3.5" />
                                                            {p.category?.nameKo || '미분류'}
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-gray-900 text-sm">${Number(p.priceUsd).toFixed(2)}</div>
                                                        <div className={`text-xs ${p.stockQty === 0 ? 'text-red-500 font-bold' : p.stockAlertQty !== undefined && p.stockQty <= p.stockAlertQty ? 'text-amber-500 font-semibold' : 'text-gray-500'}`}>
                                                            {t.admin.edit.fields.stock} {p.stockQty}{p.stockQty === 0 ? ' ⚠SoldOut' : p.stockAlertQty !== undefined && p.stockQty <= p.stockAlertQty ? ' ⚠Low' : ''}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 hidden lg:table-cell">
                                                        {p.costPrice ? (
                                                            <span className={`text-xs font-bold ${Math.round((1 - Number(p.costPrice) / Number(p.priceUsd)) * 100) >= 30 ? 'text-green-600' : Math.round((1 - Number(p.costPrice) / Number(p.priceUsd)) * 100) >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                {Math.round((1 - Number(p.costPrice) / Number(p.priceUsd)) * 100)}%
                                                            </span>
                                                        ) : <span className="text-xs text-gray-300">—</span>}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <button onClick={() => toggleStatus(p)}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} hover:opacity-75`}>
                                                            {p.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            {statusMap[p.status] || p.status}
                                                        </button>
                                                    </td>
                                                    {/* Review status cell */}
                                                    <td className="py-3 px-4 hidden md:table-cell">
                                                        {p.approvalStatus === 'PENDING' ? (
                                                            <button
                                                                onClick={() => { setApprovingId(approvingId === p.id ? null : p.id); setRejectReason(''); }}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors border border-amber-200 animate-pulse">
                                                                🔔 Pending · 검수 대기
                                                            </button>
                                                        ) : p.approvalStatus === 'REJECTED' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                                                <XCircle className="w-3 h-3" /> Rejected · 반려
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                                                                <CheckCircle className="w-3 h-3" /> OK
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <button onClick={() => toggleIsNew(p)}
                                                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all ${p.isNew ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                            <Sparkles className="w-3 h-3" />
                                                            {p.isNew ? 'NEW' : t.admin.edit.fields.isNew}
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => handleEdit(p.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t.admin.products.actions.edit}>
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleClone(p.id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title={t.admin.products.actions.clone}>
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(p.id, koName)} disabled={deleting === p.id}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title={t.admin.products.actions.delete}>
                                                                {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Category move row */}
                                                {movingId === p.id && (
                                                    <tr className="bg-blue-50">
                                                        <td colSpan={9} className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
                                                                    <FolderInput className="w-4 h-4" /> {t.admin.products.actions.moveCategory}:
                                                                </span>
                                                                <select value={moveCategoryId} onChange={e => setMoveCategoryId(e.target.value)}
                                                                    className="flex-1 border border-blue-200 rounded-lg py-1.5 px-3 text-sm focus:outline-none bg-white">
                                                                    <option value="">— 미분류 —</option>
                                                                    {categories.map(c => (
                                                                        <option key={c.id} value={c.id}>{c.nameKo}{c.isSystem ? ' ✦' : ''}</option>
                                                                    ))}
                                                                </select>
                                                                <button onClick={() => moveCategory(p.id)} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">{t.admin.products.actions.confirmMove}</button>
                                                                <button onClick={() => setMovingId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">{t.admin.products.actions.cancel}</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* ── Approve / Reject row ── */}
                                                {approvingId === p.id && (
                                                    <tr className="bg-amber-50 border-t border-amber-100">
                                                        <td colSpan={9} className="px-4 py-4">
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-bold text-amber-800 mb-1.5">
                                                                        🔔 Review Decision · 검수 결정 — <span className="font-normal opacity-80">{koName}</span>
                                                                    </p>
                                                                    <input
                                                                        value={rejectReason}
                                                                        onChange={e => setRejectReason(e.target.value)}
                                                                        placeholder="Rejection reason (optional, shown to seller) · 반려 사유 (선택사항, 셀러에게 표시)"
                                                                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2 flex-shrink-0">
                                                                    <button
                                                                        onClick={() => handleApprove(p.id)}
                                                                        disabled={actionLoading === p.id + '_approve'}
                                                                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors shadow-sm">
                                                                        {actionLoading === p.id + '_approve'
                                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                            : <CheckCircle className="w-3.5 h-3.5" />}
                                                                        Approve &amp; Publish <span className="opacity-70 font-normal">· 승인</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(p.id)}
                                                                        disabled={actionLoading === p.id + '_reject'}
                                                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors shadow-sm">
                                                                        {actionLoading === p.id + '_reject'
                                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                            : <XCircle className="w-3.5 h-3.5" />}
                                                                        Reject <span className="opacity-70 font-normal">· 반려</span>
                                                                    </button>
                                                                    <button onClick={() => setApprovingId(null)}
                                                                        className="px-3 py-2 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50">
                                                                        Cancel · 취소
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-gray-500">
                                {((page - 1) * pageSize + 1).toLocaleString()}–{Math.min(page * pageSize, total).toLocaleString()} / {total.toLocaleString()}개
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-700 px-2">{page} / {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
