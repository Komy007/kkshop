'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Loader2, RefreshCw, Package } from 'lucide-react';

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
    customerName: string;
    customerPhone: string;
    address: string;
    status: string;
    totalUsd: number | string;
    createdAt: string;
    items: OrderItem[];
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    PENDING:   { label: '결제대기', color: 'bg-yellow-100 text-yellow-700' },
    CONFIRMED: { label: '주문확인', color: 'bg-blue-100 text-blue-700' },
    SHIPPING:  { label: '배송중',   color: 'bg-purple-100 text-purple-700' },
    DELIVERED: { label: '배송완료', color: 'bg-green-100 text-green-700' },
    CANCELLED: { label: '취소됨',   color: 'bg-red-100 text-red-600' },
};

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/seller/orders');
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-teal-500" /> 주문 현황
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">내 상품이 포함된 주문 목록 (최근 50건)</p>
                </div>
                <button onClick={load} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">아직 주문이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => {
                        const badge = STATUS_BADGE[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' };
                        return (
                            <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Order Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {/* Order Items (only items from this supplier) */}
                                <div className="divide-y divide-gray-50">
                                    {order.items.map((item, i) => {
                                        const name = item.product?.translations?.[0]?.name ?? '상품명 없음';
                                        const img = item.product?.imageUrl;
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
                                                        소계 ${(Number(item.priceUsd) * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Order Footer */}
                                <div className="px-5 py-3 bg-gray-50 border-t flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <div className="text-gray-500 text-xs">
                                        <span className="font-semibold text-gray-700">{order.customerName}</span>
                                        {' · '}{order.customerPhone}
                                        {' · '}{order.address}
                                    </div>
                                    <div className="font-black text-gray-900">
                                        합계 ${Number(order.totalUsd).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
