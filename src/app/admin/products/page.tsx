'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Package, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';

interface Product {
    id: string;
    sku: string;
    priceUsd: string;
    stockQty: number;
    status: string;
    imageUrl?: string;
    brandName?: string;
    volume?: string;
    createdAt: string;
    translations: { langCode: string; name: string }[];
    _count: { images: number };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: '판매중', color: 'bg-green-100 text-green-800' },
    INACTIVE: { label: '숨김', color: 'bg-gray-100 text-gray-600' },
    SOLDOUT: { label: '품절', color: 'bg-red-100 text-red-700' },
};

export default function AdminProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" 상품을 삭제하시겠습니까?\n연결된 번역, 이미지도 모두 삭제됩니다.`)) return;
        setDeleting(id);
        await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
        setDeleting(null);
        fetchProducts();
    };

    const filtered = products.filter(p => {
        const name = p.translations.find(t => t.langCode === 'ko')?.name || '';
        const q = search.toLowerCase();
        return !q || name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.brandName || '').toLowerCase().includes(q);
    });

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-500" />
                        상품 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">총 {products.length}개 상품</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchProducts} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button onClick={() => router.push('/admin/products/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" />
                        새 상품 등록
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="상품명, SKU, 브랜드 검색..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                />
            </div>

            {/* Product List */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">{search ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}</p>
                    {!search && (
                        <button onClick={() => router.push('/admin/products/new')}
                            className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            첫 상품 등록하기
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left text-xs font-medium text-gray-500 py-3 px-4">이미지</th>
                                <th className="text-left text-xs font-medium text-gray-500 py-3 px-4">상품명 / SKU</th>
                                <th className="text-left text-xs font-medium text-gray-500 py-3 px-4 hidden sm:table-cell">브랜드 / 용량</th>
                                <th className="text-left text-xs font-medium text-gray-500 py-3 px-4">가격</th>
                                <th className="text-left text-xs font-medium text-gray-500 py-3 px-4 hidden md:table-cell">재고</th>
                                <th className="text-left text-xs font-medium text-gray-500 py-3 px-4">상태</th>
                                <th className="text-right text-xs font-medium text-gray-500 py-3 px-4">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(p => {
                                const koName = p.translations.find(t => t.langCode === 'ko')?.name || p.sku;
                                const statusCfg = STATUS_LABEL[p.status] ?? STATUS_LABEL['INACTIVE']!;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={koName}
                                                    className="w-12 h-12 object-cover rounded-lg border border-gray-100 shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-900 text-sm line-clamp-1">{koName}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{p.sku}</div>
                                            {p._count.images > 0 && (
                                                <div className="text-xs text-blue-500 mt-0.5">🖼 이미지 {p._count.images}장</div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell">
                                            <div className="text-sm text-gray-700">{p.brandName || '-'}</div>
                                            <div className="text-xs text-gray-400">{p.volume || ''}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-semibold text-gray-900 text-sm">${Number(p.priceUsd).toFixed(2)}</span>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <span className={`text-sm font-medium ${p.stockQty === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                                                {p.stockQty}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="수정">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id, koName)}
                                                    disabled={deleting === p.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="삭제">
                                                    {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
