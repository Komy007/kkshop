'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Loader2, Trash2, Key, Shield, Search, RefreshCw, UserCheck } from 'lucide-react';

interface Customer {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    phone?: string | null;
    createdAt: string;
    _count?: { orders: number };
}

const ROLES = ['USER', 'SUPPLIER', 'ADMIN', 'SUPERADMIN'];
const ROLE_COLORS: Record<string, string> = {
    SUPERADMIN: 'bg-red-100 text-red-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    SUPPLIER: 'bg-yellow-100 text-yellow-700',
    USER: 'bg-green-100 text-green-700',
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/customers');
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const changeRole = async (id: string, role: string) => {
        if (!confirm(`이 회원의 역할을 "${role}"로 변경하시겠습니까?`)) return;
        setProcessing(id + '_role');
        await fetch('/api/admin/customers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) });
        setProcessing(null);
        fetchCustomers();
    };

    const resetPassword = async (id: string, email: string) => {
        const newPw = prompt(`"${email}" 회원의 새 비밀번호를 입력하세요 (최소 8자):`);
        if (!newPw || newPw.length < 8) { alert('비밀번호는 최소 8자 이상이어야 합니다.'); return; }
        setProcessing(id + '_pw');
        const res = await fetch('/api/admin/customers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, newPassword: newPw }) });
        const data = await res.json();
        setProcessing(null);
        alert(data.success ? '✅ 비밀번호가 변경되었습니다.' : '❌ 변경 실패: ' + data.error);
    };

    const deleteCustomer = async (id: string, name: string) => {
        if (!confirm(`"${name || '이 회원'}"을 삭제하시겠습니까?\n주문 기록 등 모든 관련 데이터가 삭제됩니다.`)) return;
        setProcessing(id + '_del');
        await fetch(`/api/admin/customers?id=${id}`, { method: 'DELETE' });
        setProcessing(null);
        fetchCustomers();
    };

    const filtered = customers.filter(c => {
        const q = search.toLowerCase();
        return !q || (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    });

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-500" /> 회원 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">총 {customers.length}명 회원</p>
                </div>
                <button onClick={fetchCustomers} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="이름, 이메일 검색..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm" />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                                <th className="py-3 px-4">회원 정보</th>
                                <th className="py-3 px-4 hidden md:table-cell">연락처</th>
                                <th className="py-3 px-4">역할 변경</th>
                                <th className="py-3 px-4 hidden sm:table-cell">가입일</th>
                                <th className="py-3 px-4 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(c => {
                                const isProcessing = (suffix: string) => processing === c.id + suffix;
                                return (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {(c.name || c.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm">{c.name || '(이름 없음)'}</div>
                                                    <div className="text-xs text-gray-400">{c.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-500">{c.phone || '-'}</td>
                                        <td className="py-3 px-4">
                                            <select value={c.role} onChange={e => changeRole(c.id, e.target.value)}
                                                disabled={!!processing}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${ROLE_COLORS[c.role] || 'bg-gray-100 text-gray-700'}`}>
                                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell text-xs text-gray-400">
                                            {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => resetPassword(c.id, c.email || '')}
                                                    disabled={!!processing}
                                                    title="비밀번호 초기화"
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50">
                                                    {isProcessing('_pw') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => deleteCustomer(c.id, c.name || c.email || '')}
                                                    disabled={!!processing}
                                                    title="회원 삭제"
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                                                    {isProcessing('_del') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-400 text-sm">회원이 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
