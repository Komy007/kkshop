'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    Package, Users, ShoppingCart, Store, TrendingUp,
    Plus, Eye, Settings, ArrowRight, Sparkles, BarChart3,
    CheckCircle, Clock, AlertCircle, DollarSign, ClipboardList,
    RotateCcw, MessageSquare, Image, FileUp, Banknote, Search, Star,
} from 'lucide-react';

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
}

export default function AdminDashboard() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role ?? 'ADMIN';
    const isSuperAdmin = role === 'SUPERADMIN';
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // 전용 stats API — DB COUNT 기반으로 정확한 숫자 반환 (페이지 단위 .length 집계 버그 해소)
                const res = await fetch('/api/admin/stats');
                if (!res.ok) throw new Error('Stats fetch failed');
                const data = await res.json();
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
                });
            } catch (e) {
                console.error('Dashboard stats fetch error:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const val = (n: number | undefined) => loading ? '...' : (n ?? 0);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
                <p className="text-sm text-gray-500">Manage products, orders, members, and sellers in one place.</p>
            </div>

            {/* ── Key Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Link href="/admin/products" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-xl bg-blue-50">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{val(stats?.totalProducts)}</div>
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Total Products</div>
                    <div className="text-xs text-gray-400 mt-0.5">Active: {val(stats?.activeProducts)} • Hot: {val(stats?.hotSaleCount)}</div>
                </Link>

                <Link href="/admin/orders" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-xl bg-green-50">
                            <ShoppingCart className="w-5 h-5 text-green-600" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{val(stats?.totalOrders)}</div>
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Total Orders</div>
                    <div className="text-xs text-gray-400 mt-0.5">Pending: {val(stats?.pendingOrders)} • Shipping: {val(stats?.shippingOrders)}</div>
                </Link>

                <Link href="/admin/customers" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-xl bg-purple-50">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{val(stats?.totalMembers)}</div>
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Members</div>
                    <div className="text-xs text-gray-400 mt-0.5">Registered customers</div>
                </Link>

                <Link href="/admin/suppliers" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-xl bg-teal-50">
                            <Store className="w-5 h-5 text-teal-600" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{val(stats?.totalSuppliers)}</div>
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Sellers</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {stats?.pendingSuppliers ? (
                            <span className="text-amber-500 font-semibold">{stats.pendingSuppliers} pending approval</span>
                        ) : 'All approved'}
                    </div>
                </Link>
            </div>

            {/* ── Order Status Overview ── */}
            {!loading && stats && stats.totalOrders > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-500" />
                        Order Status Overview
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { label: 'Pending', count: stats.pendingOrders, color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-3.5 h-3.5" /> },
                            { label: 'Confirmed', count: stats.confirmedOrders, color: 'text-blue-600 bg-blue-50', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                            { label: 'Shipping', count: stats.shippingOrders, color: 'text-indigo-600 bg-indigo-50', icon: <Package className="w-3.5 h-3.5" /> },
                            { label: 'Delivered', count: stats.deliveredOrders, color: 'text-green-600 bg-green-50', icon: <CheckCircle className="w-3.5 h-3.5" /> },
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

            {/* ── Alerts ── */}
            {!loading && stats && stats.pendingSuppliers > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">{stats.pendingSuppliers} seller(s) awaiting approval</p>
                        <p className="text-xs text-amber-600 mt-0.5">Review and approve seller applications to allow them to list products.</p>
                        <Link href="/admin/suppliers" className="text-xs font-bold text-amber-700 underline mt-1 inline-block">Review now →</Link>
                    </div>
                </div>
            )}
            {!loading && stats && (stats.lowStockCount > 0 || stats.soldOutCount > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <ClipboardList className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-800">
                            Stock Alert: {stats.soldOutCount > 0 ? `${stats.soldOutCount} sold out` : ''}{stats.soldOutCount > 0 && stats.lowStockCount > 0 ? ' · ' : ''}{stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : ''}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">Some products are running low or sold out. Restock required.</p>
                        <Link href="/admin/inventory" className="text-xs font-bold text-red-700 underline mt-1 inline-block">Manage Inventory →</Link>
                    </div>
                </div>
            )}

            {/* ── Quick Actions ── */}
            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gray-500" />
                Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {([
                    {
                        href: '/admin/products/new',
                        icon: <Plus className="w-5 h-5 text-rose-600" />,
                        color: 'bg-rose-50',
                        label: 'Add New Product',
                        desc: 'Register product with auto-translation (KO/EN/KM/ZH)',
                        superOnly: false,
                    },
                    {
                        href: '/admin/products',
                        icon: <Package className="w-5 h-5 text-blue-600" />,
                        color: 'bg-blue-50',
                        label: 'Manage Products',
                        desc: 'Edit, delete, categorize, toggle Hot Sale & New',
                        superOnly: false,
                    },
                    {
                        href: '/admin/orders',
                        icon: <ShoppingCart className="w-5 h-5 text-green-600" />,
                        color: 'bg-green-50',
                        label: 'Manage Orders',
                        desc: 'Update order status, add shipment tracking',
                        superOnly: false,
                    },
                    {
                        href: '/admin/inventory',
                        icon: <ClipboardList className="w-5 h-5 text-orange-600" />,
                        color: 'bg-orange-50',
                        label: 'Inventory Management',
                        desc: 'Stock levels, adjust in/out, view history',
                        superOnly: false,
                    },
                    {
                        href: '/admin/reviews',
                        icon: <Eye className="w-5 h-5 text-yellow-600" />,
                        color: 'bg-yellow-50',
                        label: 'Review Moderation',
                        desc: 'Approve or reject customer product reviews',
                        superOnly: false,
                    },
                    {
                        href: '/admin/customers',
                        icon: <Users className="w-5 h-5 text-purple-600" />,
                        color: 'bg-purple-50',
                        label: 'Customer Management',
                        desc: 'View members, manage roles & reset passwords',
                        superOnly: false,
                    },
                    {
                        href: '/admin/categories',
                        icon: <Settings className="w-5 h-5 text-gray-600" />,
                        color: 'bg-gray-50',
                        label: 'Categories',
                        desc: 'Edit multilingual category names and order',
                        superOnly: false,
                    },
                    {
                        href: '/admin/coupons',
                        icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
                        color: 'bg-emerald-50',
                        label: 'Coupons & Discounts',
                        desc: 'Create coupon codes (% off, fixed, free shipping)',
                        superOnly: false,
                    },
                    {
                        href: '/admin/suppliers',
                        icon: <Store className="w-5 h-5 text-teal-600" />,
                        color: 'bg-teal-50',
                        label: 'Seller Management',
                        desc: 'Approve sellers, adjust commission rates',
                        superOnly: false,
                    },
                    {
                        href: '/admin/orders/returns',
                        icon: <RotateCcw className="w-5 h-5 text-orange-600" />,
                        color: 'bg-orange-50',
                        label: 'Returns & Refunds',
                        desc: 'Review cancelled orders, approve or reject refunds',
                        superOnly: false,
                    },
                    {
                        href: '/admin/support',
                        icon: <MessageSquare className="w-5 h-5 text-sky-600" />,
                        color: 'bg-sky-50',
                        label: 'CS Support (Q&A)',
                        desc: 'Answer pending product Q&A tickets from customers',
                        superOnly: false,
                    },
                    {
                        href: '/admin/marketing/banners',
                        icon: <Image className="w-5 h-5 text-pink-600" />,
                        color: 'bg-pink-50',
                        label: 'Homepage Banners',
                        desc: 'Add, reorder, and toggle hero banner slides',
                        superOnly: false,
                    },
                    {
                        href: '/admin/products/bulk-import',
                        icon: <FileUp className="w-5 h-5 text-violet-600" />,
                        color: 'bg-violet-50',
                        label: 'Bulk Product Import',
                        desc: 'Upload a CSV to register many products at once',
                        superOnly: false,
                    },
                    {
                        href: '/admin/suppliers/payouts',
                        icon: <Banknote className="w-5 h-5 text-teal-600" />,
                        color: 'bg-teal-50',
                        label: 'Supplier Payouts',
                        desc: 'Revenue breakdown, commission, and net payout per supplier',
                        superOnly: true,
                    },
                    {
                        href: '/admin/suppliers/commission',
                        icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
                        color: 'bg-emerald-50',
                        label: 'Commission Rules',
                        desc: 'Set global and per-supplier commission rates',
                        superOnly: true,
                    },
                    {
                        href: '/admin/settings/seo',
                        icon: <Search className="w-5 h-5 text-indigo-600" />,
                        color: 'bg-indigo-50',
                        label: 'SEO Settings',
                        desc: 'Site meta, OG image, Google Analytics & verification',
                        superOnly: true,
                    },
                    {
                        href: '/admin/settings/points',
                        icon: <Star className="w-5 h-5 text-yellow-600" />,
                        color: 'bg-yellow-50',
                        label: 'Points & Rewards',
                        desc: 'Earn rate, redeem rate, expiry, welcome & review bonuses',
                        superOnly: true,
                    },
                    {
                        href: '/admin/landing-settings',
                        icon: <TrendingUp className="w-5 h-5 text-pink-600" />,
                        color: 'bg-pink-50',
                        label: 'Landing Page Settings',
                        desc: 'Edit top banners, trust badges, promotions',
                        superOnly: true,
                    },
                    {
                        href: '/admin/settings/roles',
                        icon: <Eye className="w-5 h-5 text-orange-600" />,
                        color: 'bg-orange-50',
                        label: 'Admin Role Settings',
                        desc: 'Assign ADMIN / SUPERADMIN roles',
                        superOnly: true,
                    },
                    {
                        href: '/admin/settings/email',
                        icon: <Settings className="w-5 h-5 text-blue-500" />,
                        color: 'bg-blue-50',
                        label: 'Email Settings',
                        desc: 'Configure SMTP for order notifications',
                        superOnly: true,
                    },
                    {
                        href: '/admin/change-password',
                        icon: <Settings className="w-5 h-5 text-red-600" />,
                        color: 'bg-red-50',
                        label: 'Change Password',
                        desc: 'Reset admin account password directly',
                        superOnly: false,
                    },
                ] as { href: string; icon: React.ReactNode; color: string; label: string; desc: string; superOnly: boolean }[])
                    .filter(item => !item.superOnly || isSuperAdmin)
                    .map(({ href, icon, color, label, desc }) => (
                    <Link key={href} href={href}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                        <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>{icon}</div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{label}</div>
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{desc}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
