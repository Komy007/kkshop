'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Package, ShoppingCart, TrendingUp, Plus, ArrowRight,
    Clock, CheckCircle, AlertCircle, BarChart2, Boxes,
} from 'lucide-react';

interface SellerStats {
    totalProducts:    number;
    pendingProducts:  number;
    approvedProducts: number;
    rejectedProducts: number;
    totalOrders:      number;
}

export default function SellerDashboard() {
    const [stats,   setStats]   = useState<SellerStats | null>(null);
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
                totalProducts:    p.length,
                pendingProducts:  p.filter((x: any) => x.approvalStatus === 'PENDING').length,
                approvedProducts: p.filter((x: any) => x.approvalStatus === 'APPROVED').length,
                rejectedProducts: p.filter((x: any) => x.approvalStatus === 'REJECTED').length,
                totalOrders:      Array.isArray(orders) ? orders.length : 0,
            });
            setProfile(prof);
            setLoading(false);
        });
    }, []);

    /* ── Stat card ── */
    const StatCard = ({
        count, en, ko, icon, color, bg,
    }: { count?: number; en: string; ko: string; icon: React.ReactNode; color: string; bg: string }) => (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className={`p-2.5 rounded-xl ${bg} inline-flex w-fit`}>{icon}</div>
            <div className="text-3xl font-extrabold text-gray-900 tabular-nums">
                {loading ? <span className="text-gray-300 animate-pulse">—</span> : (count ?? 0)}
            </div>
            <div>
                <div className={`text-sm font-semibold ${color}`}>{en}</div>
                <div className="text-[11px] text-gray-400 leading-tight">{ko}</div>
            </div>
        </div>
    );

    const isApproved = profile?.status === 'APPROVED';
    const isPending  = profile?.status === 'PENDING';

    return (
        <div className="p-5 md:p-7 max-w-5xl mx-auto">

            {/* ── Header ── */}
            <div className="mb-7">
                <div className="flex items-start gap-3">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                            👋 {profile?.companyName || 'Supplier'} Dashboard
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">공급업체 대시보드</p>
                    </div>
                </div>

                {/* Status bar */}
                {isApproved && (
                    <div className="mt-3 flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approved · 승인됨
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                            Commission Rate · 수수료율: <strong>{profile?.commissionRate ?? 15}%</strong>
                        </span>
                    </div>
                )}
                {isPending && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-700 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-semibold">Pending Approval</div>
                            <div className="text-xs opacity-80 mt-0.5">승인 대기 중 — 관리자 승인 후 상품 등록이 가능합니다.</div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                <StatCard
                    count={stats?.totalProducts}
                    en="Total Products" ko="전체 등록 상품"
                    icon={<Boxes className="w-5 h-5 text-blue-600" />}
                    color="text-blue-700" bg="bg-blue-50"
                />
                <StatCard
                    count={stats?.pendingProducts}
                    en="Under Review" ko="검수 대기중"
                    icon={<Clock className="w-5 h-5 text-amber-600" />}
                    color="text-amber-700" bg="bg-amber-50"
                />
                <StatCard
                    count={stats?.approvedProducts}
                    en="Approved & Live" ko="판매 승인됨"
                    icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                    color="text-green-700" bg="bg-green-50"
                />
                <StatCard
                    count={stats?.totalOrders}
                    en="Linked Orders" ko="연결된 주문"
                    icon={<ShoppingCart className="w-5 h-5 text-purple-600" />}
                    color="text-purple-700" bg="bg-purple-50"
                />
            </div>

            {/* ── Quick actions ── */}
            <div className="mb-3">
                <div className="text-base font-bold text-gray-800">⚡ Quick Actions</div>
                <div className="text-xs text-gray-400">빠른 실행</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Register new product */}
                <Link href="/seller/products/new"
                    className="flex items-center gap-4 p-4 bg-teal-600 text-white rounded-xl shadow hover:bg-teal-700 active:scale-[.99] transition-all">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-base leading-tight">Register New Product</div>
                        <div className="text-xs opacity-75 mt-0.5">새 상품 등록 — 관리자 검수 후 판매 시작</div>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-70" />
                </Link>

                {/* My products */}
                <Link href="/seller/products"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[.99] transition-all">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-base text-gray-900 leading-tight">My Products</div>
                        <div className="text-xs text-gray-400 mt-0.5">내 상품 관리 — 승인상태 확인 및 수정</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                </Link>

                {/* My orders */}
                <Link href="/seller/orders"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[.99] transition-all">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <ShoppingCart className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-base text-gray-900 leading-tight">My Orders</div>
                        <div className="text-xs text-gray-400 mt-0.5">주문 현황 — 내 상품 주문 조회</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                </Link>

                {/* Sales stats — coming soon */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-dashed border-gray-200">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <BarChart2 className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-base text-gray-400 leading-tight">Sales Analytics</div>
                        <div className="text-xs text-gray-300 mt-0.5">매출 통계 — Coming Soon · 준비중</div>
                    </div>
                </div>
            </div>

            {/* ── Tips ── */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="font-bold text-blue-800 text-sm mb-1">💡 How it works · 상품 등록 안내</div>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>Register product</strong> → fill in name, price, category, images <span className="opacity-60">· 상품 등록</span></li>
                    <li><strong>Admin review</strong> → quality &amp; compliance check <span className="opacity-60">· 관리자 검수</span></li>
                    <li><strong>Go live</strong> → product appears on KKShop for buyers <span className="opacity-60">· 판매 시작</span></li>
                    <li><strong>Earn</strong> → payouts after commission deducted <span className="opacity-60">· 수수료 정산</span></li>
                </ol>
            </div>
        </div>
    );
}
