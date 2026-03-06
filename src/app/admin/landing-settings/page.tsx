'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Megaphone, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLandingSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Trust Badges default state
    const [trustBadges, setTrustBadges] = useState({
        badge1: '🚚 $30 이상 무료배송',
        badge2: '✅ 100% 한국화장품',
        badge3: '⚡ 프놈펜 빠른 배송'
    });

    // Custom Top Banner state
    const [topBanner, setTopBanner] = useState({
        isActive: false,
        text: '🎉 3월 신규가입 10% 추가 할인 쿠폰 증정!',
        link: '/products',
        bgColor: '#E52528',
        textColor: '#FFFFFF'
    });

    useEffect(() => {
        // Fetch existing settings
        fetch('/api/admin/settings?keys=landing_trust_badges,landing_top_banner')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.forEach(setting => {
                        if (setting.key === 'landing_trust_badges' && setting.value) {
                            setTrustBadges(prev => ({ ...prev, ...(typeof setting.value === 'object' ? setting.value : {}) }));
                        } else if (setting.key === 'landing_top_banner' && setting.value) {
                            setTopBanner(prev => ({ ...prev, ...(typeof setting.value === 'object' ? setting.value : {}) }));
                        }
                    });
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await Promise.all([
                fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'landing_trust_badges', value: trustBadges })
                }),
                fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'landing_top_banner', value: topBanner })
                })
            ]);

            alert('랜딩 페이지 설정이 저장되었습니다.');
            router.refresh(); // clear Next.js client cache
        } catch (error) {
            console.error(error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-brand-primary" /> 랜딩 페이지 설정 (Landing Settings)
                </h1>
                <p className="text-sm text-gray-500 mt-1">고객이 처음 마주하는 랜딩 페이지의 프로모션 배너와 신뢰도 배지를 관리합니다.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">

                {/* 1. Trust Badges */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-900">신뢰도 뱃지 (Trust Badges)</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-500 mb-4">검색창 아래에 가로로 스크롤되며 표시되는 3개의 핵심 강조 문구입니다.</p>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">뱃지 1 (기본: 배송정책)</label>
                            <input type="text" value={trustBadges?.badge1 || ''} onChange={e => setTrustBadges({ ...trustBadges, badge1: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="🚚 $30 이상 무료배송" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">뱃지 2 (기본: 정품보증)</label>
                            <input type="text" value={trustBadges?.badge2 || ''} onChange={e => setTrustBadges({ ...trustBadges, badge2: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="✅ 100% 한국화장품" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">뱃지 3 (기본: 배송속도)</label>
                            <input type="text" value={trustBadges?.badge3 || ''} onChange={e => setTrustBadges({ ...trustBadges, badge3: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="⚡ 프놈펜 빠른 배송" required />
                        </div>
                    </div>
                </div>

                {/* 2. Top Banner Notification */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-gray-700" />
                            <h2 className="text-lg font-bold text-gray-900">상단 프로모션 배너 (Top Banner)</h2>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={topBanner?.isActive || false} onChange={e => setTopBanner({ ...topBanner, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            <span className="text-sm font-bold text-gray-700">배너 활성화</span>
                        </label>
                    </div>

                    <div className={`p-6 space-y-4 ${!(topBanner?.isActive) ? 'opacity-50 pointer-events-none' : ''}`}>
                        <p className="text-sm text-gray-500 mb-4">랜딩 페이지 최상단 검색창 아래에 띠 배너 형태로 노출되는 프로모션 영역입니다.</p>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">배너 문구</label>
                            <input type="text" value={topBanner?.text || ''} onChange={e => setTopBanner({ ...topBanner, text: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="이벤트 문구를 입력하세요" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">연결 링크 (경로)</label>
                            <input type="text" value={topBanner?.link || ''} onChange={e => setTopBanner({ ...topBanner, link: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="예: /products 또는 /category/skincare" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">배경 색상</label>
                                <div className="flex gap-2">
                                    <input type="color" value={topBanner?.bgColor || '#E52528'} onChange={e => setTopBanner({ ...topBanner, bgColor: e.target.value })} className="w-10 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer" />
                                    <input type="text" value={topBanner?.bgColor || ''} onChange={e => setTopBanner({ ...topBanner, bgColor: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">글자 색상</label>
                                <div className="flex gap-2">
                                    <input type="color" value={topBanner?.textColor || '#FFFFFF'} onChange={e => setTopBanner({ ...topBanner, textColor: e.target.value })} className="w-10 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer" />
                                    <input type="text" value={topBanner?.textColor || ''} onChange={e => setTopBanner({ ...topBanner, textColor: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 font-mono" />
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="mt-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">미리보기 (Preview)</label>
                            <div className="rounded-lg py-3 px-4 text-center text-sm font-bold shadow-sm" style={{ backgroundColor: topBanner?.bgColor || '#E52528', color: topBanner?.textColor || '#FFFFFF' }}>
                                {topBanner?.text || '미리보기 문구'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-brand-primary text-white font-bold rounded-xl shadow-md hover:bg-brand-primary/90 disabled:opacity-50">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        변경사항 저장
                    </button>
                </div>
            </form>
        </div>
    );
}
