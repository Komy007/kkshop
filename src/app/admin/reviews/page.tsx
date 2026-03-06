'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, Star, CheckCircle, XCircle, Trash2, Image as ImageIcon, MessageSquare } from 'lucide-react';

interface Review {
    id: string;
    productId: string;
    productName: string;
    userId: string;
    userName: string;
    userEmail: string;
    rating: number;
    content: string;
    imageUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    PENDING: { label: '대기중', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    APPROVED: { label: '승인됨', className: 'bg-green-100 text-green-700 border-green-200' },
    REJECTED: { label: '거부됨', className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reviews');
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setActionLoading(id);
        try {
            await fetch(`/api/admin/reviews/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            await fetchAll();
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 리뷰를 완전히 삭제하시겠습니까?')) return;
        setActionLoading(id);
        try {
            await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
            await fetchAll();
        } catch (error) {
            console.error('Failed to delete review', error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-500" /> 리뷰 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">총 {reviews.length}개의 리뷰가 등록되었습니다.</p>
                </div>
                <div>
                    <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4" /> 새로고침
                    </button>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-gray-500 font-medium">리뷰 목록을 불러오는 중...</p>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">등록된 리뷰가 없습니다.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left truncate">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wider">
                                    <th className="py-4 px-5">상태</th>
                                    <th className="py-4 px-5">작성자</th>
                                    <th className="py-4 px-5 w-1/4">상품 정보 / 별점</th>
                                    <th className="py-4 px-5 w-1/3">리뷰 내용</th>
                                    <th className="py-4 px-5">이미지</th>
                                    <th className="py-4 px-5 text-right">관리 액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reviews.map(r => {
                                    const badge = STATUS_BADGE[r.status] || { label: '대기중', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
                                    const d = new Date(r.createdAt);
                                    const dateStr = `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;

                                    return (
                                        <tr key={r.id} className={`hover:bg-blue-50/30 transition-colors ${r.status === 'PENDING' ? 'bg-yellow-50/10' : ''}`}>
                                            <td className="py-4 px-5 align-top">
                                                <div className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${badge.className}`}>
                                                    {badge.label}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 align-top">
                                                <div className="font-semibold text-gray-900 text-sm">{r.userName || '알 수 없음'}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[120px]">{r.userEmail || '-'}</div>
                                                <div className="text-[11px] text-gray-400 mt-1">{dateStr}</div>
                                            </td>
                                            <td className="py-4 px-5 align-top">
                                                <div className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{r.productName}</div>
                                                <div className="flex items-center gap-0.5 text-yellow-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                    ))}
                                                    <span className="text-xs text-gray-600 font-medium ml-1.5">{r.rating}점</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 align-top">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-4">
                                                    {r.content}
                                                </p>
                                            </td>
                                            <td className="py-4 px-5 align-top">
                                                {r.imageUrl ? (
                                                    <a href={r.imageUrl} target="_blank" rel="noreferrer" className="block relative group">
                                                        <img src={r.imageUrl} alt="Review" className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                                                            <ImageIcon className="w-5 h-5 text-white" />
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-300">
                                                        <ImageIcon className="w-5 h-5 mb-1" />
                                                        <span className="text-[10px]">없음</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 align-top text-right space-y-2">
                                                <div className="flex flex-col gap-1.5 items-end">
                                                    {r.status === 'PENDING' && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(r.id, 'APPROVED')} disabled={actionLoading === r.id}
                                                                className="flex items-center justify-center w-20 gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-semibold transition-colors disabled:opacity-50">
                                                                <CheckCircle className="w-3.5 h-3.5" /> 승인
                                                            </button>
                                                            <button onClick={() => handleStatusChange(r.id, 'REJECTED')} disabled={actionLoading === r.id}
                                                                className="flex items-center justify-center w-20 gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-semibold transition-colors disabled:opacity-50">
                                                                <XCircle className="w-3.5 h-3.5" /> 거부
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status === 'REJECTED' && (
                                                        <button onClick={() => handleStatusChange(r.id, 'APPROVED')} disabled={actionLoading === r.id}
                                                            className="flex items-center justify-center w-20 gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-semibold transition-colors disabled:opacity-50">
                                                            <CheckCircle className="w-3.5 h-3.5" /> 재승인
                                                        </button>
                                                    )}
                                                    {r.status === 'APPROVED' && (
                                                        <button onClick={() => handleStatusChange(r.id, 'REJECTED')} disabled={actionLoading === r.id}
                                                            className="flex items-center justify-center w-20 gap-1 px-2.5 py-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-xs font-semibold transition-colors disabled:opacity-50">
                                                            <XCircle className="w-3.5 h-3.5" /> 승인취소
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDelete(r.id)} disabled={actionLoading === r.id}
                                                        className="flex items-center justify-center w-20 gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-red-600 rounded text-xs font-semibold transition-colors disabled:opacity-50 mt-1">
                                                        {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                        삭제
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
