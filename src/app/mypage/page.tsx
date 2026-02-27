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
        paid: 'bg-vivid-cyan/10 text-vivid-cyan',
        preparing: 'bg-vivid-yellow/10 text-vivid-yellow',
        shipping: 'bg-brand-primary/10 text-brand-primary',
        delivered: 'bg-vivid-green/10 text-vivid-green',
    };

    const tabs: { key: TabKey; icon: React.ElementType; label: string }[] = [
        { key: 'orders', icon: Package, label: t.mypage.orders },
        { key: 'wishlist', icon: Heart, label: t.mypage.wishlist },
        { key: 'recent', icon: Clock, label: t.mypage.recentlyViewed },
    ];

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-white/20" />
                </div>
                <h1 className="text-xl font-bold text-white">{t.mypage.loginRequired}</h1>
                <p className="text-white/40 text-sm text-center">{t.mypage.loginDesc}</p>
                <a
                    href="/login"
                    className="px-8 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-primary/90 transition-colors"
                >
                    {t.auth.loginButton}
                </a>
            </div>
        );
    }

    const formatUsd = (price: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    return (
        <>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                            <span className="text-white font-bold text-xl">{user.name[0]}</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{user.name}</h1>
                            <p className="text-white/40 text-sm">{user.email}</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm">
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
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <span className={`text-2xl font-black ${statusColors[status]?.split(' ')[1] ?? 'text-white'}`}>
                                    {count}
                                </span>
                                <span className="text-[11px] text-white/50 font-medium text-center leading-tight">
                                    {t.mypage.orderStatus[status]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tabs */}
                <nav className="flex border-b border-white/10 mb-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === tab.key
                                        ? 'border-brand-primary text-white'
                                        : 'border-transparent text-white/40 hover:text-white/70'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="space-y-4 animate-fade-in">
                            {mockOrders.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-white/40">{t.mypage.emptyOrders}</p>
                                </div>
                            ) : (
                                mockOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="p-4 sm:p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors bg-white/[0.02]"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-bold text-white">{order.id}</p>
                                                <p className="text-xs text-white/40 mt-0.5">{order.date}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[order.status]}`}>
                                                {t.mypage.orderStatus[order.status]}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-white/50">{order.items} items</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">{formatUsd(order.total)}</span>
                                                <ChevronRight className="w-4 h-4 text-white/30" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Wishlist Tab */}
                    {activeTab === 'wishlist' && (
                        <div className="text-center py-16 animate-fade-in">
                            <Heart className="w-12 h-12 mx-auto text-white/10 mb-4" />
                            <p className="text-white/40">{t.mypage.emptyWishlist}</p>
                        </div>
                    )}

                    {/* Recently Viewed Tab */}
                    {activeTab === 'recent' && (
                        <div className="text-center py-16 animate-fade-in">
                            <Clock className="w-12 h-12 mx-auto text-white/10 mb-4" />
                            <p className="text-white/40">{t.common.noResults}</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
