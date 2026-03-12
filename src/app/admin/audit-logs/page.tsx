'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Search, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface AuditLog {
    id: string;
    userEmail: string;
    userRole: string;
    action: string;
    resource: string | null;
    resourceId: string | null;
    details: Record<string, unknown> | null;
    ipAddress: string | null;
    createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
    CREATE_PRODUCT: 'bg-green-100 text-green-700',
    UPDATE_PRODUCT: 'bg-blue-100 text-blue-700',
    DELETE_PRODUCT: 'bg-red-100 text-red-700',
    APPROVE_SUPPLIER: 'bg-green-100 text-green-700',
    REJECT_SUPPLIER: 'bg-red-100 text-red-700',
    UPDATE_USER_ROLE: 'bg-purple-100 text-purple-700',
    RESET_USER_PASSWORD: 'bg-yellow-100 text-yellow-700',
    ENABLE_2FA: 'bg-teal-100 text-teal-700',
    DISABLE_2FA: 'bg-orange-100 text-orange-700',
    CREATE_COUPON: 'bg-green-100 text-green-700',
    DELETE_COUPON: 'bg-red-100 text-red-700',
    UPDATE_SETTINGS: 'bg-gray-100 text-gray-700',
    UPDATE_ORDER_STATUS: 'bg-blue-100 text-blue-700',
    CREATE_ADMIN_USER: 'bg-purple-100 text-purple-700',
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const pageSize = 30;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
                ...(search && { search }),
                ...(actionFilter && { action: actionFilter }),
            });
            const res = await fetch(`/api/admin/audit-logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs ?? []);
                setTotal(data.total ?? 0);
            }
        } finally {
            setLoading(false);
        }
    }, [page, search, actionFilter]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const totalPages = Math.ceil(total / pageSize);

    function formatAction(action: string) {
        return action.replace(/_/g, ' ');
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">감사 로그 / Audit Logs</h1>
                        <p className="text-sm text-gray-500">관리자 행동 추적 기록</p>
                    </div>
                </div>
                <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50">
                    <RefreshCw className="w-4 h-4" />
                    새로고침
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="이메일 또는 리소스 검색..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={actionFilter}
                        onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white appearance-none"
                    >
                        <option value="">전체 액션</option>
                        {Object.keys(ACTION_COLORS).map(a => (
                            <option key={a} value={a}>{formatAction(a)}</option>
                        ))}
                    </select>
                </div>
                <span className="ml-auto flex items-center text-sm text-gray-500">
                    총 {total.toLocaleString()}건
                </span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">시각</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">관리자</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">역할</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">액션</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">대상</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">IP</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">상세</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={7} className="py-12 text-center text-gray-400">로딩 중...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={7} className="py-12 text-center text-gray-400">로그가 없습니다.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <React.Fragment key={log.id}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Phnom_Penh' })}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{log.userEmail}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${log.userRole === 'SUPERADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {log.userRole}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                                                    {formatAction(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {log.resource}{log.resourceId ? ` #${log.resourceId}` : ''}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ipAddress || '-'}</td>
                                            <td className="px-4 py-3">
                                                {log.details && (
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                    >
                                                        {expandedId === log.id ? '접기' : '보기'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedId === log.id && log.details && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-3 bg-gray-50">
                                                    <pre className="text-xs text-gray-600 bg-white border rounded p-3 overflow-auto max-h-40">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                        <span className="text-sm text-gray-500">{page} / {totalPages} 페이지</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded border hover:bg-white disabled:opacity-40">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded border hover:bg-white disabled:opacity-40">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
