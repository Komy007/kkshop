'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Building2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface Supplier {
    id: string;
    companyName: string;
    brandName?: string;
    country?: string;
    phone?: string;
    contactEmail: string;
    description?: string;
    commissionRate: number;
    status: string;
    adminNote?: string;
    createdAt: string;
    user: { email: string; name?: string };
    _count: { products: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: { label: '심사중', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
    APPROVED: { label: '승인완료', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
    REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
    SUSPENDED: { label: '정지됨', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-4 h-4" /> },
};

export default function AdminSuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [editNote, setEditNote] = useState<Record<string, string>>({});
    const [editRate, setEditRate] = useState<Record<string, string>>({});

    const fetchSuppliers = async () => {
        setLoading(true);
        const url = filterStatus ? `/api/admin/suppliers?status=${filterStatus}` : '/api/admin/suppliers';
        const res = await fetch(url);
        const data = await res.json();
        setSuppliers(data);
        setLoading(false);
    };

    useEffect(() => { fetchSuppliers(); }, [filterStatus]);

    const handleAction = async (id: string, status: string) => {
        setActionLoading(id + status);
        await fetch('/api/admin/suppliers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                status,
                adminNote: editNote[id],
                commissionRate: editRate[id] ? parseFloat(editRate[id]) : undefined,
            }),
        });
        setActionLoading(null);
        fetchSuppliers();
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="text-blue-500 w-6 h-6" />
                    공급자 관리
                </h1>
                <p className="text-sm text-gray-500 mt-1">공급자 신청 승인·거절, 수수료율 조정 (기본 30%, 25~35%)</p>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                        {s === '' ? '전체' : statusConfig[s]?.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">신청 내역이 없습니다.</div>
            ) : (
                <div className="space-y-4">
                    {suppliers.map(s => {
                        const cfgRaw = statusConfig[s.status] ?? statusConfig['PENDING'];
                        const cfg = cfgRaw!;
                        const isExpanded = expanded === s.id;
                        return (
                            <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <button className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpanded(isExpanded ? null : s.id)}>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="font-semibold text-gray-900">{s.companyName} {s.brandName && <span className="text-blue-600 ml-2 text-sm">({s.brandName})</span>}</div>
                                            <div className="text-sm text-gray-500">{s.contactEmail} · {s.country || '-'} · 상품 {s._count.products}개</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                                            {cfg.icon}{cfg.label}
                                        </span>
                                        <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">수수료 {Number(s.commissionRate)}%</span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-gray-500">신청일</span><br /><span className="font-medium">{new Date(s.createdAt).toLocaleDateString('ko-KR')}</span></div>
                                            <div><span className="text-gray-500">연락처</span><br /><span className="font-medium">{s.phone || '-'}</span></div>
                                            <div className="col-span-2"><span className="text-gray-500">브랜드 소개</span><br /><span>{s.description || '-'}</span></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-600 block mb-1">수수료율 조정 (25~35%)</label>
                                                <input type="number" min={25} max={35} step={0.5}
                                                    defaultValue={String(s.commissionRate)}
                                                    onChange={e => setEditRate(r => ({ ...r, [s.id]: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600 block mb-1">관리자 메모</label>
                                                <input type="text" defaultValue={s.adminNote || ''}
                                                    onChange={e => setEditNote(n => ({ ...n, [s.id]: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    placeholder="내부 메모 (공급자에게 보이지 않음)" />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => handleAction(s.id, 'APPROVED')} disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors">
                                                {actionLoading === s.id + 'APPROVED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                승인
                                            </button>
                                            <button onClick={() => handleAction(s.id, 'REJECTED')} disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                                                {actionLoading === s.id + 'REJECTED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                거절
                                            </button>
                                            <button onClick={() => handleAction(s.id, 'SUSPENDED')} disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-60 transition-colors">
                                                정지
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
