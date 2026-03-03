'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, ShoppingBag, Plus, ArrowRight, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

interface SupplierData {
    id: string;
    companyName: string;
    brandName?: string;
    commissionRate: number;
    status: string;
    _count: { products: number };
}

const statusInfo: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
    PENDING: { label: '심사중', color: 'text-yellow-600 bg-yellow-50', icon: <Clock className="w-5 h-5" />, desc: '관리자가 신청서를 검토 중입니다. 1~3 영업일이 소요됩니다.' },
    APPROVED: { label: '승인완료', color: 'text-green-600 bg-green-50', icon: <CheckCircle className="w-5 h-5" />, desc: '파트너십이 승인되었습니다. 상품을 등록하세요!' },
    REJECTED: { label: '거절됨', color: 'text-red-600 bg-red-50', icon: <XCircle className="w-5 h-5" />, desc: '신청이 거절되었습니다. 관리자에게 문의하세요.' },
    SUSPENDED: { label: '정지됨', color: 'text-gray-600 bg-gray-100', icon: <XCircle className="w-5 h-5" />, desc: '계정이 일시 정지되었습니다. 관리자에게 문의하세요.' },
};

export default function SupplierDashboardPage() {
    const router = useRouter();
    const [supplier, setSupplier] = useState<SupplierData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notSupplier, setNotSupplier] = useState(false);

    useEffect(() => {
        fetch('/api/supplier/register').then(r => r.json()).then(data => {
            if (!data) setNotSupplier(true);
            else setSupplier(data);
            setLoading(false);
        }).catch(() => { setNotSupplier(true); setLoading(false); });
    }, []);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    if (notSupplier) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">공급자 등록이 필요합니다</h2>
                    <p className="text-gray-500 mb-6">공급자 파트너로 신청하면 KKShop에서 상품을 판매할 수 있습니다.</p>
                    <button onClick={() => router.push('/supplier/register')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                        파트너 신청하기
                    </button>
                </div>
            </div>
        );
    }

    const sInfo = (statusInfo[supplier!.status] ?? statusInfo['PENDING'])!;
    const isApproved = supplier!.status === 'APPROVED';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{supplier!.brandName || supplier!.companyName}</h1>
                            <p className="text-sm text-gray-500 mt-1">공급자 포털 대시보드</p>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${sInfo.color}`}>
                            {sInfo.icon} {sInfo.label}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${isApproved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    {sInfo.icon}
                    <div>
                        <div className="font-semibold text-sm text-gray-900">{sInfo.label}</div>
                        <div className="text-sm text-gray-600">{sInfo.desc}</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: '등록 상품', value: supplier!._count.products, icon: <Package className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50' },
                        { label: '수수료율', value: `${Number(supplier!.commissionRate)}%`, icon: <TrendingUp className="w-6 h-6 text-green-500" />, color: 'bg-green-50' },
                        { label: '판매 현황', value: '준비중', icon: <ShoppingBag className="w-6 h-6 text-purple-500" />, color: 'bg-purple-50' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                                {stat.icon}
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                {isApproved && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 메뉴</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => router.push('/supplier/products/new')}
                                className="flex items-center gap-4 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">상품 등록</div>
                                    <div className="text-sm text-blue-200">새 상품을 KKShop에 등록</div>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto" />
                            </button>
                            <button onClick={() => router.push('/supplier/products')}
                                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-900">등록 상품 관리</div>
                                    <div className="text-sm text-gray-500">상품 수정, 재고 업데이트</div>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Commission Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">수수료 안내</h2>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span>나의 수수료율</span>
                            <span className="font-bold text-blue-600">{Number(supplier!.commissionRate)}%</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span>정산율 (판매가 기준)</span>
                            <span className="font-bold text-green-600">{100 - Number(supplier!.commissionRate)}%</span>
                        </div>
                        <p className="text-xs text-gray-400 pt-2">수수료율은 관리자와 협의를 통해 25%~35% 범위에서 조정 가능합니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
