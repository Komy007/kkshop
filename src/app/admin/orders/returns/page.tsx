'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Package } from 'lucide-react';

interface ReturnOrder {
    id: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    totalUsd: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    items: Array<{
        id: string;
        quantity: number;
        priceUsd: number;
        product: { nameEn: string; nameKo: string; imageUrl: string | null };
    }>;
    refundReason?: string;
}

const STATUS_COLORS: Record<string, string> = {
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED:  'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
    CANCELLED: 'Cancelled',
    REFUNDED:  'Refunded',
    DELIVERED: 'Delivered (Return Requested)',
};

export default function ReturnsPage() {
    const [orders, setOrders]         = useState<ReturnOrder[]>([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [expanded, setExpanded]     = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [page, setPage]             = useState(1);
    const [total, setTotal]           = useState(0);
    const PAGE_SIZE = 20;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                returnMode: '1',
                page: String(page),
                pageSize: String(PAGE_SIZE),
                ...(search ? { search } : {}),
                ...(filterStatus !== 'ALL' ? { status: filterStatus } : {}),
            });
            const res  = await fetch(`/api/admin/returns?${params}`);
            const data = await res.json();
            setOrders(data.orders ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleAction = async (orderId: string, action: 'REFUNDED' | 'CANCELLED') => {
        setProcessing(orderId);
        try {
            await fetch('/api/admin/returns', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: action }),
            });
            await fetchOrders();
        } finally {
            setProcessing(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Returns &amp; Refunds</h1>
                    <p className="text-sm text-gray-500 mt-0.5">반품 / 환불 관리</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all"
                >
                    <RefreshCcw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Returns',    value: total,                                     color: 'text-slate-700' },
                    { label: 'Refunded',         value: orders.filter(o => o.status === 'REFUNDED').length,  color: 'text-purple-600' },
                    { label: 'Cancelled',        value: orders.filter(o => o.status === 'CANCELLED').length, color: 'text-red-600' },
                    { label: 'Refund Amount',    value: `$${orders.filter(o => o.status === 'REFUNDED').reduce((s, o) => s + o.totalUsd, 0).toFixed(2)}`, color: 'text-green-600' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by customer name or email..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'CANCELLED', 'REFUNDED'].map(s => (
                        <button
                            key={s}
                            onClick={() => { setFilterStatus(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                filterStatus === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {s === 'ALL' ? 'All' : STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading...</div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <Package className="w-10 h-10 opacity-30" />
                        <p className="text-sm">No return/refund orders found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {orders.map(order => (
                            <div key={order.id}>
                                {/* Row */}
                                <div
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900 text-sm truncate">{order.customerName}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                                {STATUS_LABELS[order.status] ?? order.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{order.customerEmail} · {new Date(order.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">${order.totalUsd.toFixed(2)}</div>
                                    <div className="text-slate-400">
                                        {expanded === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {expanded === order.id && (
                                    <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100">
                                        <div className="pt-4 grid md:grid-cols-2 gap-6">
                                            {/* Order Items */}
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Order Items</h3>
                                                <div className="space-y-2">
                                                    {order.items.map(item => (
                                                        <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                                                            {item.product.imageUrl && (
                                                                <img src={item.product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 truncate">{item.product.nameEn}</div>
                                                                <div className="text-xs text-slate-500">Qty: {item.quantity} · ${item.priceUsd.toFixed(2)} each</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Customer & Actions */}
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Customer Info</h3>
                                                    <div className="bg-white rounded-xl p-3 shadow-sm text-sm space-y-1">
                                                        <div><span className="text-slate-500">Phone:</span> {order.customerPhone}</div>
                                                        <div><span className="text-slate-500">Address:</span> {order.address}</div>
                                                    </div>
                                                </div>

                                                {order.status !== 'REFUNDED' && (
                                                    <div>
                                                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Actions</h3>
                                                        <div className="flex gap-2">
                                                            <button
                                                                disabled={!!processing}
                                                                onClick={() => handleAction(order.id, 'REFUNDED')}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                {processing === order.id ? 'Processing...' : 'Approve Refund'}
                                                            </button>
                                                            <button
                                                                disabled={!!processing}
                                                                onClick={() => handleAction(order.id, 'CANCELLED')}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {order.status === 'REFUNDED' && (
                                                    <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-xl text-sm text-purple-700 font-semibold">
                                                        <CheckCircle className="w-4 h-4" /> Refund Approved
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                        <span className="text-xs text-slate-500">{total} total records</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Prev</button>
                            <span className="px-3 py-1.5 text-xs text-slate-600">{page} / {totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
