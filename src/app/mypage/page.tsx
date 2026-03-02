'use client';

import React, { useState } from 'react';
import { Package, Heart, Clock, LogOut, ChevronRight, ShoppingBag } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import Footer from '@/components/Footer';

type TabKey = 'orders' | 'wishlist' | 'recent';

// Mock order data — will be replaced with real API data
const mockOrders = [
    { id: 'ORD-20260227-001', date: '2026-02-27', total: 45.99, status: 'paid' as const, items: 3 },
    { id: 'ORD-20260225-002', date: '2026-02-25', total: 89.50, status: 'shipping' as const, items: 5 },
    { id: 'ORD-20260220-003', date: '2026-02-20', total: 32.00, status: 'delivered' as const, items: 2 },
];

export default function MyPage() {
    const t = useTranslations();
    const [activeTab, setActiveTab] = useState<TabKey>('orders');

    // Mock user — will use real session later
    const isLoggedIn = true;
    const user = { name: 'Premium Member', email: 'user@example.com' };

    const statusColors: Record<string, string> = {
        paid: 'bg-cyan-50 text-cyan-600 border-cyan-200',
        preparing: 'bg-amber-50 text-amber-600 border-amber-200',
        shipping: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
        delivered: 'bg-green-50 text-green-600 border-green-200',
    };

    const tabs: { key: TabKey; icon: React.ElementType; label: string }[] = [
        { key: 'orders', icon: Package, label: t.mypage.orders },
        { key: 'wishlist', icon: Heart, label: t.mypage.wishlist },
        { key: 'recent', icon: Clock, label: t.mypage.recentlyViewed },
    ];

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-4">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
                <h1 className="text-xl font-extrabold text-black">{t.mypage.loginRequired}</h1>
                <p className="text-gray-500 text-sm text-center font-medium">{t.mypage.loginDesc}</p>
                <a
                    href="/login"
                    className="px-10 py-3.5 rounded-xl bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary/90 transition-colors shadow-sm"
                >
                    {t.auth.loginButton}
                </a>
            </div>
        );
    }

    const formatUsd = (price: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-inner">
                            <span className="text-white font-black text-2xl">{user.name[0]}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-black tracking-tight">{user.name}</h1>
                            <p className="text-gray-500 font-medium text-sm mt-0.5">{user.email}</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-bold bg-white shadow-sm">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.mypage.logout}</span>
                    </button>
                </div>

                {/* Order Status Summary (Quick Glance) */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    {(['paid', 'preparing', 'shipping', 'delivered'] as const).map((status) => {
                        const count = mockOrders.filter((o) => o.status === status).length;
                        return (
                            <button
                                key={status}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-200 hover:border-brand-primary/50 hover:shadow-md transition-all shadow-sm"
                            >
                                <span className={`text-2xl font-black ${count > 0 ? (statusColors[status]?.split(' ')[1] ?? 'text-black') : 'text-gray-300'}`}>
                                    {count}
                                </span>
                                <span className="text-[12px] text-gray-600 font-bold text-center leading-tight">
                                    {t.mypage.orderStatus[status]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <nav className="flex border-b border-gray-100 mb-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === tab.key
                                        ? 'border-brand-primary text-black bg-gray-50/50'
                                        : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-brand-primary' : ''}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Tab Content */}
                    <div className="min-h-[300px] p-4 sm:p-6 bg-gray-50/30">
                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="space-y-4 animate-fade-in">
                                {mockOrders.length === 0 ? (
                                    <div className="text-center py-16">
                                        <p className="text-gray-500 font-bold">{t.mypage.emptyOrders}</p>
                                    </div>
                                ) : (
                                    mockOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="p-5 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white shadow-sm cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                                <div>
                                                    <p className="text-sm font-extrabold text-black group-hover:text-brand-primary transition-colors">{order.id}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">{order.date}</p>
                                                </div>
                                                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${statusColors[order.status]}`}>
                                                    {t.mypage.orderStatus[order.status]}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 font-bold">{order.items} items</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-[#E52528] text-lg">{formatUsd(order.total)}</span>
                                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Wishlist Tab */}
                        {activeTab === 'wishlist' && (
                            <div className="text-center py-20 animate-fade-in bg-white rounded-2xl border border-gray-100">
                                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">{t.mypage.emptyWishlist}</p>
                            </div>
                        )}

                        {/* Recently Viewed Tab */}
                        {activeTab === 'recent' && (
                            <div className="text-center py-20 animate-fade-in bg-white rounded-2xl border border-gray-100">
                                <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">{t.common.noResults}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
