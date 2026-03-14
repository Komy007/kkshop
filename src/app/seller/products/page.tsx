'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, Plus, Loader2, RefreshCw, Clock, CheckCircle, XCircle, Search, ImageIcon, Edit3, AlertCircle } from 'lucide-react';

interface Product {
    id: string;
    sku: string;
    priceUsd: string;
    stockQty: number;
    status: string;
    approvalStatus: string;
    isNew: boolean;
    isHotSale: boolean;
    imageUrl?: string;
    brandName?: string;
    createdAt: string;
    translations: { langCode: string; name: string }[];
}

const APPROVAL_BADGE: Record<string, { label: string; icon: any; className: string }> = {
    PENDING: { label: '검수 대기중', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
    APPROVED: { label: '판매 승인됨', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
    REJECTED: { label: '반려됨', icon: XCircle, className: 'bg-red-100 text-red-600' },
};

export default function SellerProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

    const fetch_ = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/seller/products');
        const data = await res.json();
        if (!res.ok) {
            setError(data?.error || '상품 목록을 불러오지 못했습니다.');
            setProducts([]);
        } else {
            setProducts(Array.isArray(data) ? data : []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetch_(); }, [fetch_]);

    const filtered = products.filter(p => {
        const name = p.translations.find(t => t.langCode === 'ko')?.name || '';
        const q = search.toLowerCase();
        const matchSearch = !q || name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
        const matchTab = tab === 'ALL' || p.approvalStatus === tab;
        return matchSearch && matchTab;
    });

    const count = (s: string) => s === 'ALL' ? products.length : products.filter(p => p.approvalStatus === s).length;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-teal-500" /> 내 상품
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">총 {products.length}개 상품</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetch_} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
                    <Link href="/seller/products/new" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-sm">
                        <Plus className="w-4 h-4" /> 상품 등록
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
                    <button key={s} onClick={() => setTab(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${tab === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'}`}>
                        {s === 'ALL' ? '전체' : APPROVAL_BADGE[s]?.label} ({count(s)})
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="상품명 또는 SKU 검색..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm" />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border gap-3">
                    <AlertCircle className="w-12 h-12 text-yellow-400" />
                    <p className="text-gray-700 font-semibold">상품 목록을 불러올 수 없습니다</p>
                    <p className="text-sm text-gray-400">{error === 'No supplier profile' ? '공급업체 프로필이 등록되지 않았습니다. 관리자에게 문의하세요.' : error}</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">등록된 상품이 없습니다.</p>
                    <Link href="/seller/products/new" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700">
                        <Plus className="w-4 h-4" /> 첫 상품 등록하기
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b text-xs text-gray-500 font-medium">
                                <th className="py-3 px-4">이미지</th>
                                <th className="py-3 px-4">상품명</th>
                                <th className="py-3 px-4">가격/재고</th>
                                <th className="py-3 px-4">검수 상태</th>
                                <th className="py-3 px-4 hidden sm:table-cell">등록일</th>
                                <th className="py-3 px-4">수정</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(p => {
                                const name = p.translations.find(t => t.langCode === 'ko')?.name || p.sku;
                                const badge = APPROVAL_BADGE[p.approvalStatus] ?? { label: '대기중', icon: Clock, className: 'bg-gray-100 text-gray-500' };

                                const BadgeIcon = badge.icon;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            {p.imageUrl
                                                ? <img src={p.imageUrl} alt={name} className="w-12 h-12 object-cover rounded-lg border" />
                                                : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-900 text-sm">{name}</div>
                                            <div className="text-xs text-gray-400">{p.sku}</div>
                                            {p.approvalStatus === 'REJECTED' && (
                                                <div className="text-xs text-red-500 mt-0.5">반려 사유 확인 후 재등록하세요</div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-sm">${Number(p.priceUsd).toFixed(2)}</div>
                                            <div className={`text-xs ${p.stockQty === 0 ? 'text-red-500' : 'text-gray-400'}`}>재고 {p.stockQty}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                                                <BadgeIcon className="w-3 h-3" />{badge.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell text-xs text-gray-400">
                                            {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link href={`/seller/products/${p.id}/edit`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-600 rounded-lg transition-colors">
                                                <Edit3 className="w-3 h-3" />수정
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                <strong>📋 검수 안내:</strong> 등록된 상품은 관리자 검수 후 판매됩니다. 검수는 보통 1~2 영업일이 소요됩니다.
            </div>
        </div>
    );
}
