'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Package, Users, ShoppingCart, Store, TrendingUp,
    Plus, Eye, Settings, ArrowRight, Sparkles, BarChart3,
    CheckCircle, Clock, AlertCircle, DollarSign, ClipboardList,
} from 'lucide-react';

interface Stats {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippingOrders: number;
    totalMembers: number;
    totalSuppliers: number;
    pendingSuppliers: number;
    newProductsCount: number;
    hotSaleCount: number;
    lowStockCount: number;
    soldOutCount: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [pRes, oRes, uRes, sRes, invRes] = await Promise.all([
                    fetch('/api/admin/products'),
                    fetch('/api/admin/orders').catch(() => ({ json: () => [] })),
                    fetch('/api/admin/customers'),
                    fetch('/api/admin/suppliers'),
                    fetch('/api/admin/inventory'),
                ]);
                const [products, orders, customers, suppliers, inventory] = await Promise.all([
                    pRes.json(), (oRes as any).json(), uRes.json(), sRes.json(), invRes.json()
                ]);
                const p = Array.isArray(products) ? products : [];
                const o = Array.isArray(orders) ? orders : [];
                const u = Array.isArray(customers) ? customers : [];
                const s = Array.isArray(suppliers) ? suppliers : [];
                const inv = Array.isArray(inventory) ? inventory : [];
                setStats({
                    totalProducts: p.length,
                    activeProducts: p.filter((x: any) => x.status === 'ACTIVE').length,
                    totalOrders: o.length,
                    pendingOrders: o.filter((x: any) => x.status === 'PENDING').length,
                    confirmedOrders: o.filter((x: any) => x.status === 'CONFIRMED').length,
                    shippingOrders: o.filter((x: any) => x.status === 'SHIPPING').length,
                    totalMembers: u.length,
                    totalSuppliers: s.length,
                    pendingSuppliers: s.filter((x: any) => x.status === 'PENDING').length,
                    newProductsCount: p.filter((x: any) => x.isNew).length,
                    hotSaleCount: p.filter((x: any) => x.isHotSale).length,
                    lowStockCount: inv.filter((x: any) => x.isLowStock && x.stockQty > 0).length,
                    soldOutCount: inv.filter((x: any) => x.stockQty === 0).length,
                });
            } catch (e) {
                console.error('Dashboard fetch error:', e);
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
                <p className="text-sm text-gray-500">Manage products, orders, members, and suppliers in one place.</p>
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
                    <div className="text-sm font-medium text-gray-600 mt-0.5">Suppliers</div>
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
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {[
                            { label: 'Pending', count: stats.pendingOrders, color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-3.5 h-3.5" /> },
                            { label: 'Confirmed', count: stats.confirmedOrders, color: 'text-blue-600 bg-blue-50', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                            { label: 'Shipping', count: stats.shippingOrders, color: 'text-indigo-600 bg-indigo-50', icon: <Package className="w-3.5 h-3.5" /> },
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
                        <p className="text-sm font-bold text-amber-800">{stats.pendingSuppliers} supplier(s) awaiting approval</p>
                        <p className="text-xs text-amber-600 mt-0.5">Review and approve supplier applications to allow them to list products.</p>
                        <Link href="/admin/suppliers" className="text-xs font-bold text-amber-700 underline mt-1 inline-block">Review now →</Link>
                    </div>
                </div>
            )}
            {!loading && stats && (stats.lowStockCount > 0 || stats.soldOutCount > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <ClipboardList className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-800">
                            재고 경보: {stats.soldOutCount > 0 ? `품절 ${stats.soldOutCount}개` : ''}{stats.soldOutCount > 0 && stats.lowStockCount > 0 ? ' · ' : ''}{stats.lowStockCount > 0 ? `저재고 ${stats.lowStockCount}개` : ''}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">일부 상품의 재고가 부족합니다. 입고 처리가 필요합니다.</p>
                        <Link href="/admin/inventory" className="text-xs font-bold text-red-700 underline mt-1 inline-block">재고 관리 →</Link>
                    </div>
                </div>
            )}

            {/* ── Quick Actions ── */}
            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gray-500" />
                Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {[
                    {
                        href: '/admin/products/new',
                        icon: <Plus className="w-5 h-5 text-rose-600" />,
                        color: 'bg-rose-50',
                        label: 'Add New Product',
                        desc: 'Register product with auto-translation (KO/EN/KM/ZH)',
                    },
                    {
                        href: '/admin/products',
                        icon: <Package className="w-5 h-5 text-blue-600" />,
                        color: 'bg-blue-50',
                        label: 'Manage Products',
                        desc: 'Edit, delete, categorize, toggle Hot Sale & New',
                    },
                    {
                        href: '/admin/orders',
                        icon: <ShoppingCart className="w-5 h-5 text-green-600" />,
                        color: 'bg-green-50',
                        label: 'Manage Orders',
                        desc: 'Update order status, add shipment tracking',
                    },
                    {
                        href: '/admin/inventory',
                        icon: <ClipboardList className="w-5 h-5 text-orange-600" />,
                        color: 'bg-orange-50',
                        label: 'Inventory Management',
                        desc: 'Stock levels, adjust in/out, view history',
                    },
                    {
                        href: '/admin/reviews',
                        icon: <Eye className="w-5 h-5 text-yellow-600" />,
                        color: 'bg-yellow-50',
                        label: 'Review Moderation',
                        desc: 'Approve or reject customer product reviews',
                    },
                    {
                        href: '/admin/customers',
                        icon: <Users className="w-5 h-5 text-purple-600" />,
                        color: 'bg-purple-50',
                        label: 'Customer Management',
                        desc: 'View members, manage roles & reset passwords',
                    },
                    {
                        href: '/admin/categories',
                        icon: <Settings className="w-5 h-5 text-gray-600" />,
                        color: 'bg-gray-50',
                        label: 'Categories',
                        desc: 'Edit multilingual category names and order',
                    },
                    {
                        href: '/admin/coupons',
                        icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
                        color: 'bg-emerald-50',
                        label: 'Coupons & Discounts',
                        desc: 'Create coupon codes (% off, fixed, free shipping)',
                    },
                    {
                        href: '/admin/suppliers',
                        icon: <Store className="w-5 h-5 text-teal-600" />,
                        color: 'bg-teal-50',
                        label: 'Supplier Management',
                        desc: 'Approve suppliers, adjust commission rates',
                    },
                    {
                        href: '/admin/landing-settings',
                        icon: <TrendingUp className="w-5 h-5 text-pink-600" />,
                        color: 'bg-pink-50',
                        label: 'Landing Page Settings',
                        desc: 'Edit top banners, trust badges, promotions',
                    },
                    {
                        href: '/admin/settings/roles',
                        icon: <Eye className="w-5 h-5 text-orange-600" />,
                        color: 'bg-orange-50',
                        label: 'Admin Role Settings',
                        desc: 'Assign ADMIN / SUPERADMIN roles',
                    },
                    {
                        href: '/admin/settings/email',
                        icon: <Settings className="w-5 h-5 text-blue-500" />,
                        color: 'bg-blue-50',
                        label: 'Email Settings',
                        desc: 'Configure SMTP for order notifications',
                    },
                    {
                        href: '/admin/change-password',
                        icon: <Settings className="w-5 h-5 text-red-600" />,
                        color: 'bg-red-50',
                        label: 'Change Password',
                        desc: 'Reset admin account password directly',
                    },
                ].map(({ href, icon, color, label, desc }) => (
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
