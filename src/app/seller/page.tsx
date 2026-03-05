'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, TrendingUp, Plus, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SellerStats {
    totalProducts: number;
    pendingProducts: number;
    approvedProducts: number;
    rejectedProducts: number;
    totalOrders: number;
}

export default function SellerDashboard() {
    const [stats, setStats] = useState<SellerStats | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/seller/products').then(r => r.json()),
            fetch('/api/seller/orders').then(r => r.json()),
            fetch('/api/seller/profile').then(r => r.json()),
        ]).then(([products, orders, prof]) => {
            const p = Array.isArray(products) ? products : [];
            setStats({
                totalProducts: p.length,
                pendingProducts: p.filter((x: any) => x.approvalStatus === 'PENDING').length,
                approvedProducts: p.filter((x: any) => x.approvalStatus === 'APPROVED').length,
                rejectedProducts: p.filter((x: any) => x.approvalStatus === 'REJECTED').length,
                totalOrders: Array.isArray(orders) ? orders.length : 0,
            });
            setProfile(prof);
            setLoading(false);
        });
    }, []);

    // 승인상태에 따른 배지
    const StatusBadge = ({ count, label, icon, color }: any) => (
        <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
            <div className={`p-3 rounded-xl ${color} inline-flex mb-3`}>{icon}</div>
            <div className="text-2xl font-bold text-gray-900">{loading ? '...' : count}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">
                    👋 {profile?.companyName || '공급업체'} 대시보드
                </h1>
                {profile?.status === 'PENDING' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2 text-yellow-700 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        승인 대기 중입니다. 관리자 승인 후 상품 등록이 가능합니다.
                    </div>
                )}
                {profile?.status === 'APPROVED' && (
                    <p className="text-sm text-gray-500 mt-1">수수료율: <strong>{profile?.commissionRate}%</strong> | 상태: <span className="text-green-600 font-semibold">✅ 승인됨</span></p>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatusBadge count={stats?.totalProducts} label="전체 등록 상품" icon={<Package className="w-5 h-5 text-blue-600" />} color="bg-blue-50" />
                <StatusBadge count={stats?.pendingProducts} label="검수 대기중" icon={<Clock className="w-5 h-5 text-yellow-600" />} color="bg-yellow-50" />
                <StatusBadge count={stats?.approvedProducts} label="판매 승인됨" icon={<CheckCircle className="w-5 h-5 text-green-600" />} color="bg-green-50" />
                <StatusBadge count={stats?.totalOrders} label="연결된 주문" icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} color="bg-purple-50" />
            </div>

            <h2 className="text-base font-bold text-gray-900 mb-3">⚡ 빠른 실행</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/seller/products/new" className="flex items-center gap-4 p-4 bg-teal-600 text-white rounded-xl shadow hover:bg-teal-700 transition-all">
                    <div className="p-2 bg-white/20 rounded-lg"><Plus className="w-5 h-5" /></div>
                    <div className="flex-1"><div className="font-semibold">새 상품 등록</div><div className="text-xs opacity-80 mt-0.5">관리자 검수 후 판매 시작</div></div>
                    <ArrowRight className="w-4 h-4 opacity-70" />
                </Link>
                <Link href="/seller/products" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="p-2 bg-blue-50 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
                    <div className="flex-1"><div className="font-semibold text-gray-900">내 상품 관리</div><div className="text-xs text-gray-500 mt-0.5">승인상태 확인 및 수정</div></div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link href="/seller/orders" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="p-2 bg-purple-50 rounded-lg"><ShoppingCart className="w-5 h-5 text-purple-600" /></div>
                    <div className="flex-1"><div className="font-semibold text-gray-900">주문 현황</div><div className="text-xs text-gray-500 mt-0.5">내 상품 주문 조회</div></div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                </Link>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="p-2 bg-gray-50 rounded-lg"><TrendingUp className="w-5 h-5 text-gray-400" /></div>
                    <div className="flex-1"><div className="font-semibold text-gray-700">매출 통계</div><div className="text-xs text-gray-400 mt-0.5">준비중</div></div>
                </div>
            </div>
        </div>
    );
}
