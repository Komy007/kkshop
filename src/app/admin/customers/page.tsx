'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Users, Loader2, Trash2, Key, Search, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';

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

type ModalState =
    | { type: 'none' }
    | { type: 'roleChange'; id: string; name: string; newRole: string }
    | { type: 'resetPw'; id: string; email: string }
    | { type: 'delete'; id: string; name: string };

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState>({ type: 'none' });
    const [pwInput, setPwInput] = useState('');
    const [pwError, setPwError] = useState('');
    const [toast, setToast] = useState('');
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const fetchCustomers = useCallback(async (p = page, q = search) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p) });
        if (q) params.set('search', q);
        const res = await fetch(`/api/admin/customers?${params}`);
        const data = await res.json();
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
        setTotal(data.total ?? 0);
        setPageSize(data.pageSize ?? 50);
        setLoading(false);
    }, [page, search]);

    useEffect(() => { fetchCustomers(page, search); }, [page, search]);

    const handleSearchChange = (val: string) => {
        setSearchInput(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            setSearch(val);
        }, 400);
    };

    const confirmRoleChange = async () => {
        if (modal.type !== 'roleChange') return;
        setProcessing(modal.id + '_role');
        setModal({ type: 'none' });
        await fetch('/api/admin/customers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: modal.id, role: modal.newRole }) });
        setProcessing(null);
        fetchCustomers(page, search);
    };

    const confirmResetPassword = async () => {
        if (modal.type !== 'resetPw') return;
        if (!pwInput || pwInput.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
        setProcessing(modal.id + '_pw');
        const id = modal.id;
        setModal({ type: 'none' });
        const res = await fetch('/api/admin/customers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, newPassword: pwInput }) });
        const data = await res.json();
        setProcessing(null);
        setPwInput('');
        setPwError('');
        showToast(data.success ? '✅ Password updated.' : '❌ Failed: ' + data.error);
    };

    const confirmDelete = async () => {
        if (modal.type !== 'delete') return;
        setProcessing(modal.id + '_del');
        const id = modal.id;
        setModal({ type: 'none' });
        await fetch(`/api/admin/customers?id=${id}`, { method: 'DELETE' });
        setProcessing(null);
        fetchCustomers(page, search);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
                    {toast}
                </div>
            )}

            {/* Role Change Modal */}
            {modal.type === 'roleChange' && (
                <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setModal({ type: 'none' })}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Change Role</h3>
                            <button onClick={() => setModal({ type: 'none' })}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-600 mb-5">
                            Change <span className="font-semibold">{modal.name}</span>&apos;s role to{' '}
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_COLORS[modal.newRole] ?? 'bg-gray-100 text-gray-700'}`}>{modal.newRole}</span>?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button onClick={confirmRoleChange} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {modal.type === 'resetPw' && (
                <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => { setModal({ type: 'none' }); setPwInput(''); setPwError(''); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Reset Password</h3>
                            <button onClick={() => { setModal({ type: 'none' }); setPwInput(''); setPwError(''); }}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Account: <span className="font-medium text-gray-700">{modal.email}</span></p>
                        <input
                            type="password"
                            value={pwInput}
                            onChange={e => { setPwInput(e.target.value); setPwError(''); }}
                            placeholder="New password (min 8 chars)"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
                        />
                        {pwError && <p className="text-xs text-red-500 mb-2">{pwError}</p>}
                        <div className="flex gap-2 justify-end mt-4">
                            <button onClick={() => { setModal({ type: 'none' }); setPwInput(''); setPwError(''); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button onClick={confirmResetPassword} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">Reset</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {modal.type === 'delete' && (
                <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setModal({ type: 'none' })}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Delete Member</h3>
                            <button onClick={() => setModal({ type: 'none' })}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            Delete <span className="font-semibold">{modal.name}</span>?
                        </p>
                        <p className="text-xs text-red-500 mb-5">All associated data including orders will be permanently removed.</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-500" /> Customer Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} members total</p>
                </div>
                <button onClick={() => fetchCustomers(page, search)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" value={searchInput} onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm" />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            ) : (
                <>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                                        <th className="py-3 px-4">Member</th>
                                        <th className="py-3 px-4 hidden md:table-cell">Contact</th>
                                        <th className="py-3 px-4">Role</th>
                                        <th className="py-3 px-4 hidden sm:table-cell">Joined</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {customers.map(c => {
                                        const isProcessing = (suffix: string) => processing === c.id + suffix;
                                        return (
                                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            {(c.name || c.email || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 text-sm">{c.name || '(No name)'}</div>
                                                            <div className="text-xs text-gray-400">{c.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-500">{c.phone || '-'}</td>
                                                <td className="py-3 px-4">
                                                    <select value={c.role}
                                                        onChange={e => setModal({ type: 'roleChange', id: c.id, name: c.name || c.email || c.id, newRole: e.target.value })}
                                                        disabled={!!processing}
                                                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${ROLE_COLORS[c.role] || 'bg-gray-100 text-gray-700'}`}>
                                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </td>
                                                <td className="py-3 px-4 hidden sm:table-cell text-xs text-gray-400">
                                                    {new Date(c.createdAt).toLocaleDateString('en-US')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => { setPwInput(''); setPwError(''); setModal({ type: 'resetPw', id: c.id, email: c.email || '' }); }}
                                                            disabled={!!processing}
                                                            title="Reset Password"
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50">
                                                            {isProcessing('_pw') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => setModal({ type: 'delete', id: c.id, name: c.name || c.email || c.id })}
                                                            disabled={!!processing}
                                                            title="Delete Member"
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                                                            {isProcessing('_del') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {customers.length === 0 && (
                                        <tr><td colSpan={5} className="py-10 text-center text-gray-400 text-sm">No customers found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-gray-500">
                                {((page - 1) * pageSize + 1).toLocaleString()}–{Math.min(page * pageSize, total).toLocaleString()} of {total.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-700 px-2">{page} / {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
