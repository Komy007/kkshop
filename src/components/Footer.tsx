'use client';

import React from 'react';
import { useSafeAppStore } from '@/store/useAppStore';

const footerTexts: Record<string, {
    tagline: string; tagline2: string;
    support: string; orders: string;
    info: string; about: string; delivery: string; privacy: string; terms: string;
    payments: string; copyright: string; builtWith: string;
}> = {
    en: {
        tagline: "Cambodia's No.1 Premium Cross-Border E-commerce.",
        tagline2: 'Bringing the authentic taste and quality of Korea directly to Phnom Penh.',
        support: 'Customer Support', orders: 'Online Orders: 24/7',
        info: 'Information', about: 'About Us', delivery: 'Delivery Information',
        privacy: 'Privacy Policy', terms: 'Terms of Service',
        payments: 'Accepted Payments',
        copyright: 'KKshop.cc. All rights reserved. Operating in Phnom Penh, Cambodia.',
        builtWith: 'Built with ❤️ for Global Commerce.',
    },
    ko: {
        tagline: '캄보디아 No.1 프리미엄 크로스보더 이커머스.',
        tagline2: '한국의 정통 맛과 품질을 프놈펜까지 직접 배송합니다.',
        support: '고객 지원', orders: '온라인 주문: 24시간',
        info: '정보', about: '소개', delivery: '배송 안내',
        privacy: '개인정보 처리방침', terms: '이용약관',
        payments: '결제 수단',
        copyright: 'KKshop.cc. All rights reserved. 캄보디아 프놈펜 운영.',
        builtWith: '글로벌 커머스를 위해 ❤️ 제작.',
    },
    km: {
        tagline: 'ពាណិជ្ជកម្មអេឡិចត្រូនិចឆ្លងព្រំដែនលេខ១របស់កម្ពុជា។',
        tagline2: 'នាំយកផលិតផលកូរ៉េដើមទៅកាន់រាជធានីភ្នំពេញដោយផ្ទាល់។',
        support: 'ផ្នែកគាំទ្រអតិថិជន', orders: 'បញ្ជាទិញអនឡាញ: ២៤/៧',
        info: 'ព័ត៌មាន', about: 'អំពីយើង', delivery: 'ព័ត៌មានដឹកជញ្ជូន',
        privacy: 'គោលនយោបាយភាពឯកជន', terms: 'លក្ខខណ្ឌនៃសេវាកម្ម',
        payments: 'វិធីបង់ប្រាក់',
        copyright: 'KKshop.cc។ រក្សាសិទ្ធិគ្រប់យ៉ាង។ ប្រតិបត្តិការនៅរាជធានីភ្នំពេញ កម្ពុជា។',
        builtWith: 'បង្កើតដោយ ❤️ សម្រាប់ពាណិជ្ជកម្មសកល។',
    },
    zh: {
        tagline: '柬埔寨第一跨境电商平台。',
        tagline2: '将韩国正品的品味与品质直达金边。',
        support: '客户支持', orders: '在线订购：全天候',
        info: '信息', about: '关于我们', delivery: '配送信息',
        privacy: '隐私政策', terms: '服务条款',
        payments: '支付方式',
        copyright: 'KKshop.cc. 保留所有权利。运营于柬埔寨金边。',
        builtWith: '用 ❤️ 为全球商务打造。',
    },
};

export default function Footer() {
    const store = useSafeAppStore();
    const language = store?.language || 'en';
    const t = footerTexts[language] || footerTexts.en;

    return (
        <footer className="bg-white text-gray-700 py-16 text-sm border-t border-gray-200 relative z-10 w-full">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center">
                            <span className="text-white font-bold text-lg leading-none">K</span>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tighter">
                            <span className="text-gray-900">KK</span>
                            <span className="text-[#Ef4444]">S</span>
                            <span className="text-[#EAB308]">h</span>
                            <span className="text-[#22C55E]">o</span>
                            <span className="text-[#38BDF8]">p</span>
                        </h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-6 text-sm font-medium">
                        {t.tagline}<br />
                        {t.tagline2}
                    </p>
                </div>

                <div>
                    <h3 className="text-gray-900 font-extrabold mb-4 text-base">{t.support}</h3>
                    <ul className="space-y-2 text-gray-600 font-medium">
                        <li>Email: help@kkshop.cc</li>
                        <li>Tel: +85595 779 873</li>
                        <li>Telegram: @kkshop_cc</li>
                        <li>🛒 {t.orders}</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-gray-900 font-extrabold mb-4 text-base">{t.info}</h3>
                    <ul className="space-y-2 text-gray-600 font-medium">
                        <li><a href="/about" className="hover:text-brand-primary transition-colors">{t.about}</a></li>
                        <li><a href="/shipping" className="hover:text-brand-primary transition-colors">{t.delivery}</a></li>
                        <li><a href="/privacy" className="hover:text-brand-primary transition-colors">{t.privacy}</a></li>
                        <li><a href="/terms" className="hover:text-brand-primary transition-colors">{t.terms}</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-gray-900 font-extrabold mb-4 text-base">{t.payments}</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="bg-gray-50 rounded-lg p-1 w-12 h-8 flex items-center justify-center font-bold text-[10px] text-blue-900 shadow-sm border border-gray-200">ABA</div>
                        <div className="bg-gray-50 rounded-lg p-1 w-12 h-8 flex items-center justify-center font-bold text-[10px] text-green-700 shadow-sm border border-gray-200">Wing</div>
                        <div className="bg-gray-50 rounded-lg p-1 w-12 h-8 flex items-center justify-center font-bold text-[10px] text-blue-700 shadow-sm border border-gray-200">VISA</div>
                        <div className="bg-gray-50 rounded-lg p-1 w-12 h-8 flex items-center justify-center font-bold text-[10px] text-red-600 shadow-sm border border-gray-200">Master</div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center font-medium">
                <p>&copy; {new Date().getFullYear()} {t.copyright}</p>
                <p className="mt-2 md:mt-0">{t.builtWith}</p>
            </div>
        </footer>
    );
}
