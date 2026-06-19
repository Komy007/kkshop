'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Loader2, RefreshCw, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderItem {
    productId: string;
    quantity: number;
    priceUsd: number;
    product: {
        brandName?: string;
        imageUrl?: string;
        translations: { name: string }[];
    } | null;
}

interface Order {
    id: string;
    status: string;
    totalUsd: number | string;
    createdAt: string;
    items: OrderItem[];
}

const STATUS_BADGE: Record<string, { en: string; color: string }> = {
    PENDING:   { en: 'Pending',   color: 'bg-yellow-100 text-yellow-700' },
    CONFIRMED: { en: 'Confirmed', color: 'bg-blue-100 text-blue-700'    },
    SHIPPING:  { en: 'Shipping',  color: 'bg-purple-100 text-purple-700' },
    DELIVERED: { en: 'Delivered', color: 'bg-green-100 text-green-700'  },
    CANCELLED: { en: 'Cancelled', color: 'bg-red-100 text-red-600'      },
};

const STATUS_TABS = ['', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
    '': 'All', PENDING: 'Pending', CONFIRMED: 'Confirmed',
    SHIPPING: 'Shipping', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const load = useCallback(async (p = page, s = status) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p) });
            if (s) params.set('status', s);
            const res = await fetch(`/api/seller/orders?${params}`);
            const data = await res.json();
            setOrders(Array.isArray(data.orders) ? data.orders : []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
        } finally {
            setLoading(false);
        }
    }, [page, status]);

    useEffect(() => { load(1, ''); }, []);

    const handleStatusChange = (s: string) => {
        setStatus(s);
        setPage(1);
        load(1, s);
    };

    const handlePageChange = (p: number) => {
        setPage(p);
        load(p, status);
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-teal-500" /> My Orders
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">{total} orders containing my products</p>
                </div>
                <button onClick={() => load(page, status)} title="Refresh" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {STATUS_TABS.map(s => (
                    <button key={s || 'all'} onClick={() => handleStatusChange(s)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                            status === s
                                ? 'bg-teal-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-800 font-bold">No Orders Found</p>
                    <p className="text-sm text-gray-400 mt-1">No orders match the current filter.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {orders.map(order => {
                            const badge = STATUS_BADGE[order.status] ?? { en: order.status, color: 'bg-gray-100 text-gray-600' };
                            return (
                                <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                                                {badge.en}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-50">
                                        {order.items.map((item, i) => {
                                            const name = item.product?.translations?.[0]?.name ?? 'Unknown Product';
                                            const img  = item.product?.imageUrl;
                                            return (
                                                <div key={i} className="flex items-center gap-4 px-5 py-4">
                                                    {img ? (
                                                        <img src={img} alt={name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Package className="w-6 h-6 text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                                                        {item.product?.brandName && (
                                                            <p className="text-xs text-gray-400">{item.product.brandName}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-bold text-gray-900 text-sm">${Number(item.priceUsd).toFixed(2)} × {item.quantity}</p>
                                                        <p className="text-xs text-teal-600 font-semibold mt-0.5">
                                                            ${(Number(item.priceUsd) * item.quantity).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="px-5 py-3 bg-gray-50 border-t flex items-center justify-end">
                                        <div className="font-black text-gray-900">
                                            Total: ${Number(order.totalUsd).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                {((page - 1) * 20 + 1)}–{Math.min(page * 20, total)} of {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold px-3 py-1 bg-teal-600 text-white rounded-lg">{page} / {totalPages}</span>
                                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
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
