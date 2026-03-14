'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, RefreshCcw, Download, Building2 } from 'lucide-react';

interface SupplierPayout {
    supplierId:     string;
    companyName:    string;
    brandName:      string | null;
    contactEmail:   string;
    commissionRate: number;
    grossRevenue:   number;
    commission:     number;
    netPayout:      number;
    orderCount:     number;
    status:         string;
}

interface Summary {
    totalGross:      number;
    totalCommission: number;
    totalPayout:     number;
    supplierCount:   number;
}

export default function PayoutsPage() {
    const [payouts,  setPayouts]  = useState<SupplierPayout[]>([]);
    const [summary,  setSummary]  = useState<Summary | null>(null);
    const [loading,  setLoading]  = useState(true);
    const [period,   setPeriod]   = useState('30');

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await fetch(`/api/admin/payouts?period=${period}`);
            const data = await res.json();
            setPayouts(data.payouts ?? []);
            setSummary(data.summary ?? null);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    const exportCsv = () => {
        const header = 'Company,Brand,Email,Commission Rate,Gross Revenue,Commission,Net Payout,Orders\n';
        const rows   = payouts.map(p =>
            [p.companyName, p.brandName ?? '', p.contactEmail, `${p.commissionRate}%`,
             `$${p.grossRevenue.toFixed(2)}`, `$${p.commission.toFixed(2)}`,
             `$${p.netPayout.toFixed(2)}`, p.orderCount].join(',')
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `payouts-${period}d-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Supplier Payouts</h1>
                    <p className="text-sm text-gray-500 mt-0.5">공급자 정산 / 페이아웃</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Period selector */}
                    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                        {[['7', '7D'], ['30', '30D'], ['90', '90D'], ['365', '1Y']].map(([v, l]) => (
                            <button key={v} onClick={() => setPeriod(v)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={fetchPayouts} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all">
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Gross Revenue', value: `$${summary.totalGross.toFixed(2)}`,      icon: TrendingUp,  color: 'text-blue-600',   bg: 'bg-blue-50' },
                        { label: 'Platform Commission',  value: `$${summary.totalCommission.toFixed(2)}`, icon: DollarSign,  color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Total Payout to Suppliers', value: `$${summary.totalPayout.toFixed(2)}`, icon: DollarSign, color: 'text-green-600',  bg: 'bg-green-50' },
                        { label: 'Active Suppliers',     value: String(summary.supplierCount),             icon: Building2,   color: 'text-slate-700',  bg: 'bg-slate-50' },
                    ].map(card => (
                        <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                            <div className="text-xs text-slate-500 mt-1">{card.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payouts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700">Payout Breakdown by Supplier</h2>
                    <span className="text-xs text-slate-400">Last {period} days · Delivered orders only</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Calculating payouts...</div>
                ) : payouts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <Building2 className="w-10 h-10 opacity-30" />
                        <p className="text-sm">No payout data for this period.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <th className="px-6 py-3 text-left font-semibold">Supplier</th>
                                    <th className="px-4 py-3 text-right font-semibold">Commission Rate</th>
                                    <th className="px-4 py-3 text-right font-semibold">Gross Revenue</th>
                                    <th className="px-4 py-3 text-right font-semibold">Commission</th>
                                    <th className="px-4 py-3 text-right font-semibold">Net Payout</th>
                                    <th className="px-4 py-3 text-right font-semibold">Orders</th>
                                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payouts.map(p => (
                                    <tr key={p.supplierId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{p.companyName}</div>
                                            <div className="text-xs text-slate-500">{p.brandName ?? p.contactEmail}</div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg">{p.commissionRate}%</span>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-slate-700">${p.grossRevenue.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right text-purple-600 font-medium">-${p.commission.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right font-bold text-green-600">${p.netPayout.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right text-slate-600">{p.orderCount}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">Pending</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Footer totals */}
                            {summary && (
                                <tfoot>
                                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                                        <td className="px-6 py-3 text-slate-700">TOTAL</td>
                                        <td className="px-4 py-3" />
                                        <td className="px-4 py-3 text-right text-slate-700">${summary.totalGross.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-purple-600">-${summary.totalCommission.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-green-600">${summary.totalPayout.toFixed(2)}</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700">
                <strong>Note:</strong> Payout amounts are calculated from DELIVERED orders only. Actual bank transfers must be processed manually or via your banking integration. Future update will support automated payout via ABA SWIFT / ACLEDA.
            </div>
        </div>
    );
}
