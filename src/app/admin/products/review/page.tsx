'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, RefreshCw, ImageIcon, Search } from 'lucide-react';

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
}

export default function AdminPendingProductsPage() {
    const [products, setProducts] = useState<PendingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    const fetch_ = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/products?approvalStatus=' + filter);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetch_(); }, [fetch_]);

    const handleApproval = async (id: string, status: 'APPROVED' | 'REJECTED', rejectReason?: string) => {
        setProcessing(id);
        await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                approvalStatus: status,
                status: status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE',
                adminNote: rejectReason || null,
            }),
        });
        setProcessing(null);
        fetch_();
    };

    const approve = (id: string) => handleApproval(id, 'APPROVED');
    const reject = (id: string) => {
        const reason = prompt('반려 사유를 입력하세요 (판매자에게 표시됩니다):');
        if (reason !== null) handleApproval(id, 'REJECTED', reason);
    };

    const filtered = products.filter(p => {
        const name = p.translations.find(t => t.langCode === 'ko')?.name || '';
        const q = search.toLowerCase();
        return !q || name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.supplier?.companyName || '').toLowerCase().includes(q);
    });

    const count = (s: string) => products.filter(p => p.approvalStatus === s).length;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-yellow-500" /> 상품 검수 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">판매자가 등록한 상품을 검토하고 승인/반려합니다</p>
                </div>
                <button onClick={fetch_} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {([
                    { key: 'PENDING', label: '🟡 검수 대기', color: 'text-yellow-700 bg-yellow-50 border-yellow-300' },
                    { key: 'APPROVED', label: '🟢 승인됨', color: 'text-green-700 bg-green-50 border-green-300' },
                    { key: 'REJECTED', label: '🔴 반려됨', color: 'text-red-700 bg-red-50 border-red-300' },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === t.key ? t.color : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="상품명, SKU, 공급업체 검색..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white shadow-sm" />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">{filter === 'PENDING' ? '🎉 검수 대기 상품이 없습니다!' : '해당 상품이 없습니다.'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(p => {
                        const name = p.translations.find(t => t.langCode === 'ko')?.name || p.sku;
                        const isProcessing = processing === p.id;
                        return (
                            <div key={p.id} className={`bg-white rounded-xl border shadow-sm flex items-center gap-4 p-4 ${filter === 'PENDING' ? 'border-yellow-200' : 'border-gray-100'}`}>
                                {p.imageUrl
                                    ? <img src={p.imageUrl} alt={name} className="w-16 h-16 object-cover rounded-xl border flex-shrink-0" />
                                    : <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                                }
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900">{name}</div>
                                    <div className="text-xs text-gray-400">{p.sku} · ${Number(p.priceUsd).toFixed(2)}</div>
                                    <div className="text-xs text-blue-600 mt-0.5">공급업체: {p.supplier?.companyName || '-'}</div>
                                    <div className="text-xs text-gray-400">등록일: {new Date(p.createdAt).toLocaleDateString('ko-KR')}</div>
                                </div>
                                {filter === 'PENDING' && (
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        <button onClick={() => approve(p.id)} disabled={isProcessing}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            승인
                                        </button>
                                        <button onClick={() => reject(p.id)} disabled={isProcessing}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 border border-red-200">
                                            <XCircle className="w-4 h-4" />
                                            반려
                                        </button>
                                    </div>
                                )}
                                {filter !== 'PENDING' && (
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${filter === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                        {filter === 'APPROVED' ? '✅ 승인됨' : '❌ 반려됨'}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
