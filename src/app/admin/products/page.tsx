'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, Trash2, Package, RefreshCw, Loader2,
    Image as ImageIcon, Sparkles, Edit3, CheckCircle, XCircle, FolderInput, Copy,
} from 'lucide-react';

interface Category { id: string; slug: string; nameKo: string; isSystem: boolean; }
interface Product {
    id: string; sku: string; priceUsd: string; costPrice?: string | null; stockQty: number;
    stockAlertQty?: number; status: string; imageUrl?: string; brandName?: string; isNew: boolean;
    createdAt: string;
    translations: { langCode: string; name: string }[];
    _count: { images: number };
    category?: { id: string; slug: string; nameKo: string } | null;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: '판매중', className: 'bg-green-100 text-green-700' },
    INACTIVE: { label: '숨김', className: 'bg-gray-100 text-gray-500' },
    SOLDOUT: { label: '품절', className: 'bg-red-100 text-red-600' },
};

export default function AdminProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeSlug, setActiveSlug] = useState('all');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [movingId, setMovingId] = useState<string | null>(null);
    const [moveCategoryId, setMoveCategoryId] = useState('');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                fetch('/api/admin/products'),
                fetch('/api/admin/categories'),
            ]);
            const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);
            setProducts(Array.isArray(pData) ? pData : []);
            setCategories(Array.isArray(cData) ? cData : []);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 1. Initial Load: Restore Filters
    useEffect(() => {
        const savedFilters = sessionStorage.getItem('admin_products_filters');
        if (savedFilters) {
            const { search: s, activeSlug: a } = JSON.parse(savedFilters);
            if (s !== undefined) setSearch(s);
            if (a !== undefined) setActiveSlug(a);
        }
        fetchAll();
    }, [fetchAll]);

    // 2. Continuous Sync: Save Filters & Scroll to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('admin_products_filters', JSON.stringify({ search, activeSlug }));
    }, [search, activeSlug]);

    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('admin_products_scroll', window.scrollY.toString());
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 3. Restore Scroll Position after Data Loading & Rendering
    useEffect(() => {
        if (!loading && products.length > 0) {
            const savedScroll = sessionStorage.getItem('admin_products_scroll');
            if (savedScroll) {
                // Use requestAnimationFrame to ensure DOM is updated
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
                    }, 50);
                });
            }
        }
    }, [loading, products.length]);

    const handleEdit = (id: string) => {
        // Scroll is already being saved via scroll event listener
        router.push(`/admin/products/${id}/edit`);
    };

    // Category tabs: All + each category
    const tabs = [
        { slug: 'all', nameKo: '전체' },
        ...categories.sort((a, b) => (a.isSystem ? 1 : 0) - (b.isSystem ? 1 : 0)),
    ];

    const filtered = products.filter(p => {
        const name = p.translations.find(t => t.langCode === 'ko')?.name || '';
        const q = search.toLowerCase();
        const matchSearch = !q || name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.brandName || '').toLowerCase().includes(q);
        const matchTab = activeSlug === 'all'
            ? true
            : p.category?.slug === activeSlug;
        return matchSearch && matchTab;
    });

    const handleClone = async (id: string) => {
        const p = await fetch(`/api/admin/products/${id}`).then(r => r.json());
        if (!p) return;
        const koTrans = p.translations?.find((t: any) => t.langCode === 'ko') ?? {};
        // Store clone data in sessionStorage and navigate to new product page
        sessionStorage.setItem('cloneProduct', JSON.stringify({
            ...p, sku: '', name: koTrans.name, shortDesc: koTrans.shortDesc,
            detailDesc: koTrans.detailDesc, ingredients: koTrans.ingredients,
            howToUse: koTrans.howToUse, benefits: koTrans.benefits, seoKeywords: koTrans.seoKeywords,
        }));
        router.push('/admin/products/new?clone=1');
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" 상품을 삭제하시겠습니까?`)) return;
        setDeleting(id);
        await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
        setDeleting(null);
        fetchAll();
    };

    const patch = async (id: string, data: Record<string, any>) => {
        await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });
        fetchAll();
    };

    const toggleStatus = async (p: Product) => {
        const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await patch(p.id, { status: next });
    };

    const toggleIsNew = async (p: Product) => {
        await patch(p.id, { isNew: !p.isNew });
    };

    const moveCategory = async (id: string) => {
        await patch(id, { categoryId: moveCategoryId || null });
        setMovingId(null);
    };

    const countBySlug = (slug: string) => {
        if (slug === 'all') return products.length;
        if (slug === 'new') return products.filter(p => p.isNew || p.category?.slug === 'new').length;
        return products.filter(p => p.category?.slug === slug).length;
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Package className="w-6 h-6 text-blue-500" /> 상품 관리</h1>
                    <p className="text-sm text-gray-500 mt-0.5">총 {products.length}개 상품</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAll} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
                    <button onClick={() => router.push('/admin/products/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm">
                        <Plus className="w-4 h-4" /> 새 상품 등록
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                {tabs.map(tab => {
                    const cnt = countBySlug(tab.slug);
                    const active = activeSlug === tab.slug;
                    return (
                        <button key={tab.slug} onClick={() => setActiveSlug(tab.slug)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                            {tab.nameKo} {cnt > 0 && <span className={`ml-1 text-xs ${active ? 'opacity-80' : 'text-gray-400'}`}>({cnt})</span>}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="상품명, SKU, 브랜드 검색..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">{search ? '검색 결과가 없습니다.' : '이 카테고리에 상품이 없습니다.'}</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                                <th className="py-3 px-4">이미지</th>
                                <th className="py-3 px-4">상품명</th>
                                <th className="py-3 px-4 hidden md:table-cell">카테고리</th>
                                <th className="py-3 px-4">가격/재고</th>
                                <th className="py-3 px-4 hidden lg:table-cell">마진</th>
                                <th className="py-3 px-4">상태</th>
                                <th className="py-3 px-4">신상품</th>
                                <th className="py-3 px-4 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(p => {
                                const koName = p.translations.find(t => t.langCode === 'ko')?.name || p.sku;
                                const badge = STATUS_BADGE[p.status] ?? { label: '숨김', className: 'bg-gray-100 text-gray-500' };

                                return (
                                    <React.Fragment key={p.id}>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                {p.imageUrl
                                                    ? <img src={p.imageUrl.startsWith('http') || p.imageUrl.startsWith('/') ? p.imageUrl : `/${p.imageUrl}`}
                                                        alt={koName} className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                                        }} />
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
                                                    재고 {p.stockQty}{p.stockQty === 0 ? ' ⚠품절' : p.stockAlertQty !== undefined && p.stockQty <= p.stockAlertQty ? ' ⚠저재고' : ''}
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
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all ${badge.className} hover:opacity-75`}>
                                                    {p.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {badge.label}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button onClick={() => toggleIsNew(p)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all ${p.isNew ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                    <Sparkles className="w-3 h-3" />
                                                    {p.isNew ? 'NEW' : '일반'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleEdit(p.id)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="편집">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleClone(p.id)}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="복사">
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id, koName)} disabled={deleting === p.id}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="삭제">
                                                        {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Category move row */}
                                        {movingId === p.id && (
                                            <tr className="bg-blue-50">
                                                <td colSpan={7} className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
                                                            <FolderInput className="w-4 h-4" /> 카테고리 이동:
                                                        </span>
                                                        <select value={moveCategoryId} onChange={e => setMoveCategoryId(e.target.value)}
                                                            className="flex-1 border border-blue-200 rounded-lg py-1.5 px-3 text-sm focus:outline-none bg-white">
                                                            <option value="">— 미분류 —</option>
                                                            {categories.map(c => (
                                                                <option key={c.id} value={c.id}>{c.nameKo}{c.isSystem ? ' ✦' : ''}</option>
                                                            ))}
                                                        </select>
                                                        <button onClick={() => moveCategory(p.id)} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">이동</button>
                                                        <button onClick={() => setMovingId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">취소</button>
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
            )}
        </div>
    );
}
