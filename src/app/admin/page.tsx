'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    Package, Users, ShoppingCart, Store, TrendingUp,
    Plus, Eye, Settings, ArrowRight, Sparkles, BarChart3,
    CheckCircle, Clock, AlertCircle, DollarSign, ClipboardList,
    RotateCcw, MessageSquare, Image, FileUp, Banknote, Search, Star,
    XCircle, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── 인터페이스 ──────────────────────────────────────────────────────────────────
interface Stats {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippingOrders: number;
    deliveredOrders: number;
    totalMembers: number;
    totalSuppliers: number;
    pendingSuppliers: number;
    newProductsCount: number;
    hotSaleCount: number;
    lowStockCount: number;
    soldOutCount: number;
    // 매출 KPI
    todayRevenue: number;
    monthRevenue: number;
    avgOrderValue: number;
    // 처리 대기 큐
    pendingQaCount: number;
    pendingReviewCount: number;
    pendingReturnCount: number;
}

interface RecentOrder {
    id: string;
    customerName: string;
    email: string;
    totalUsd: number;
    status: string;
    createdAt: string;
}

// ── 상수 ──────────────────────────────────────────────────────────────────────
const ORDER_STATUS: Record<string, { label: string; color: string }> = {
    PENDING:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700' },
    CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700'   },
    SHIPPING:  { label: 'Shipping',  color: 'bg-indigo-100 text-indigo-700'},
    DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-600'     },
    REFUNDED:  { label: 'Refunded',  color: 'bg-gray-100 text-gray-600'   },
};

type ActionItem = {
    href: string;
    icon: React.ReactNode;
    color: string;
    label: string;
    desc: string;
    superOnly: boolean;
    pinned: boolean;
};

const ALL_ACTIONS: ActionItem[] = [
    {
        href: '/admin/products/new',
        icon: <Plus className="w-5 h-5 text-rose-600" />,
        color: 'bg-rose-50',
        label: 'Add New Product',
        desc: 'Register product with auto-translation (KO/EN/KM/ZH)',
        superOnly: false, pinned: true,
    },
    {
        href: '/admin/orders',
        icon: <ShoppingCart className="w-5 h-5 text-green-600" />,
        color: 'bg-green-50',
        label: 'Manage Orders',
        desc: 'Update order status, add shipment tracking',
        superOnly: false, pinned: true,
    },
    {
        href: '/admin/products',
        icon: <Package className="w-5 h-5 text-blue-600" />,
        color: 'bg-blue-50',
        label: 'Manage Products',
        desc: 'Edit, delete, categorize, toggle Hot Sale & New',
        superOnly: false, pinned: true,
    },
    {
        href: '/admin/inventory',
        icon: <ClipboardList className="w-5 h-5 text-orange-600" />,
        color: 'bg-orange-50',
        label: 'Inventory',
        desc: 'Stock levels, adjust in/out, view history',
        superOnly: false, pinned: true,
    },
    {
        href: '/admin/customers',
        icon: <Users className="w-5 h-5 text-purple-600" />,
        color: 'bg-purple-50',
        label: 'Customers',
        desc: 'View members, manage roles & reset passwords',
        superOnly: false, pinned: true,
    },
    {
        href: '/admin/reviews',
        icon: <Eye className="w-5 h-5 text-yellow-600" />,
        color: 'bg-yellow-50',
        label: 'Review Moderation',
        desc: 'Approve or reject customer product reviews',
        superOnly: false, pinned: true,
    },
    {
        href: '/admin/support',
        icon: <MessageSquare className="w-5 h-5 text-sky-600" />,
        color: 'bg-sky-50',
        label: 'CS Support (Q&A)',
        desc: 'Answer pending product Q&A tickets',
        superOnly: false, pinned: true,
    },
    {
        href: '/admin/coupons',
        icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
        color: 'bg-emerald-50',
        label: 'Coupons & Discounts',
        desc: 'Create coupon codes (% off, fixed, free shipping)',
        superOnly: false, pinned: true,
    },
    // ── More tools (pinned: false) ─────────────────────────────────────────────
    {
        href: '/admin/categories',
        icon: <Settings className="w-5 h-5 text-gray-600" />,
        color: 'bg-gray-50',
        label: 'Categories',
        desc: 'Edit multilingual category names and order',
        superOnly: false, pinned: false,
    },
    {
        href: '/admin/suppliers',
        icon: <Store className="w-5 h-5 text-teal-600" />,
        color: 'bg-teal-50',
        label: 'Seller Management',
        desc: 'Approve sellers, adjust commission rates',
        superOnly: false, pinned: false,
    },
    {
        href: '/admin/orders/returns',
        icon: <RotateCcw className="w-5 h-5 text-orange-600" />,
        color: 'bg-orange-50',
        label: 'Returns & Refunds',
        desc: 'Review cancelled orders, approve or reject refunds',
        superOnly: false, pinned: false,
    },
    {
        href: '/admin/marketing/banners',
        icon: <Image className="w-5 h-5 text-pink-600" />,
        color: 'bg-pink-50',
        label: 'Homepage Banners',
        desc: 'Add, reorder, and toggle hero banner slides',
        superOnly: false, pinned: false,
    },
    {
        href: '/admin/products/bulk-import',
        icon: <FileUp className="w-5 h-5 text-violet-600" />,
        color: 'bg-violet-50',
        label: 'Bulk Import',
        desc: 'Upload a CSV to register many products at once',
        superOnly: false, pinned: false,
    },
    {
        href: '/admin/change-password',
        icon: <Settings className="w-5 h-5 text-red-600" />,
        color: 'bg-red-50',
        label: 'Change Password',
        desc: 'Reset admin account password directly',
        superOnly: false, pinned: false,
    },
    {
        href: '/admin/suppliers/payouts',
        icon: <Banknote className="w-5 h-5 text-teal-600" />,
        color: 'bg-teal-50',
        label: 'Supplier Payouts',
        desc: 'Revenue breakdown, commission, and net payout per supplier',
        superOnly: true, pinned: false,
    },
    {
        href: '/admin/suppliers/commission',
        icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
        color: 'bg-emerald-50',
        label: 'Commission Rules',
        desc: 'Set global and per-supplier commission rates',
        superOnly: true, pinned: false,
    },
    {
        href: '/admin/settings/seo',
        icon: <Search className="w-5 h-5 text-indigo-600" />,
        color: 'bg-indigo-50',
        label: 'SEO Settings',
        desc: 'Site meta, OG image, Google Analytics & verification',
        superOnly: true, pinned: false,
    },
    {
        href: '/admin/settings/points',
        icon: <Star className="w-5 h-5 text-yellow-600" />,
        color: 'bg-yellow-50',
        label: 'Points & Rewards',
        desc: 'Earn rate, redeem rate, expiry, welcome & review bonuses',
        superOnly: true, pinned: false,
    },
    {
        href: '/admin/landing-settings',
        icon: <TrendingUp className="w-5 h-5 text-pink-600" />,
        color: 'bg-pink-50',
        label: 'Landing Page Settings',
        desc: 'Edit top banners, trust badges, promotions',
        superOnly: true, pinned: false,
    },
    {
        href: '/admin/settings/roles',
        icon: <Eye className="w-5 h-5 text-orange-600" />,
        color: 'bg-orange-50',
        label: 'Admin Role Settings',
        desc: 'Assign ADMIN / SUPERADMIN roles',
        superOnly: true, pinned: false,
    },
    {
        href: '/admin/settings/email',
        icon: <Settings className="w-5 h-5 text-blue-500" />,
        color: 'bg-blue-50',
        label: 'Email Settings',
        desc: 'Configure SMTP for order notifications',
        superOnly: true, pinned: false,
    },
];

// ── 금액 포맷 헬퍼 ──────────────────────────────────────────────────────────────
const usd = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// 상대 시간 (최근 주문용)
function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { data: session } = useSession();
    const role        = (session?.user as any)?.role ?? 'ADMIN';
    const isSuperAdmin = role === 'SUPERADMIN';

    const [stats,        setStats]        = useState<Stats | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState<string | null>(null);
    const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
    const [showMore,     setShowMore]     = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, ordersRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/recent-orders'),
            ]);
            if (!statsRes.ok)  throw new Error(`Stats fetch failed (${statsRes.status})`);
            if (!ordersRes.ok) throw new Error(`Orders fetch failed (${ordersRes.status})`);

            const data   = await statsRes.json();
            const orders = await ordersRes.json();

            setStats({
                totalProducts:    data.totalProducts    ?? 0,
                activeProducts:   data.activeProducts   ?? 0,
                totalOrders:      data.totalOrders      ?? 0,
                pendingOrders:    data.pendingOrders    ?? 0,
                confirmedOrders:  data.confirmedOrders  ?? 0,
                shippingOrders:   data.shippingOrders   ?? 0,
                deliveredOrders:  data.deliveredOrders  ?? 0,
                totalMembers:     data.totalMembers     ?? 0,
                totalSuppliers:   data.totalSuppliers   ?? 0,
                pendingSuppliers: data.pendingSuppliers ?? 0,
                newProductsCount: data.newProductsCount ?? 0,
                hotSaleCount:     data.hotSaleCount     ?? 0,
                lowStockCount:    data.lowStockCount    ?? 0,
                soldOutCount:     data.soldOutCount     ?? 0,
                todayRevenue:     data.todayRevenue     ?? 0,
                monthRevenue:     data.monthRevenue     ?? 0,
                avgOrderValue:    data.avgOrderValue    ?? 0,
                pendingQaCount:     data.pendingQaCount     ?? 0,
                pendingReviewCount: data.pendingReviewCount ?? 0,
                pendingReturnCount: data.pendingReturnCount ?? 0,
            });
            setRecentOrders(Array.isArray(orders) ? orders : []);
            setLastUpdated(new Date());
        } catch (e) {
            console.error('Dashboard fetch error:', e);
            setError('Failed to load dashboard. Please retry.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // 에러 시 "—", 로딩 중 "...", 정상 숫자
    const val = (n: number | undefined) => {
        if (error)   return '—';
        if (loading) return '...';
        return n ?? 0;
    };

    const lastUpdatedStr = lastUpdated
        ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : null;

    // 처리 대기 알림 목록 — JSX 외부에서 계산 (타입 추론 안정)
    type AlertItem = {
        key: string; href: string; icon: React.ReactNode;
        bg: string; titleColor: string; linkColor: string;
        title: string; sub: string; cta: string;
    };
    const pendingAlerts: AlertItem[] = !loading && stats ? [
        ...(stats.pendingSuppliers > 0 ? [{
            key: 'sellers', href: '/admin/suppliers',
            icon: <Store className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />,
            bg: 'bg-amber-50 border-amber-200', titleColor: 'text-amber-800', linkColor: 'text-amber-700',
            title: `${stats.pendingSuppliers} seller(s) awaiting approval`,
            sub: 'Review and approve seller applications to allow them to list products.',
            cta: 'Review now →',
        }] : []),
        ...((stats.lowStockCount > 0 || stats.soldOutCount > 0) ? [{
            key: 'stock', href: '/admin/inventory',
            icon: <ClipboardList className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />,
            bg: 'bg-red-50 border-red-200', titleColor: 'text-red-800', linkColor: 'text-red-700',
            title: `Stock Alert: ${[stats.soldOutCount > 0 ? `${stats.soldOutCount} sold out` : '', stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : ''].filter(Boolean).join(' · ')}`,
            sub: 'Some products are running low or sold out. Restock required.',
            cta: 'Manage Inventory →',
        }] : []),
        ...(stats.pendingQaCount > 0 ? [{
            key: 'qa', href: '/admin/support',
            icon: <MessageSquare className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />,
            bg: 'bg-sky-50 border-sky-200', titleColor: 'text-sky-800', linkColor: 'text-sky-700',
            title: `${stats.pendingQaCount} unanswered Q&A ticket(s)`,
            sub: 'Customers are waiting for answers on product questions.',
            cta: 'Go to CS Support →',
        }] : []),
        ...(stats.pendingReviewCount > 0 ? [{
            key: 'reviews', href: '/admin/reviews',
            icon: <Eye className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />,
            bg: 'bg-yellow-50 border-yellow-200', titleColor: 'text-yellow-800', linkColor: 'text-yellow-700',
            title: `${stats.pendingReviewCount} review(s) pending approval`,
            sub: 'Approve or reject customer reviews before they go public.',
            cta: 'Moderate Reviews →',
        }] : []),
        ...(stats.pendingReturnCount > 0 ? [{
            key: 'returns', href: '/admin/orders/returns',
            icon: <RotateCcw className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />,
            bg: 'bg-orange-50 border-orange-200', titleColor: 'text-orange-800', linkColor: 'text-orange-700',
            title: `${stats.pendingReturnCount} return request(s) pending`,
            sub: 'Review and approve or reject customer return requests.',
            cta: 'Handle Returns →',
        }] : []),
    ] : [];

    // Quick Actions — role 필터 후 pinned / more 분리
    const visibleActions = ALL_ACTIONS.filter(a => !a.superOnly || isSuperAdmin);
    const pinnedActions  = visibleActions.filter(a => a.pinned);
    const moreActions    = visibleActions.filter(a => !a.pinned);

    const ActionCard = ({ href, icon, color, label, desc }: Omit<ActionItem, 'superOnly' | 'pinned'>) => (
        <Link href={href}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
            <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{desc}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
        </Link>
    );

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">

            {/* ── 에러 배너 ── */}
            {error && (
                <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-800">{error}</p>
                    </div>
                    <button onClick={fetchAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex-shrink-0">
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                </div>
            )}

            {/* ── 헤더 ── */}
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                    </div>
                    <p className="text-sm text-gray-500">Manage products, orders, members, and sellers in one place.</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {lastUpdatedStr && (
                        <span className="hidden sm:block text-xs text-gray-400">Updated {lastUpdatedStr}</span>
                    )}
                    <button onClick={fetchAll} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* ── 매출 KPI ── */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-sm">
                    <div className="text-[11px] font-semibold opacity-70 uppercase tracking-wide mb-1">Today&apos;s Revenue</div>
                    <div className="text-2xl font-extrabold tabular-nums">
                        {loading ? '...' : usd(stats?.todayRevenue ?? 0)}
                    </div>
                    <div className="text-[11px] opacity-60 mt-1">Confirmed orders</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-4 text-white shadow-sm">
                    <div className="text-[11px] font-semibold opacity-70 uppercase tracking-wide mb-1">This Month</div>
                    <div className="text-2xl font-extrabold tabular-nums">
                        {loading ? '...' : usd(stats?.monthRevenue ?? 0)}
                    </div>
                    <div className="text-[11px] opacity-60 mt-1">Confirmed orders</div>
                </div>
                <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-4 text-white shadow-sm">
                    <div className="text-[11px] font-semibold opacity-70 uppercase tracking-wide mb-1">Avg. Order</div>
                    <div className="text-2xl font-extrabold tabular-nums">
                        {loading ? '...' : usd(stats?.avgOrderValue ?? 0)}
                    </div>
                    <div className="text-[11px] opacity-60 mt-1">This month</div>
                </div>
            </div>

            {/* ── Key Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <Link href="/admin/products"
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-xl bg-blue-50"><Package className="w-5 h-5 text-blue-600" /></div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{val(stats?.totalProducts)}</div>
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Total Products</div>
                    <div className="text-xs text-gray-400 mt-0.5">Active: {val(stats?.activeProducts)} · Hot: {val(stats?.hotSaleCount)}</div>
                </Link>

                <Link href="/admin/orders"
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-xl bg-green-50"><ShoppingCart className="w-5 h-5 text-green-600" /></div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{val(stats?.totalOrders)}</div>
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Total Orders</div>
                    <div className="text-xs text-gray-400 mt-0.5">Pending: {val(stats?.pendingOrders)} · Shipping: {val(stats?.shippingOrders)}</div>
                </Link>

                <Link href="/admin/customers"
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-xl bg-purple-50"><Users className="w-5 h-5 text-purple-600" /></div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{val(stats?.totalMembers)}</div>
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Members</div>
                    <div className="text-xs text-gray-400 mt-0.5">Registered customers</div>
                </Link>

                <Link href="/admin/suppliers"
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-xl bg-teal-50"><Store className="w-5 h-5 text-teal-600" /></div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{val(stats?.totalSuppliers)}</div>
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Sellers</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {stats?.pendingSuppliers
                            ? <span className="text-amber-500 font-semibold">{stats.pendingSuppliers} pending approval</span>
                            : 'All approved'}
                    </div>
                </Link>
            </div>

            {/* ── 주문 상태 개요 ── */}
            {!loading && stats && stats.totalOrders > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-500" /> Order Status Overview
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { label: 'Pending',   count: stats.pendingOrders,   color: 'text-amber-600 bg-amber-50',   icon: <Clock className="w-3.5 h-3.5" /> },
                            { label: 'Confirmed', count: stats.confirmedOrders, color: 'text-blue-600 bg-blue-50',     icon: <CheckCircle className="w-3.5 h-3.5" /> },
                            { label: 'Shipping',  count: stats.shippingOrders,  color: 'text-indigo-600 bg-indigo-50', icon: <Package className="w-3.5 h-3.5" /> },
                            { label: 'Delivered', count: stats.deliveredOrders, color: 'text-green-600 bg-green-50',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
                        ].map(({ label, count, color, icon }) => (
                            <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${color}`}>
                                {icon}
                                <div>
                                    <div className="font-bold text-base leading-none">{count}</div>
                                    <div className="text-[11px] font-medium opacity-80 mt-0.5">{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 처리 대기 알림 ── */}
            {pendingAlerts.length > 0 && (
                <div className="space-y-2 mb-5">
                    {pendingAlerts.map(a => (
                        <div key={a.key} className={`border rounded-2xl p-4 flex items-start gap-3 ${a.bg}`}>
                            {a.icon}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${a.titleColor}`}>{a.title}</p>
                                <p className={`text-xs mt-0.5 opacity-80 ${a.titleColor}`}>{a.sub}</p>
                                <Link href={a.href} className={`text-xs font-bold underline mt-1 inline-block ${a.linkColor}`}>{a.cta}</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── 최근 주문 5건 ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <ShoppingCart className="w-4 h-4 text-gray-500" /> Recent Orders
                    </h2>
                    <Link href="/admin/orders" className="text-xs font-semibold text-blue-600 hover:underline">View all →</Link>
                </div>

                {loading ? (
                    <div className="divide-y divide-gray-50">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                <div className="h-3 bg-gray-100 rounded w-20" />
                                <div className="flex-1 h-3 bg-gray-100 rounded" />
                                <div className="h-3 bg-gray-100 rounded w-16" />
                            </div>
                        ))}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">No orders yet.</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentOrders.map(order => {
                            const badge = ORDER_STATUS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' };
                            return (
                                <Link key={order.id} href="/admin/orders"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <span className="font-mono text-[11px] text-gray-400 flex-shrink-0 w-16">
                                        #{order.id.slice(-6).toUpperCase()}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{order.customerName}</p>
                                        <p className="text-[11px] text-gray-400 truncate">{order.email || '—'}</p>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-bold text-gray-900">{usd(order.totalUsd)}</p>
                                        <p className="text-[11px] text-gray-400">{relativeTime(order.createdAt)}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Quick Actions ── */}
            <div className="mb-8">
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-gray-500" /> Quick Actions
                </h2>

                {/* 고정 8개 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {pinnedActions.map(a => <ActionCard key={a.href} {...a} />)}
                </div>

                {/* More tools 토글 */}
                {moreActions.length > 0 && (
                    <div className="mt-3">
                        <button
                            onClick={() => setShowMore(p => !p)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors py-1">
                            {showMore
                                ? <><ChevronUp className="w-3.5 h-3.5" /> Hide more tools</>
                                : <><ChevronDown className="w-3.5 h-3.5" /> More tools ({moreActions.length})</>}
                        </button>

                        {showMore && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                                {moreActions.map(a => <ActionCard key={a.href} {...a} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
