'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ShoppingCart, Loader2, RefreshCw, Package } from 'lucide-react';

interface SellerNotif {
    id:         string;
    orderId:    string;
    title:      string;
    body:       string;
    isRead:     boolean;
    emailSent:  boolean;
    amountUsd:  number;
    createdAt:  string;
}

export default function SellerNotificationsPage() {
    const [notifications, setNotifications] = useState<SellerNotif[]>([]);
    const [unreadCount,   setUnreadCount]   = useState(0);
    const [loading,       setLoading]       = useState(true);
    const [markingAll,    setMarkingAll]    = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await fetch('/api/seller/notifications');
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unreadCount ?? 0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const markAllRead = async () => {
        setMarkingAll(true);
        try {
            await fetch('/api/seller/notifications', {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ all: true }),
            });
            setNotifications(n => n.map(x => ({ ...x, isRead: true })));
            setUnreadCount(0);
        } finally {
            setMarkingAll(false);
        }
    };

    const markRead = async (id: string) => {
        await fetch('/api/seller/notifications', {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ ids: [id] }),
        });
        setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
        setUnreadCount(c => Math.max(0, c - 1));
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-teal-500" />
                        Notifications
                        <span className="text-base font-normal text-gray-400">· 알림</span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {unreadCount > 0
                            ? <span className="text-teal-600 font-semibold">{unreadCount} unread · 미읽음</span>
                            : 'All caught up · 모두 읽음'}
                        {' '}&middot; {notifications.length} total
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} disabled={markingAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors disabled:opacity-50">
                            <CheckCheck className="w-3.5 h-3.5" />
                            {markingAll ? '...' : 'Mark all read · 모두 읽음'}
                        </button>
                    )}
                    <button onClick={load} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 안내 */}
            <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600">
                알림은 주문이 결제 확정(Confirmed)될 때 생성됩니다. 이메일도 동시에 발송됩니다.
                <span className="opacity-70 ml-1">· Notifications are created when an order payment is confirmed.</span>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-800 font-bold">No notifications yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                        아직 알림이 없습니다. 주문이 확정되면 여기에 표시됩니다.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map(n => (
                        <div key={n.id}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                                !n.isRead
                                    ? 'border-teal-200 shadow-teal-50'
                                    : 'border-gray-100 opacity-75'
                            }`}>
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${!n.isRead ? 'bg-teal-100' : 'bg-gray-100'}`}>
                                        <ShoppingCart className={`w-4 h-4 ${!n.isRead ? 'text-teal-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm font-bold leading-tight ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {n.title}
                                            </p>
                                            {!n.isRead && (
                                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.body}</p>

                                        {/* 금액 */}
                                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                                            <Package className="w-3 h-3 text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-700">
                                                ${Number(n.amountUsd).toFixed(2)}
                                            </span>
                                            <span className="text-[10px] text-emerald-500">· 내 상품 합계</span>
                                        </div>

                                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                                            <span className="text-[11px] text-gray-400">
                                                {new Date(n.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </span>
                                            <Link
                                                href="/seller/orders?status=CONFIRMED"
                                                onClick={() => !n.isRead && markRead(n.id)}
                                                className="text-[11px] font-semibold text-teal-600 underline hover:text-teal-800">
                                                View confirmed orders · 확정 주문 보기 →
                                            </Link>
                                            {!n.isRead && (
                                                <button onClick={() => markRead(n.id)}
                                                    className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                                                    Mark read · 읽음
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
