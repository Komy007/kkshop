'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Package, ShoppingCart, Download } from 'lucide-react';

interface PayoutSummary {
    period:          string;
    grossRevenue:    number;
    commissionRate:  number;
    commission:      number;
    netPayout:       number;
    orderCount:      number;
    productCount:    number;
}

interface PayoutItem {
    orderId:     string;
    productName: string;
    orderDate:   string;
    qty:         number;
    priceUsd:    number;
    subtotal:    number;
    commission:  number;
    net:         number;
}

const PERIODS: [string, string, string][] = [
    ['7',   '7 days',   '7일'],
    ['30',  '30 days',  '30일'],
    ['90',  '3 months', '3개월'],
    ['365', '1 year',   '1년'],
];

export default function SellerPayoutsPage() {
    const [summary, setSummary] = useState<PayoutSummary | null>(null);
    const [items,   setItems]   = useState<PayoutItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [period,  setPeriod]  = useState('30');

    useEffect(() => {
        setLoading(true);
        fetch(`/api/seller/payouts?period=${period}`)
            .then(r => r.json())
            .then(data => {
                setSummary(data.summary ?? null);
                setItems(data.items ?? []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [period]);

    const exportCsv = () => {
        if (!items.length) return;
        const header = 'Order ID,Product,Date,Qty,Price,Subtotal,Commission,Net\n';
        const rows   = items.map(i =>
            [i.orderId, `"${i.productName}"`, i.orderDate, i.qty,
             `$${i.priceUsd.toFixed(2)}`, `$${i.subtotal.toFixed(2)}`,
             `-$${i.commission.toFixed(2)}`, `$${i.net.toFixed(2)}`].join(',')
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `my-payouts-${period}d.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Payouts</h1>
                    <p className="text-sm text-gray-400 mt-0.5">정산 내역 &amp; Earnings · 수익 현황</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                        {PERIODS.map(([v, en, ko]) => (
                            <button key={v} onClick={() => setPeriod(v)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                <span className="block leading-tight">{en}</span>
                                <span className="block text-[9px] opacity-60 leading-tight">{ko}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={exportCsv}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all">
                        <Download className="w-4 h-4" /> CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse bg-slate-100" />)}
                </div>
            ) : summary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { en: 'Gross Revenue',  ko: '총 매출',   value: `$${summary.grossRevenue.toFixed(2)}`,  icon: TrendingUp,  color: 'text-blue-600',   bg: 'bg-blue-50'  },
                        { en: 'Commission',     ko: '수수료',    value: `-$${summary.commission.toFixed(2)}`,   icon: DollarSign,  color: 'text-red-500',    bg: 'bg-red-50',  sub: `${summary.commissionRate}%` },
                        { en: 'Net Payout',     ko: '순 정산액', value: `$${summary.netPayout.toFixed(2)}`,     icon: DollarSign,  color: 'text-green-600',  bg: 'bg-green-50' },
                        { en: 'Total Orders',   ko: '주문 건수', value: `${summary.orderCount}`,                icon: ShoppingCart, color: 'text-slate-700', bg: 'bg-slate-50' },
                    ].map(card => (
                        <div key={card.en} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                            <div className="mt-1">
                                <div className="text-xs font-semibold text-slate-700 leading-tight">
                                    {card.en}{(card as any).sub ? ` (${(card as any).sub})` : ''}
                                </div>
                                <div className="text-[10px] text-slate-400 leading-tight">{card.ko}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Payout Formula */}
            {summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                    <span className="font-bold">Payout Formula · 정산 계산식: </span>
                    Gross ${summary.grossRevenue.toFixed(2)} − Commission {summary.commissionRate}% (${summary.commission.toFixed(2)}) = <strong>Net ${summary.netPayout.toFixed(2)}</strong>
                    <span className="text-xs opacity-70 block mt-1">
                        * Only DELIVERED orders are counted · 배송완료(DELIVERED) 주문만 집계됩니다. Actual payout processed by admin · 실제 정산은 플랫폼 관리자가 처리합니다.
                    </span>
                </div>
            )}

            {/* Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-bold text-slate-700">Transaction Details</h2>
                    <span className="text-xs text-slate-400">· 상세 내역 — last {period} days · 최근 {period}일 · delivered orders · 배송완료 주문</span>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                        Calculating… <span className="opacity-60">· 계산 중…</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                        No delivered orders in this period.
                        <span className="block text-xs opacity-70 mt-1">이 기간에 배송 완료된 주문이 없습니다.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <th className="px-5 py-3 text-left font-semibold">Order ID <span className="normal-case opacity-60">· 주문번호</span></th>
                                    <th className="px-4 py-3 text-left font-semibold">Product <span className="normal-case opacity-60">· 상품</span></th>
                                    <th className="px-4 py-3 text-left font-semibold">Date <span className="normal-case opacity-60">· 날짜</span></th>
                                    <th className="px-4 py-3 text-right font-semibold">Qty <span className="normal-case opacity-60">· 수량</span></th>
                                    <th className="px-4 py-3 text-right font-semibold">Subtotal <span className="normal-case opacity-60">· 소계</span></th>
                                    <th className="px-4 py-3 text-right font-semibold">Commission <span className="normal-case opacity-60">· 수수료</span></th>
                                    <th className="px-4 py-3 text-right font-semibold">Net <span className="normal-case opacity-60">· 순수익</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3 text-xs text-slate-500 font-mono">{item.orderId.slice(-8).toUpperCase()}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 max-w-48 truncate">{item.productName}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                        <td className="px-4 py-3 text-right">{item.qty}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">${item.subtotal.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-red-500">-${item.commission.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">${item.net.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
