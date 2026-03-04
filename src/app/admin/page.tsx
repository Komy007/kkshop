'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Package, Users, ShoppingCart, Store, TrendingUp,
    Plus, Eye, Settings, ArrowRight, Sparkles
} from 'lucide-react';

interface Stats {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    totalMembers: number;
    totalSuppliers: number;
    newProductsCount: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            const [pRes, oRes, uRes, sRes] = await Promise.all([
                fetch('/api/admin/products'),
                fetch('/api/admin/orders').catch(() => ({ json: () => [] })),
                fetch('/api/admin/customers'),
                fetch('/api/admin/suppliers'),
            ]);
            const [products, orders, customers, suppliers] = await Promise.all([
                pRes.json(), (oRes as any).json(), uRes.json(), sRes.json()
            ]);
            setStats({
                totalProducts: Array.isArray(products) ? products.length : 0,
                activeProducts: Array.isArray(products) ? products.filter((p: any) => p.status === 'ACTIVE').length : 0,
                totalOrders: Array.isArray(orders) ? orders.length : 0,
                pendingOrders: Array.isArray(orders) ? orders.filter((o: any) => o.status === 'PENDING').length : 0,
                totalMembers: Array.isArray(customers) ? customers.length : 0,
                totalSuppliers: Array.isArray(suppliers) ? suppliers.length : 0,
                newProductsCount: Array.isArray(products) ? products.filter((p: any) => p.isNew).length : 0,
            });
            setLoading(false);
        }
        fetchStats();
    }, []);

    const StatCard = ({ icon, label, value, sub, color, href }: any) => (
        <Link href={href} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
            </div>
            <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</div>
                <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
                {sub && <div className="text-xs text-gray-400 mt-0.5">{loading ? '' : sub}</div>}
            </div>
        </Link>
    );

    const QuickAction = ({ href, icon, label, desc, color }: any) => (
        <Link href={href}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
            <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
        </Link>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">👋 KKShop 관리자 대시보드</h1>
                <p className="text-sm text-gray-500 mt-1">상품 · 주문 · 회원 · 공급업체를 한 곳에서 관리하세요.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<Package className="w-5 h-5 text-blue-600" />} label="전체 상품" value={stats?.totalProducts ?? 0} sub={`판매중 ${stats?.activeProducts ?? 0}개`} color="bg-blue-50" href="/admin/products" />
                <StatCard icon={<Sparkles className="w-5 h-5 text-yellow-600" />} label="신상품" value={stats?.newProductsCount ?? 0} sub="NEW 태그 상품" color="bg-yellow-50" href="/admin/products" />
                <StatCard icon={<ShoppingCart className="w-5 h-5 text-green-600" />} label="전체 주문" value={stats?.totalOrders ?? 0} sub={`대기 ${stats?.pendingOrders ?? 0}건`} color="bg-green-50" href="/admin/orders" />
                <StatCard icon={<Users className="w-5 h-5 text-purple-600" />} label="전체 회원" value={stats?.totalMembers ?? 0} sub="" color="bg-purple-50" href="/admin/customers" />
            </div>

            {/* Quick Actions */}
            <h2 className="text-base font-bold text-gray-900 mb-3">⚡ 빠른 실행</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                <QuickAction href="/admin/products/new" icon={<Plus className="w-5 h-5 text-blue-600" />} label="새 상품 등록" desc="카테고리 선택 + 신상품 등록" color="bg-blue-50" />
                <QuickAction href="/admin/products" icon={<Package className="w-5 h-5 text-indigo-600" />} label="전체 상품 관리" desc="수정 · 삭제 · 카테고리 이동" color="bg-indigo-50" />
                <QuickAction href="/admin/categories" icon={<Settings className="w-5 h-5 text-gray-600" />} label="카테고리 관리" desc="이름 수정 · 정렬 변경" color="bg-gray-50" />
                <QuickAction href="/admin/orders" icon={<ShoppingCart className="w-5 h-5 text-green-600" />} label="주문 관리" desc="주문상태 변경 · 조회" color="bg-green-50" />
                <QuickAction href="/admin/customers" icon={<Users className="w-5 h-5 text-purple-600" />} label="회원 관리" desc="역할 변경 · 삭제 · 비밀번호 초기화" color="bg-purple-50" />
                <QuickAction href="/admin/settings/roles" icon={<Eye className="w-5 h-5 text-orange-600" />} label="관리자 권한 설정" desc="ADMIN / SUPERADMIN 지정" color="bg-orange-50" />
                <QuickAction href="/admin/suppliers" icon={<Store className="w-5 h-5 text-teal-600" />} label="공급업체 관리" desc="승인 · 수수료 · 상태 변경" color="bg-teal-50" />
                <QuickAction href="/admin/change-password" icon={<Settings className="w-5 h-5 text-red-600" />} label="비밀번호 변경" desc="관리자 비밀번호 직접 변경" color="bg-red-50" />
                <QuickAction href="/admin/landing-settings" icon={<TrendingUp className="w-5 h-5 text-pink-600" />} label="랜딩 페이지 설정" desc="배너 · 프로모션 콘텐츠" color="bg-pink-50" />
            </div>
        </div>
    );
}
