'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Package, ShoppingCart, Plus, ArrowRight,
    Clock, CheckCircle, AlertCircle, BarChart2, Boxes,
    XCircle, RefreshCw, DollarSign, Truck, Bell,
} from 'lucide-react';

// ── 인터페이스 ──────────────────────────────────────────────────────────────────
// 주문 상태: PENDING=결제대기(미입금), CONFIRMED=결제완료/출하대상, SHIPPING, DELIVERED=정산기준
interface SellerStats {
    totalProducts:         number;
    pendingProducts:       number;
    approvedProducts:      number;
    rejectedProducts:      number;
    totalOrders:           number;
    awaitingPaymentOrders: number; // PENDING — 출하 대상 아님
    readyToShipOrders:     number; // CONFIRMED — 출하 대상
    grossRevenue30d:       number;
    commission30d:         number;
    netPayout30d:          number;
    commissionRate:        number;
}

const usd = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function SellerDashboard() {
    const [stats,       setStats]       = useState<SellerStats | null>(null);
    const [profile,     setProfile]     = useState<any>(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState<string | null>(null);
    const [unreadNotif, setUnreadNotif] = useState(0);

    const loadDashboard = useCallback(() => {
        setLoading(true);
        setError(null);
        Promise.all([
            fetch('/api/seller/stats').then(r   => { if (!r.ok) throw new Error(`stats ${r.status}`);   return r.json(); }),
            fetch('/api/seller/profile').then(r => { if (!r.ok) throw new Error(`profile ${r.status}`); return r.json(); }),
            fetch('/api/seller/notifications').then(r => r.ok ? r.json() : { unreadCount: 0 }),
        ]).then(([s, prof, notif]) => {
            setUnreadNotif(notif?.unreadCount ?? 0);
            setStats({
                totalProducts:         s.totalProducts         ?? 0,
                pendingProducts:       s.pendingProducts       ?? 0,
                approvedProducts:      s.approvedProducts      ?? 0,
                rejectedProducts:      s.rejectedProducts      ?? 0,
                totalOrders:           s.totalOrders           ?? 0,
                awaitingPaymentOrders: s.awaitingPaymentOrders ?? 0,
                readyToShipOrders:     s.readyToShipOrders     ?? 0,
                grossRevenue30d:       s.grossRevenue30d       ?? 0,
                commission30d:         s.commission30d         ?? 0,
                netPayout30d:          s.netPayout30d          ?? 0,
                commissionRate:        s.commissionRate        ?? 30,
            });
            setProfile(prof);
        }).catch((e) => {
            console.error('Seller dashboard load error:', e);
            setError('Failed to load dashboard. Please retry.');
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const StatCard = ({
        count, en, ko, icon, color, bg,
    }: { count?: number | undefined; en: string; ko: string; icon: React.ReactNode; color: string; bg: string }) => (
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

            {/* ── 에러 배너 ── */}
            {error && (
                <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="flex-1 text-sm font-bold text-red-800">{error}</p>
                    <button onClick={loadDashboard}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex-shrink-0">
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                </div>
            )}

            {/* ── 미읽음 알림 배너 ── */}
            {unreadNotif > 0 && !loading && (
                <Link href="/seller/notifications"
                    className="mb-4 flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 hover:bg-teal-100 transition-colors">
                    <Bell className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <p className="flex-1 text-sm font-semibold text-teal-700">
                        {unreadNotif} unread notification{unreadNotif > 1 ? 's' : ''}
                        <span className="font-normal text-teal-500 ml-1">· 미읽은 알림 {unreadNotif}건</span>
                    </p>
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                </Link>
            )}

            {/* ── 헤더 ── */}
            <div className="mb-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                            👋 {profile?.companyName || 'Supplier'} Dashboard
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">Supplier Dashboard · 셀러 대시보드</p>
                    </div>
                    <button onClick={loadDashboard} disabled={loading}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50 mt-1">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {isApproved && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                            <CheckCircle className="w-3.5 h-3.5" /> Approved · 승인됨
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                            Commission · 수수료: <strong className="ml-0.5">{stats?.commissionRate ?? profile?.commissionRate ?? 30}%</strong>
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

            {/* ── 수익 강조 카드 (30일 Net Payout) ── */}
            <Link href="/seller/payouts"
                className="block mb-5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-5 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-1">
                                Net Payout (30d) · 순정산액
                            </div>
                            <div className="text-3xl font-extrabold tabular-nums">
                                {loading ? <span className="opacity-40">—</span> : usd(stats?.netPayout30d ?? 0)}
                            </div>
                            <div className="text-xs opacity-60 mt-1">DELIVERED orders only · 배송완료 주문 기준</div>
                        </div>
                        <div className="p-2.5 bg-white/15 rounded-xl group-hover:bg-white/25 transition-colors">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                    {!loading && stats && (
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                            <span>Gross <strong>{usd(stats.grossRevenue30d)}</strong><span className="opacity-60 ml-1">· 총매출</span></span>
                            <span>Commission <strong>−{usd(stats.commission30d)}</strong><span className="opacity-60 ml-1">· 수수료 ({stats.commissionRate}%)</span></span>
                        </div>
                    )}
                </div>
                <div className="bg-teal-700 px-5 py-2 flex items-center justify-between">
                    <span className="text-xs text-teal-100 font-medium">View detailed payout breakdown →</span>
                    <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
                </div>
            </Link>

            {/* ── 출하 대상 주문 알림 (CONFIRMED) ── */}
            {!loading && stats && stats.readyToShipOrders > 0 && (
                <div className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <Truck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-800">
                            {stats.readyToShipOrders} order{stats.readyToShipOrders > 1 ? 's' : ''} ready to ship
                            <span className="font-normal opacity-70 ml-1">· 출하 대상</span>
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            Paid orders awaiting shipment · 결제 완료된 주문이 출하를 기다립니다
                        </p>
                        <Link href="/seller/orders?status=CONFIRMED"
                            className="text-xs font-bold text-amber-700 underline mt-1 inline-block">
                            View ready-to-ship orders →
                        </Link>
                    </div>
                </div>
            )}

            {/* 결제 대기 주문 — 보조 안내 (출하 대상 아님) */}
            {!loading && stats && stats.awaitingPaymentOrders > 0 && (
                <div className="mb-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-600">{stats.awaitingPaymentOrders}</span> awaiting payment · 결제 대기
                        <span className="ml-2 opacity-60">(출하 대상 아님 — 결제 확인 후 어드민이 확정)</span>
                    </p>
                </div>
            )}

            {/* ── 반려 상품 알림 ── */}
            {!loading && stats && stats.rejectedProducts > 0 && (
                <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-800">
                            {stats.rejectedProducts} product{stats.rejectedProducts > 1 ? 's' : ''} rejected · 반려된 상품
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">Please review the rejection reason and re-submit.</p>
                        <Link href="/seller/products?status=REJECTED"
                            className="text-xs font-bold text-red-700 underline mt-1 inline-block">
                            View rejected products →
                        </Link>
                    </div>
                </div>
            )}

            {/* ── 통계 카드 그리드 ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7 mt-4">
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
                    count={stats?.readyToShipOrders}
                    en="Ready to Ship" ko="출하 대상"
                    icon={<Truck className="w-5 h-5 text-orange-600" />}
                    color="text-orange-700" bg="bg-orange-50"
                />
            </div>

            {/* ── Quick Actions ── */}
            <div className="mb-4">
                <div className="text-base font-bold text-gray-800">⚡ Quick Actions</div>
                <div className="text-xs text-gray-400">빠른 실행</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/seller/products/new"
                    className="flex items-center gap-4 p-4 bg-teal-600 text-white rounded-xl shadow hover:bg-teal-700 active:scale-[.99] transition-all">
                    <div className="p-2 bg-white/20 rounded-lg"><Plus className="w-5 h-5" /></div>
                    <div className="flex-1">
                        <div className="font-bold text-base leading-tight">Register New Product</div>
                        <div className="text-xs opacity-75 mt-0.5">Admin review required · 관리자 검수 후 판매</div>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-70" />
                </Link>

                <Link href="/seller/products"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[.99] transition-all">
                    <div className="p-2 bg-blue-50 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
                    <div className="flex-1">
                        <div className="font-bold text-base text-gray-900 leading-tight">My Products</div>
                        <div className="text-xs text-gray-400 mt-0.5">내 상품 관리 — 승인상태 확인 및 수정</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                </Link>

                <Link href="/seller/orders"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[.99] transition-all">
                    <div className="p-2 bg-purple-50 rounded-lg"><ShoppingCart className="w-5 h-5 text-purple-600" /></div>
                    <div className="flex-1">
                        <div className="font-bold text-base text-gray-900 leading-tight">
                            My Orders
                            {!loading && stats && stats.readyToShipOrders > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold">
                                    {stats.readyToShipOrders}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">주문 현황 — 내 상품 주문 조회</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                </Link>

                <Link href="/seller/payouts"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all active:scale-[.99]">
                    <div className="p-2 bg-gray-50 rounded-lg"><BarChart2 className="w-5 h-5 text-emerald-500" /></div>
                    <div className="flex-1">
                        <div className="font-bold text-base text-gray-700 leading-tight">Sales & Payouts</div>
                        <div className="text-xs text-gray-400 mt-0.5">Revenue, commission, and net payout · 매출 & 정산</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                </Link>
            </div>

            {/* ── 안내 ── */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="font-bold text-blue-800 text-sm mb-1">💡 How it works · 주문 처리 흐름</div>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>Customer orders</strong> → PENDING (awaiting payment) <span className="opacity-60">· 주문접수/결제대기</span></li>
                    <li><strong>Payment confirmed</strong> → CONFIRMED (admin confirms) <span className="opacity-60">· 결제확인 → 출하대상</span></li>
                    <li><strong>Ship the product</strong> → admin updates to SHIPPING <span className="opacity-60">· 출하 처리</span></li>
                    <li><strong>Delivered</strong> → payout calculated after commission <span className="opacity-60">· 정산 기준</span></li>
                </ol>
            </div>
        </div>
    );
}
