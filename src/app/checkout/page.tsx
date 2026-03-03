'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, selectTotalPrice } from '@/store/useCartStore';
import { useAppStore } from '@/store/useAppStore';

const checkoutTranslations: Record<string, any> = {
    ko: {
        notice: '현재 테스트 중입니다.',
        sub: '홈페이지 정식 오픈하면 결제가 연결됩니다.',
        goHome: '홈으로 돌아가기',
        empty: '장바구니가 비어있습니다.',
    },
    en: {
        notice: 'Currently under testing.',
        sub: 'Payment will be connected when the website officially launches.',
        goHome: 'Return to Home',
        empty: 'Your cart is empty.',
    },
    km: {
        notice: 'កំពុងសាកល្បង។',
        sub: 'ការទូទាត់នឹងត្រូវបានភ្ជាប់នៅពេលគេហទំព័របើកដំណើរការផ្លូវការ។',
        goHome: 'ត្រឡប់ទៅគេហទំព័រ',
        empty: 'រទេះរបស់អ្នកទទេ។',
    },
    zh: {
        notice: '目前正在测试中。',
        sub: '网站正式上线后将连接支付功能。',
        goHome: '返回主页',
        empty: '购物车是空的。',
    }
};

export default function CheckoutPage() {
    const router = useRouter();
    const { language } = useAppStore();
    const t = checkoutTranslations[language] || checkoutTranslations.en;
    const items = useCartStore((s) => s.items);

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center gap-4">
                <div className="text-5xl">🛒</div>
                <p className="text-xl font-bold text-white">{t.empty}</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90"
                >
                    {t.goHome}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Top colour bar */}
                <div className="h-2 bg-gradient-to-r from-brand-primary to-blue-500" />

                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">
                        🔧
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{t.notice}</h1>

                    {/* Subtitle */}
                    <p className="text-gray-500 font-medium mb-6 leading-relaxed">{t.sub}</p>

                    {/* All 4 languages for clarity */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-7 space-y-2 text-left border border-gray-100">
                        <p className="text-sm font-bold text-gray-800">🇰🇷 현재 테스트 중입니다. 홈페이지 정식 오픈하면 결제가 연결됩니다.</p>
                        <p className="text-sm font-bold text-gray-800">🇺🇸 Currently under testing. Payment will be connected when the website officially launches.</p>
                        <p className="text-sm font-bold text-gray-800">🇰🇭 កំពុងសាកល្បង។ ការទូទាត់នឹងត្រូវបានភ្ជាប់នៅពេលគេហទំព័របើកផ្លូវការ។</p>
                        <p className="text-sm font-bold text-gray-800">🇨🇳 目前正在测试中。网站正式上线后将连接支付功能。</p>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-4 bg-brand-primary text-white rounded-2xl font-extrabold text-base hover:bg-brand-primary/90 transition-all shadow-sm"
                    >
                        {t.goHome}
                    </button>
                </div>
            </div>
        </div>
    );
}

