'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, Plus, Trash2, Ticket, CheckCircle, XCircle } from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    descriptionKo: string | null;
    descriptionEn: string | null;
    type: string;
    discountValue: string;
    minOrderAmount: string;
    maxUses: number | null;
    usedCount: number;
    startAt: string;
    expireAt: string;
    isActive: boolean;
    createdAt: string;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState({
        code: '',
        descriptionKo: '',
        descriptionEn: '',
        type: 'PERCENT',
        discountValue: '',
        minOrderAmount: '0',
        maxUses: '',
        startAt: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 16),
        expireAt: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 16)
    });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            setCoupons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading('create');
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                setIsFormOpen(false);
                setForm({
                    ...form,
                    code: '',
                    descriptionKo: '',
                    descriptionEn: '',
                    discountValue: '',
                    maxUses: ''
                });
                await fetchAll();
            } else {
                const err = await res.json();
                alert(err.error || '생성 실패');
            }
        } catch (error) {
            console.error(error);
            alert('오류 발생');
        } finally {
            setActionLoading(null);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        try {
            await fetch(`/api/admin/coupons/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            await fetchAll();
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`쿠폰 '${code}' 삭제하시겠습니까?`)) return;
        setActionLoading(id);
        try {
            await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
            await fetchAll();
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-blue-500" /> 쿠폰 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">할인 쿠폰을 생성하고 관리합니다.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsFormOpen(!isFormOpen)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors">
                        <Plus className="w-4 h-4" /> {isFormOpen ? '닫기' : '새 쿠폰'}
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {isFormOpen && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">신규 쿠폰 생성</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">쿠폰 번호 (영문/숫자)*</label>
                                <input required type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border border-gray-300 rounded-lg px-3 py-2 uppercase font-mono" placeholder="WELCOME2026" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">할인 종류*</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="PERCENT">% 비율할인</option>
                                        <option value="FIXED">고정금액 할인 ($)</option>
                                        <option value="FREE_SHIPPING">무료배송</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">할인 값*</label>
                                    <input required type="number" step="0.01" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder={form.type === 'PERCENT' ? 'e.g. 10' : 'e.g. 5.00'} disabled={form.type === 'FREE_SHIPPING'} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">간편 설명 (한국어)</label>
                                <input type="text" value={form.descriptionKo} onChange={e => setForm({ ...form, descriptionKo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="신규가입 10% 할인" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">간편 설명 (영어)</label>
                                <input type="text" value={form.descriptionEn} onChange={e => setForm({ ...form, descriptionEn: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Welcome 10% Off" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">최소 주문금액 ($)</label>
                                <input type="number" step="0.01" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">최대 사용가능 횟수</label>
                                <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="비워두면 무제한" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">시작일시*</label>
                                <input required type="datetime-local" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">종료일시*</label>
                                <input required type="datetime-local" value={form.expireAt} onChange={e => setForm({ ...form, expireAt: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                            <button type="submit" disabled={actionLoading === 'create'} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                {actionLoading === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
                                쿠폰 등록
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20 bg-white rounded-xl border border-gray-100"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-xl border border-gray-100">
                    <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">생성된 쿠폰이 없습니다.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-600 font-semibold tracking-wider">
                                <th className="py-3 px-4">쿠폰코드</th>
                                <th className="py-3 px-4">할인 정보</th>
                                <th className="py-3 px-4">조건/제한</th>
                                <th className="py-3 px-4">유효기간</th>
                                <th className="py-3 px-4">사용량</th>
                                <th className="py-3 px-4">상태</th>
                                <th className="py-3 px-4 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {coupons.map(c => {
                                const isExpired = new Date(c.expireAt).getTime() < Date.now();

                                return (
                                    <tr key={c.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-4">
                                            <div className="font-mono font-bold text-gray-900 border border-gray-200 bg-gray-100 px-2 py-1 rounded inline-block text-sm">
                                                {c.code}
                                            </div>
                                            {(c.descriptionKo || c.descriptionEn) && (
                                                <div className="text-xs text-gray-500 mt-1">{c.descriptionKo || c.descriptionEn}</div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-red-600">
                                                {c.type === 'PERCENT' ? `${c.discountValue}%` : c.type === 'FIXED' ? `$${c.discountValue}` : '배송비무료'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-gray-600">
                                            {Number(c.minOrderAmount) > 0 ? `최소 $${c.minOrderAmount}` : '조건없음'}<br />
                                            {c.maxUses ? `최대 ${c.maxUses}회` : '무제한'}
                                        </td>
                                        <td className="py-3 px-4 text-xs">
                                            <div className="text-gray-500">{new Date(c.startAt).toLocaleDateString()}</div>
                                            <div className={isExpired ? 'text-red-500 font-medium' : 'text-gray-900'}>~{new Date(c.expireAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium">
                                            {c.usedCount} <span className="text-xs text-gray-400 font-normal">회</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button onClick={() => toggleStatus(c.id, c.isActive)} disabled={actionLoading === c.id}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.isActive ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'} transition-colors disabled:opacity-50`}>
                                                {actionLoading === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : c.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {c.isActive ? '활성' : '비활성'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button onClick={() => handleDelete(c.id, c.code)} disabled={actionLoading === c.id}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
