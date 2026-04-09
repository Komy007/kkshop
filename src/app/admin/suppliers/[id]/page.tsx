'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Building2, User, Mail, Phone, MapPin, Percent,
    Calendar, Pencil, Save, X, Shield, Package, CheckCircle,
    XCircle, AlertTriangle, Loader2, Globe, FileText, Trash2,
} from 'lucide-react';

interface Supplier {
    id: string;
    companyName: string;
    brandName?: string | null;
    businessNumber?: string | null;
    ceoName?: string | null;
    businessAddress?: string | null;
    country?: string | null;
    phone?: string | null;
    contactEmail: string;
    logoUrl?: string | null;
    description?: string | null;
    commissionRate: string;
    status: string;
    adminNote?: string | null;
    createdAt: string;
    updatedAt: string;
    user?: { email: string; name?: string | null };
    stats?: { total: number; approved: number; pending: number; rejected: number };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-gray-200 text-gray-600',
};

function InfoField({ icon: Icon, label, labelKo, value, editing, name, onChange, type = 'text', placeholder }: {
    icon: React.ElementType; label: string; labelKo: string; value: string;
    editing: boolean; name: string; onChange: (n: string, v: string) => void;
    type?: string; placeholder?: string;
}) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 font-medium">
                    {label} <span className="opacity-60">{labelKo}</span>
                </p>
                {editing ? (
                    <input
                        type={type}
                        value={value}
                        onChange={e => onChange(name, e.target.value)}
                        placeholder={placeholder || label}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                ) : (
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || '—'}</p>
                )}
            </div>
        </div>
    );
}

export default function SupplierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Record<string, string>>({});
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const load = () => {
        setLoading(true);
        fetch(`/api/admin/suppliers/${id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) { setSupplier(d); initForm(d); } })
            .finally(() => setLoading(false));
    };

    const initForm = (s: Supplier) => {
        setForm({
            companyName: s.companyName || '',
            brandName: s.brandName || '',
            businessNumber: s.businessNumber || '',
            ceoName: s.ceoName || '',
            businessAddress: s.businessAddress || '',
            country: s.country || '',
            phone: s.phone || '',
            contactEmail: s.contactEmail || '',
            commissionRate: s.commissionRate || '30',
            description: s.description || '',
            adminNote: s.adminNote || '',
        });
    };

    useEffect(() => { if (id) load(); }, [id]);

    const set = (name: string, value: string) => setForm(p => ({ ...p, [name]: value }));

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/admin/suppliers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const updated = await res.json();
                setSupplier(prev => prev ? { ...prev, ...updated } : prev);
                setEditing(false);
                setMsg({ ok: true, text: 'Saved successfully' });
                load();
            } else {
                const err = await res.json();
                setMsg({ ok: false, text: err.error || 'Save failed' });
            }
        } catch {
            setMsg({ ok: false, text: 'Network error' });
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!confirm(`Change status to ${newStatus}?`)) return;
        try {
            const res = await fetch('/api/admin/suppliers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) load();
        } catch { /* ignore */ }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this supplier and all associated data? This cannot be undone.')) return;
        if (!confirm('Are you absolutely sure?')) return;
        try {
            const res = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
            if (res.ok) router.push('/admin/suppliers');
        } catch { /* ignore */ }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="max-w-3xl mx-auto py-10 px-4 text-center">
                <p className="text-gray-500">Supplier not found</p>
                <Link href="/admin/suppliers" className="text-teal-600 font-bold text-sm mt-2 inline-block">← Back to list</Link>
            </div>
        );
    }

    const s = supplier;
    const stats = s.stats || { total: 0, approved: 0, pending: 0, rejected: 0 };

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/admin/suppliers"
                    className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-extrabold text-gray-900">{s.companyName}</h1>
                    <p className="text-xs text-gray-400">{s.brandName || 'No brand name'} · {s.user?.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>
                    {s.status}
                </span>
            </div>

            {/* Message */}
            {msg && (
                <div className={`p-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {msg.text}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Products', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50' },
                    { label: 'Approved', value: stats.approved, color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-red-700', bg: 'bg-red-50' },
                ].map(c => (
                    <div key={c.label} className={`${c.bg} rounded-2xl p-4 text-center`}>
                        <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Product link */}
            <Link href={`/admin/suppliers/${id}/products`}
                className="flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm font-bold text-teal-700 hover:bg-teal-100 transition-colors">
                <Package className="w-4 h-4" /> View All Products · 전체 상품 보기
            </Link>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-sm">Supplier Profile <span className="text-xs text-gray-400 ml-1">공급자 정보</span></h2>
                    <div className="flex gap-2">
                        {editing ? (
                            <>
                                <button onClick={() => { setEditing(false); initForm(s); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    <X className="w-3.5 h-3.5" /> Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-6 py-2 divide-y md:divide-y-0">
                    <div>
                        <InfoField icon={Building2} label="Company Name" labelKo="회사명" value={form.companyName} editing={editing} name="companyName" onChange={set} />
                        <InfoField icon={FileText} label="Brand Name" labelKo="브랜드명" value={form.brandName} editing={editing} name="brandName" onChange={set} />
                        <InfoField icon={User} label="CEO Name" labelKo="대표자명" value={form.ceoName} editing={editing} name="ceoName" onChange={set} />
                        <InfoField icon={FileText} label="Business Number" labelKo="사업자번호" value={form.businessNumber} editing={editing} name="businessNumber" onChange={set} />
                        <InfoField icon={MapPin} label="Business Address" labelKo="사업장주소" value={form.businessAddress} editing={editing} name="businessAddress" onChange={set} />
                        <InfoField icon={Globe} label="Country" labelKo="국가" value={form.country} editing={editing} name="country" onChange={set} />
                    </div>
                    <div>
                        <InfoField icon={Mail} label="Contact Email" labelKo="이메일" value={form.contactEmail} editing={editing} name="contactEmail" onChange={set} type="email" />
                        <InfoField icon={Phone} label="Phone" labelKo="연락처" value={form.phone} editing={editing} name="phone" onChange={set} />
                        <InfoField icon={Percent} label="Commission Rate (%)" labelKo="수수료율" value={form.commissionRate} editing={editing} name="commissionRate" onChange={set} type="number" />
                        <InfoField icon={Calendar} label="Registered" labelKo="등록일" value={new Date(s.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} editing={false} name="" onChange={() => {}} />
                        <InfoField icon={Calendar} label="Last Updated" labelKo="수정일" value={new Date(s.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} editing={false} name="" onChange={() => {}} />
                    </div>
                </div>

                {/* Description */}
                <div className="px-6 py-4 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400 font-medium mb-1.5">Description <span className="opacity-60">설명</span></p>
                    {editing ? (
                        <textarea value={form.description} onChange={e => set('description', e.target.value)}
                            rows={3} placeholder="Brand/company description"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                    ) : (
                        <p className="text-sm text-gray-700">{s.description || '—'}</p>
                    )}
                </div>
            </div>

            {/* Admin Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-500" /> Admin Controls <span className="text-xs text-gray-400 ml-1">관리자 설정</span>
                    </h2>
                </div>

                {/* Admin Note */}
                <div className="px-6 py-4">
                    <p className="text-[11px] text-gray-400 font-medium mb-1.5">Admin Notes <span className="opacity-60">관리자 메모</span></p>
                    {editing ? (
                        <textarea value={form.adminNote} onChange={e => set('adminNote', e.target.value)}
                            rows={2} placeholder="Internal notes..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                    ) : (
                        <p className="text-sm text-gray-600">{s.adminNote || 'No notes'}</p>
                    )}
                </div>

                {/* Status Actions */}
                <div className="px-6 py-4 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400 font-medium mb-3">Status Actions <span className="opacity-60">상태 변경</span></p>
                    <div className="flex flex-wrap gap-2">
                        {s.status !== 'APPROVED' && (
                            <button onClick={() => handleStatusChange('APPROVED')}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                        )}
                        {s.status !== 'REJECTED' && (
                            <button onClick={() => handleStatusChange('REJECTED')}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                                <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                        )}
                        {s.status !== 'SUSPENDED' && s.status !== 'PENDING' && (
                            <button onClick={() => handleStatusChange('SUSPENDED')}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors">
                                <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                            </button>
                        )}
                        <button onClick={handleDelete}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors ml-auto">
                            <Trash2 className="w-3.5 h-3.5" /> Delete Supplier
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
