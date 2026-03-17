'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, RefreshCw, ImageIcon, Search, ShieldCheck, Award } from 'lucide-react';

interface PendingProduct {
    id: string;
    sku: string;
    priceUsd: string;
    approvalStatus: string;
    imageUrl?: string;
    brandName?: string;
    createdAt: string;
    supplier?: { companyName: string };
    translations: { langCode: string; name: string }[];
    badgeAuthentic?: boolean;
    badgeKoreanCertified?: boolean;
}

// 뱃지 선택 후 승인 확인 패널 (인라인)
function ApproveBadgePanel({
    productName,
    onConfirm,
    onCancel,
    isProcessing,
}: {
    productName: string;
    onConfirm: (badgeAuthentic: boolean, badgeKoreanCertified: boolean) => void;
    onCancel: () => void;
    isProcessing: boolean;
}) {
    const [badgeAuthentic, setBadgeAuthentic] = useState(false);
    const [badgeKoreanCertified, setBadgeKoreanCertified] = useState(false);

    return (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
            <p className="text-sm font-bold text-green-800">
                ✅ Approve — Select Trust Badges · 신뢰 뱃지 선택
            </p>
            <p className="text-xs text-green-700 opacity-80">
                Select badges to display on the product page. Non-cosmetic products can skip the cosmetics badge.
                <span className="block opacity-70">상품 페이지에 표시할 뱃지를 선택하세요. 비화장품은 화장품 뱃지를 선택하지 않아도 됩니다.</span>
            </p>

            {/* 뱃지 선택 체크박스 */}
            <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-green-200 hover:border-pink-300 transition-colors">
                    <input
                        type="checkbox"
                        checked={badgeAuthentic}
                        onChange={e => setBadgeAuthentic(e.target.checked)}
                        className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-gray-300"
                    />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-red-400 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-800">100% Authentic Korean Cosmetics</div>
                            <div className="text-[11px] text-gray-400">100% 한국 정품 화장품 — 화장품 상품에만 적용</div>
                        </div>
                    </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-green-200 hover:border-teal-300 transition-colors">
                    <input
                        type="checkbox"
                        checked={badgeKoreanCertified}
                        onChange={e => setBadgeKoreanCertified(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 border-gray-300"
                    />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Award className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-800">Korean Certified</div>
                            <div className="text-[11px] text-gray-400">한국 인증 — 일반 한국 상품에도 적용 가능</div>
                        </div>
                    </div>
                </label>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => onConfirm(badgeAuthentic, badgeKoreanCertified)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    {isProcessing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <CheckCircle className="w-4 h-4" />
                    }
                    Confirm Approval · 승인 확정
                </button>
                <button
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    Cancel · 취소
                </button>
            </div>
        </div>
    );
}

export default function AdminPendingProductsPage() {
    const [products, setProducts] = useState<PendingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    // 뱃지 선택 패널이 열린 상품 id
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const fetch_ = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/products?approvalStatus=' + filter);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data?.products ?? []));
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetch_(); }, [fetch_]);

    const handleApproval = async (
        id: string,
        status: 'APPROVED' | 'REJECTED',
        opts?: { badgeAuthentic?: boolean; badgeKoreanCertified?: boolean; rejectReason?: string }
    ) => {
        setProcessing(id);
        await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                approvalStatus: status,
                status: status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE',
                rejectionReason: opts?.rejectReason || null,
                badgeAuthentic: opts?.badgeAuthentic ?? false,
                badgeKoreanCertified: opts?.badgeKoreanCertified ?? false,
            }),
        });
        setProcessing(null);
        setApprovingId(null);
        fetch_();
    };

    const reject = (id: string) => {
        const reason = prompt('반려 사유를 입력하세요 (판매자에게 표시됩니다):');
        if (reason !== null) handleApproval(id, 'REJECTED', { rejectReason: reason });
    };

    const filtered = products.filter(p => {
        const name = p.translations.find(t => t.langCode === 'ko')?.name || '';
        const q = search.toLowerCase();
        return !q || name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.supplier?.companyName || '').toLowerCase().includes(q);
    });

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-yellow-500" /> Review Products · 상품 검수 관리
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review and approve seller products · 판매자가 등록한 상품을 검토하고 승인/반려합니다</p>
                </div>
                <button onClick={fetch_} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {([
                    { key: 'PENDING',  label: '🟡 Under Review · 검수 대기', color: 'text-yellow-700 bg-yellow-50 border-yellow-300' },
                    { key: 'APPROVED', label: '🟢 Approved · 승인됨',        color: 'text-green-700 bg-green-50 border-green-300' },
                    { key: 'REJECTED', label: '🔴 Rejected · 반려됨',        color: 'text-red-700 bg-red-50 border-red-300' },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => { setFilter(t.key); setApprovingId(null); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === t.key ? t.color : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Product name, SKU, Seller · 상품명 또는 SKU 검색..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white shadow-sm" />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">{filter === 'PENDING' ? '🎉 No products under review! · 검수 대기 상품이 없습니다!' : 'No products found · 해당 상품이 없습니다.'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(p => {
                        const name = p.translations.find(t => t.langCode === 'ko')?.name || p.sku;
                        const isProcessing = processing === p.id;
                        const isApprovingThis = approvingId === p.id;

                        return (
                            <div key={p.id} className={`bg-white rounded-xl border shadow-sm p-4 ${filter === 'PENDING' ? 'border-yellow-200' : 'border-gray-100'}`}>
                                {/* 상품 기본 정보 행 */}
                                <div className="flex items-center gap-4">
                                    {p.imageUrl
                                        ? <img src={p.imageUrl} alt={name} className="w-16 h-16 object-cover rounded-xl border flex-shrink-0" />
                                        : <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900">{name}</div>
                                        <div className="text-xs text-gray-400">{p.sku} · ${Number(p.priceUsd).toFixed(2)}</div>
                                        <div className="text-xs text-blue-600 mt-0.5">Seller · 셀러: {p.supplier?.companyName || '-'}</div>
                                        <div className="text-xs text-gray-400">Registered · 등록일: {new Date(p.createdAt).toLocaleDateString('ko-KR')}</div>
                                        {/* 승인된 상품의 뱃지 현황 표시 */}
                                        {filter !== 'PENDING' && (p.badgeAuthentic || p.badgeKoreanCertified) && (
                                            <div className="flex gap-1.5 mt-1 flex-wrap">
                                                {p.badgeAuthentic && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-pink-600 border border-pink-200">
                                                        <ShieldCheck className="w-3 h-3" /> Authentic Cosmetics
                                                    </span>
                                                )}
                                                {p.badgeKoreanCertified && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-600 border border-teal-200">
                                                        <Award className="w-3 h-3" /> Korean Certified
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 검수 대기 상태: 승인/반려 버튼 */}
                                    {filter === 'PENDING' && (
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => setApprovingId(isApprovingThis ? null : p.id)}
                                                disabled={isProcessing}
                                                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors ${isApprovingThis ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                            >
                                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Approve · 승인
                                            </button>
                                            <button onClick={() => reject(p.id)} disabled={isProcessing}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 border border-red-200">
                                                <XCircle className="w-4 h-4" />
                                                Reject · 반려
                                            </button>
                                        </div>
                                    )}

                                    {/* 승인/반려 완료 뱃지 */}
                                    {filter !== 'PENDING' && (
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${filter === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                            {filter === 'APPROVED' ? '✅ Approved · 승인됨' : '❌ Rejected · 반려됨'}
                                        </span>
                                    )}
                                </div>

                                {/* 뱃지 선택 패널 — Approve 클릭 시 인라인 표시 */}
                                {isApprovingThis && (
                                    <ApproveBadgePanel
                                        productName={name}
                                        onConfirm={(badgeAuthentic, badgeKoreanCertified) =>
                                            handleApproval(p.id, 'APPROVED', { badgeAuthentic, badgeKoreanCertified })
                                        }
                                        onCancel={() => setApprovingId(null)}
                                        isProcessing={isProcessing}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
