'use client';

import React from 'react';
import Link from 'next/link';
import { useSafeAppStore } from '@/store/useAppStore';
import { ShoppingCart, Clock, Home } from 'lucide-react';

const notices: Record<string, { title: string; body: string; sub: string; backCart: string; backHome: string }> = {
    en: {
        title: 'Payment Not Yet Available',
        body: 'We have not connected the payment system yet.\nIt will be activated at the official launch.',
        sub: 'You can still browse products and add them to your cart.',
        backCart: 'Back to Cart',
        backHome: 'Go to Home',
    },
    ko: {
        title: '결제 미연결 안내',
        body: '현재 결제를 연결하지 않았습니다.\n정식 오픈 시 연결됩니다.',
        sub: '지금은 상품을 둘러보고 장바구니에 담아두세요.',
        backCart: '장바구니로 돌아가기',
        backHome: '홈으로',
    },
    km: {
        title: 'ការទូទាត់មិនទាន់បើក',
        body: 'ការទូទាត់មិនទាន់ត្រូវបានភ្ជាប់នៅឡើយ។\nវានឹងត្រូវបានដំណើរការនៅពេលបើកជាផ្លូវការ។',
        sub: 'អ្នកអាចរកមើលផលិតផល ហើយបន្ថែមទៅក្នុងរទេះ។',
        backCart: 'ត្រឡប់ទៅរទេះ',
        backHome: 'ទៅទំព័រដើម',
    },
    zh: {
        title: '支付功能尚未开放',
        body: '当前支付系统尚未连接。\n正式开放时将会开通。',
        sub: '您可以浏览商品并将其加入购物车。',
        backCart: '返回购物车',
        backHome: '返回首页',
    },
};

export default function CheckoutPage() {
    const store = useSafeAppStore();
    const lang = store?.language || 'en';
    const t = notices[lang] || notices.en;

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
            {/* Notice Card */}
            <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-amber-100 p-8 text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-5">
                    <Clock className="w-8 h-8 text-amber-500" />
                </div>

                <h1 className="text-xl font-black text-gray-900 mb-3">{t.title}</h1>

                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-2">
                    {t.body}
                </p>
                <p className="text-gray-400 text-xs mb-8">{t.sub}</p>

                {/* All 4 languages shown together */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8 text-left space-y-1.5">
                    {Object.values(notices).map((n, i) => (
                        <p key={i} className="text-xs text-amber-700 leading-relaxed whitespace-pre-line">{n.body}</p>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/cart"
                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {t.backCart}
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                        <Home className="w-4 h-4" />
                        {t.backHome}
                    </Link>
                </div>
            </div>
        </main>
    );
}
