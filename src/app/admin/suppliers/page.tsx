'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, Building2, ChevronDown, ChevronUp, Loader2, Plus, X, AlertCircle } from 'lucide-react';

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

const statusConfig: Record<string, { en: string; ko: string; color: string; icon: React.ReactNode }> = {
    PENDING:   { en: 'Under Review', ko: '심사중',   color: 'bg-yellow-100 text-yellow-800', icon: <Clock      className="w-3.5 h-3.5" /> },
    APPROVED:  { en: 'Approved',     ko: '승인완료', color: 'bg-green-100 text-green-800',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
    REJECTED:  { en: 'Rejected',     ko: '거절됨',   color: 'bg-red-100 text-red-800',       icon: <XCircle    className="w-3.5 h-3.5" /> },
    SUSPENDED: { en: 'Suspended',    ko: '정지됨',   color: 'bg-gray-100 text-gray-700',     icon: <XCircle    className="w-3.5 h-3.5" /> },
};

const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

/* Bilingual field label */
const Label = ({ en, ko, required }: { en: string; ko: string; required?: boolean }) => (
    <label className="block mb-1.5">
        <span className="text-sm font-semibold text-gray-800">{en}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
        <span className="text-[11px] text-gray-400 ml-1.5">{ko}</span>
    </label>
);

export default function AdminSuppliersPage() {
    const [suppliers,     setSuppliers]     = useState<Supplier[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [filterStatus,  setFilterStatus]  = useState('');
    const [expanded,      setExpanded]      = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [editNote,      setEditNote]      = useState<Record<string, string>>({});
    const [editRate,      setEditRate]      = useState<Record<string, string>>({});

    // Add-supplier form
    const [isAdding,     setIsAdding]     = useState(false);
    const [newSupplier,  setNewSupplier]  = useState({
        companyName: '', contactEmail: '', brandName: '', phone: '', commissionRate: 30, description: '', password: ''
    });
    const [addLoading, setAddLoading] = useState(false);
    const [addError,   setAddError]   = useState('');

    // Toast notification
    const [toast, setToast] = useState<{ msg: string; msgKo: string; type: 'success' | 'error' } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const showToast = (msg: string, msgKo: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, msgKo, type });
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const fetchSuppliers = async () => {
        setLoading(true);
        const url = filterStatus ? `/api/admin/suppliers?status=${filterStatus}` : '/api/admin/suppliers';
        const res  = await fetch(url);
        const data = await res.json();
        setSuppliers(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchSuppliers(); }, [filterStatus]);

    /* ── Add supplier ── */
    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');
        setAddLoading(true);
        const res  = await fetch('/api/admin/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSupplier),
        });
        const data = await res.json();
        setAddLoading(false);

        if (!res.ok) {
            setAddError(data.error || 'Registration failed · 등록 실패');
            return;
        }

        // Close form, reset, refresh list, show toast, scroll to list
        setIsAdding(false);
        setNewSupplier({ companyName: '', contactEmail: '', brandName: '', phone: '', commissionRate: 30, description: '', password: '' });
        await fetchSuppliers();
        showToast('Supplier registered successfully!', '공급자가 등록되었습니다.');
        setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    /* ── Approve / Reject / Suspend ── */
    const handleAction = async (id: string, status: string) => {
        setActionLoading(id + status);
        await fetch('/api/admin/suppliers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                status,
                adminNote:      editNote[id],
                commissionRate: editRate[id] ? parseFloat(editRate[id]) : undefined,
            }),
        });
        setActionLoading(null);
        setExpanded(null); // collapse row → returns to list view
        await fetchSuppliers();

        const labels: Record<string, { en: string; ko: string }> = {
            APPROVED:  { en: 'Supplier approved.',   ko: '공급자가 승인되었습니다.' },
            REJECTED:  { en: 'Supplier rejected.',   ko: '공급자가 거절되었습니다.' },
            SUSPENDED: { en: 'Supplier suspended.',  ko: '공급자가 정지되었습니다.' },
        };
        const lbl = labels[status];
        if (lbl) showToast(lbl.en, lbl.ko, status === 'APPROVED' ? 'success' : 'error');
    };

    const FILTERS = ['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
    const FILTER_LABELS: Record<string, { en: string; ko: string }> = {
        '':        { en: 'All',       ko: '전체'   },
        PENDING:   { en: 'Pending',   ko: '심사중' },
        APPROVED:  { en: 'Approved',  ko: '승인'   },
        REJECTED:  { en: 'Rejected',  ko: '거절'   },
        SUSPENDED: { en: 'Suspended', ko: '정지'   },
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">

            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold max-w-sm transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    <div>
                        <div>{toast.msg}</div>
                        <div className="text-xs opacity-80 mt-0.5">{toast.msgKo}</div>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="text-blue-500 w-6 h-6" />
                        Supplier Management
                        <span className="text-base font-normal text-gray-400 ml-1">공급자 관리</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Approve, reject, adjust commission rates, or register new suppliers.
                        <span className="block text-xs opacity-70">공급자 승인·거절, 수수료율 조정 및 직접 등록 (기본 30%)</span>
                    </p>
                </div>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
                        <Plus className="w-4 h-4" />
                        Register Supplier <span className="opacity-70 font-normal">· 공급자 등록</span>
                    </button>
                )}
            </div>

            {/* ── Add Supplier Form ── */}
            {isAdding && (
                <div className="mb-8 p-6 bg-white rounded-2xl border border-blue-100 shadow-md">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Register New Supplier</h2>
                            <p className="text-xs text-gray-400 mt-0.5">새 공급자 직접 등록</p>
                        </div>
                        <button onClick={() => { setIsAdding(false); setAddError(''); }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {addError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {addError}
                        </div>
                    )}

                    <form onSubmit={handleAddSupplier} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label en="Company Name" ko="회사명" required />
                                <input required type="text" value={newSupplier.companyName}
                                    onChange={e => setNewSupplier({ ...newSupplier, companyName: e.target.value })}
                                    placeholder="e.g. Beauty Korea Co." className={inp} />
                            </div>
                            <div>
                                <Label en="Login Email" ko="로그인 이메일" required />
                                <input required type="email" value={newSupplier.contactEmail}
                                    onChange={e => setNewSupplier({ ...newSupplier, contactEmail: e.target.value })}
                                    placeholder="supplier@example.com" className={inp} />
                            </div>
                            <div>
                                <Label en="Temporary Password" ko="임시 로그인 비밀번호" required />
                                <input required type="text" value={newSupplier.password}
                                    onChange={e => setNewSupplier({ ...newSupplier, password: e.target.value })}
                                    placeholder="e.g. Supplier2026!" className={inp} />
                            </div>
                            <div>
                                <Label en="Commission Rate %" ko="수수료율 % (기본 30)" />
                                <input type="number" min={0} max={100} step={0.5} value={newSupplier.commissionRate}
                                    onChange={e => setNewSupplier({ ...newSupplier, commissionRate: parseFloat(e.target.value) })}
                                    className={inp} />
                            </div>
                            <div>
                                <Label en="Phone / Contact" ko="연락처" />
                                <input type="text" value={newSupplier.phone}
                                    onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                    placeholder="+82-10-0000-0000" className={inp} />
                            </div>
                            <div>
                                <Label en="Brand Name" ko="브랜드명" />
                                <input type="text" value={newSupplier.brandName}
                                    onChange={e => setNewSupplier({ ...newSupplier, brandName: e.target.value })}
                                    placeholder="e.g. GlowLab" className={inp} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => { setIsAdding(false); setAddError(''); }}
                                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                                Cancel <span className="opacity-60">· 취소</span>
                            </button>
                            <button disabled={addLoading} type="submit"
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
                                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Register &amp; Issue Account <span className="opacity-70 font-normal">· 계정 발급 및 등록</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Filter tabs ── */}
            <div ref={listRef} className="flex gap-2 mb-6 flex-wrap">
                {FILTERS.map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        {FILTER_LABELS[s].en}
                        <span className="text-[11px] opacity-60 ml-1">· {FILTER_LABELS[s].ko}</span>
                    </button>
                ))}
            </div>

            {/* ── List ── */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-semibold">No suppliers found</p>
                    <p className="text-xs text-gray-400 mt-1">공급자 신청 내역이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {suppliers.map(s => {
                        const cfg = statusConfig[s.status] ?? statusConfig['PENDING'];
                        const isExpanded = expanded === s.id;
                        return (
                            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Row header */}
                                <button className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors"
                                    onClick={() => setExpanded(isExpanded ? null : s.id)}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="min-w-0">
                                            <div className="font-bold text-gray-900 truncate">
                                                {s.companyName}
                                                {s.brandName && <span className="text-blue-500 ml-2 text-sm font-semibold">({s.brandName})</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                {s.contactEmail}
                                                <span className="mx-1.5 opacity-40">·</span>
                                                {s.country || '—'}
                                                <span className="mx-1.5 opacity-40">·</span>
                                                {s._count.products} products <span className="opacity-60">상품</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                                            {cfg.icon}
                                            <span className="hidden sm:inline">{cfg.en}</span>
                                            <span className="sm:hidden">{cfg.ko}</span>
                                        </span>
                                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg whitespace-nowrap">
                                            {Number(s.commissionRate)}%
                                        </span>
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                            : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </button>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-5">
                                        {/* Info grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-gray-400 font-semibold mb-0.5">Registered On <span className="opacity-70">· 신청일</span></p>
                                                <p className="font-semibold text-gray-800">{new Date(s.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-semibold mb-0.5">Phone <span className="opacity-70">· 연락처</span></p>
                                                <p className="font-semibold text-gray-800">{s.phone || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-semibold mb-0.5">User Account <span className="opacity-70">· 계정</span></p>
                                                <p className="font-semibold text-gray-800 truncate">{s.user?.email || s.contactEmail}</p>
                                            </div>
                                            {s.description && (
                                                <div className="col-span-2 md:col-span-3">
                                                    <p className="text-xs text-gray-400 font-semibold mb-0.5">Brand Description <span className="opacity-70">· 브랜드 소개</span></p>
                                                    <p className="text-gray-700">{s.description}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit commission + note */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label en="Adjust Commission %" ko="수수료율 조정" />
                                                <input type="number" min={0} max={100} step={0.5}
                                                    defaultValue={String(s.commissionRate)}
                                                    onChange={e => setEditRate(r => ({ ...r, [s.id]: e.target.value }))}
                                                    className={inp} />
                                            </div>
                                            <div>
                                                <Label en="Admin Note" ko="관리자 메모 (내부용)" />
                                                <input type="text" defaultValue={s.adminNote || ''}
                                                    onChange={e => setEditNote(n => ({ ...n, [s.id]: e.target.value }))}
                                                    placeholder="Internal note — not visible to supplier · 공급자에게 보이지 않음"
                                                    className={inp} />
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <button onClick={() => handleAction(s.id, 'APPROVED')} disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-60 transition-colors">
                                                {actionLoading === s.id + 'APPROVED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Approve <span className="opacity-70 font-normal">· 승인</span>
                                            </button>
                                            <button onClick={() => handleAction(s.id, 'REJECTED')} disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-colors">
                                                {actionLoading === s.id + 'REJECTED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                Reject <span className="opacity-70 font-normal">· 거절</span>
                                            </button>
                                            <button onClick={() => handleAction(s.id, 'SUSPENDED')} disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl text-sm font-bold hover:bg-gray-600 disabled:opacity-60 transition-colors">
                                                {actionLoading === s.id + 'SUSPENDED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                Suspend <span className="opacity-70 font-normal">· 정지</span>
                                            </button>
                                            <button onClick={() => setExpanded(null)}
                                                className="ml-auto px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                                                Close <span className="opacity-60">· 닫기</span>
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
