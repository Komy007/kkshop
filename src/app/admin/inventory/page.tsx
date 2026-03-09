'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Package, RefreshCw, Loader2, AlertTriangle, TrendingUp, TrendingDown,
    Search, ClipboardList, ArrowUpCircle, ArrowDownCircle, History, X, CheckCircle,
} from 'lucide-react';

interface InventoryItem {
    id: string; sku: string; brandName: string | null; imageUrl: string | null;
    status: string; name: string; category: string | null;
    stockQty: number; stockAlertQty: number; isLowStock: boolean;
    priceUsd: string; costPrice: string | null; marginPct: number | null;
    updatedAt: string;
}

interface StockLog {
    id: string; productId: string; productSku: string; productName: string;
    productImage: string | null; changeQty: number; balanceAfter: number;
    reason: string; memo: string | null; orderId: string | null;
    createdBy: string | null; createdAt: string;
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
    RECEIVED:   { label: '입고',     color: 'bg-green-100 text-green-700' },
    SOLD:       { label: '판매',     color: 'bg-blue-100 text-blue-700' },
    RETURN:     { label: '반품/취소', color: 'bg-orange-100 text-orange-700' },
    DAMAGED:    { label: '파손/손실', color: 'bg-red-100 text-red-700' },
    ADJUSTMENT: { label: '재고실사', color: 'bg-purple-100 text-purple-700' },
    EXPIRED:    { label: '유통기한', color: 'bg-gray-100 text-gray-600' },
};

interface AdjustModalProps {
    product: InventoryItem;
    onClose: () => void;
    onDone: () => void;
}

function AdjustModal({ product, onClose, onDone }: AdjustModalProps) {
    const [reason, setReason] = useState('RECEIVED');
    const [qty, setQty] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isPositive = ['RECEIVED', 'RETURN'].includes(reason);
    const changeQty = qty ? (isPositive ? parseInt(qty) : -parseInt(qty)) : 0;
    const newStock = product.stockQty + changeQty;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!qty || parseInt(qty) <= 0) { setError('수량을 입력하세요'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, changeQty, reason, memo }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '실패');
            onDone();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-500" /> 재고 조정
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 py-4">
                    {/* Product info */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                        {product.imageUrl
                            ? <img src={product.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
                            : <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                        }
                        <div>
                            <div className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.sku} · 현재 재고: <span className={`font-bold ${product.isLowStock ? 'text-red-600' : 'text-gray-700'}`}>{product.stockQty}개</span></div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">변동 사유</label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(REASON_LABELS).filter(([k]) => k !== 'SOLD').map(([k, v]) => (
                                    <button key={k} type="button" onClick={() => setReason(k)}
                                        className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${reason === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                수량 ({isPositive ? '입고/추가' : '감소'})
                            </label>
                            <div className="relative">
                                <span className={`absolute left-3 top-2.5 text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {isPositive ? '+' : '−'}
                                </span>
                                <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl py-2.5 pl-8 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="수량 입력" />
                            </div>
                            {qty && parseInt(qty) > 0 && (
                                <div className={`mt-1.5 text-xs font-semibold ${newStock < 0 ? 'text-red-600' : newStock === 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    → 조정 후 재고: {newStock}개 {newStock < 0 ? '(불가)' : ''}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">메모 (선택)</label>
                            <input type="text" value={memo} onChange={e => setMemo(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="예: 한국 직배 2박스 입고" />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
                                취소
                            </button>
                            <button type="submit" disabled={loading || (!!qty && newStock < 0)}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                {loading ? '처리 중...' : '재고 조정'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function InventoryPage() {
    const [tab, setTab] = useState<'stock' | 'history'>('stock');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<StockLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showLowOnly, setShowLowOnly] = useState(false);
    const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/inventory');
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
    }, []);

    const fetchLogs = useCallback(async () => {
        const res = await fetch('/api/admin/stock-log?limit=200');
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
    }, []);

    useEffect(() => { fetchInventory(); fetchLogs(); }, [fetchInventory, fetchLogs]);

    const filtered = items.filter(item => {
        const q = search.toLowerCase();
        const matchSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || (item.brandName ?? '').toLowerCase().includes(q);
        const matchLow = !showLowOnly || item.isLowStock;
        return matchSearch && matchLow;
    });

    const lowStockCount = items.filter(i => i.isLowStock).length;
    const totalStock = items.reduce((s, i) => s + i.stockQty, 0);
    const soldOutCount = items.filter(i => i.stockQty === 0).length;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-blue-500" /> 재고 관리
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">상품별 재고 현황 확인 및 입고/손실 조정</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: '전체 상품', value: items.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: '총 재고', value: `${totalStock}개`, icon: ClipboardList, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: '⚠️ 저재고', value: lowStockCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: '품절', value: soldOutCount, icon: X, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
                {(['stock', 'history'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {t === 'stock' ? '📦 재고 현황' : '📋 변동 이력'}
                    </button>
                ))}
            </div>

            {tab === 'stock' && (
                <>
                    {/* Filters */}
                    <div className="flex gap-3 mb-4 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="상품명, SKU, 브랜드 검색..."
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
                        </div>
                        <button onClick={() => setShowLowOnly(p => !p)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showLowOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}>
                            <AlertTriangle className="w-4 h-4" /> 저재고만
                        </button>
                        <button onClick={() => { fetchInventory(); fetchLogs(); }}
                            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Stock table */}
                    {loading ? (
                        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                                        <th className="py-3 px-4">상품</th>
                                        <th className="py-3 px-4 hidden md:table-cell">카테고리</th>
                                        <th className="py-3 px-4">재고</th>
                                        <th className="py-3 px-4 hidden md:table-cell">판매가</th>
                                        <th className="py-3 px-4 hidden lg:table-cell">매입가</th>
                                        <th className="py-3 px-4 hidden lg:table-cell">마진</th>
                                        <th className="py-3 px-4 text-right">조정</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-gray-400">
                                                <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                                {search ? '검색 결과가 없습니다' : '상품이 없습니다'}
                                            </td>
                                        </tr>
                                    ) : filtered.map(item => (
                                        <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.isLowStock ? 'bg-amber-50/40' : ''}`}>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {item.imageUrl
                                                        ? <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                                                        : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-4 h-4 text-gray-300" /></div>
                                                    }
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-sm line-clamp-1 max-w-[180px]">{item.name}</div>
                                                        <div className="text-xs text-gray-400">{item.sku}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <span className="text-xs text-gray-500">{item.category ?? '미분류'}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${item.stockQty === 0 ? 'text-red-600' : item.isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                                                        {item.stockQty}
                                                    </span>
                                                    {item.isLowStock && item.stockQty > 0 && (
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                    )}
                                                    {item.stockQty === 0 && (
                                                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">품절</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-400">알림: {item.stockAlertQty}개</div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <span className="text-sm font-semibold text-gray-800">${Number(item.priceUsd).toFixed(2)}</span>
                                            </td>
                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                {item.costPrice
                                                    ? <span className="text-sm text-gray-600">${Number(item.costPrice).toFixed(2)}</span>
                                                    : <span className="text-xs text-gray-300">미입력</span>
                                                }
                                            </td>
                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                {item.marginPct !== null ? (
                                                    <span className={`text-sm font-bold ${item.marginPct >= 30 ? 'text-green-600' : item.marginPct >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {item.marginPct}%
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button onClick={() => setAdjustTarget(item)}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors">
                                                    조정
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {tab === 'history' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                                <th className="py-3 px-4">상품</th>
                                <th className="py-3 px-4">사유</th>
                                <th className="py-3 px-4">변동</th>
                                <th className="py-3 px-4">조정 후</th>
                                <th className="py-3 px-4 hidden md:table-cell">메모</th>
                                <th className="py-3 px-4 hidden md:table-cell">처리자</th>
                                <th className="py-3 px-4">일시</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-gray-400">
                                        <History className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                        재고 변동 이력이 없습니다
                                    </td>
                                </tr>
                            ) : logs.map(log => {
                                const reasonInfo = REASON_LABELS[log.reason] ?? { label: log.reason, color: 'bg-gray-100 text-gray-600' };
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {log.productImage
                                                    ? <img src={log.productImage} className="w-8 h-8 rounded object-cover" />
                                                    : <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center"><Package className="w-3 h-3 text-gray-300" /></div>
                                                }
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900 line-clamp-1 max-w-[140px]">{log.productName}</div>
                                                    <div className="text-[10px] text-gray-400">{log.productSku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${reasonInfo.color}`}>
                                                {reasonInfo.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className={`flex items-center gap-1 text-sm font-bold ${log.changeQty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {log.changeQty > 0 ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                                                {log.changeQty > 0 ? '+' : ''}{log.changeQty}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-semibold text-gray-800">{log.balanceAfter}개</span>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <span className="text-xs text-gray-500">{log.memo ?? '—'}</span>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <span className="text-xs text-gray-400">{log.createdBy ?? '—'}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-xs text-gray-500">
                                                {new Date(log.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                {new Date(log.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {adjustTarget && (
                <AdjustModal
                    product={adjustTarget}
                    onClose={() => setAdjustTarget(null)}
                    onDone={async () => {
                        setAdjustTarget(null);
                        await fetchInventory();
                        await fetchLogs();
                    }}
                />
            )}
        </div>
    );
}
