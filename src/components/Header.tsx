'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, HelpCircle, User, Globe, Menu } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const translations: Record<string, any> = {
    ko: {
        discountBanner: '$5 할인 쿠폰 받기',
        searchPlaceholder: '상품을 검색해보세요',
        login: '로그인/가입',
        cs: '고객센터',
        cart: '장바구니',
        catBeauty: '💄 K-Beauty',
        catLiving: '🏠 생활/리빙',
        catPopular: '👑 인기 상품'
    },
    en: {
        discountBanner: 'Get your $5 discount coupon',
        searchPlaceholder: 'Search for products',
        login: 'Login/Sign Up',
        cs: 'Support',
        cart: 'Cart',
        catBeauty: '💄 K-Beauty',
        catLiving: '🏠 Living/Lifestyle',
        catPopular: '👑 Bestsellers'
    },
    km: {
        discountBanner: 'ទទួលបានប័ណ្ណបញ្ចុះតម្លៃ $5 របស់អ្នក',
        searchPlaceholder: 'ស្វែងរកផលិតផល',
        login: 'ចូលគណនី / ចុះឈ្មោះ',
        cs: 'ជំនួយការអតិថិជន',
        cart: 'រទេះទំនិញ',
        catBeauty: '💄 គ្រឿងសំអាងកូរ៉េ',
        catLiving: '🏠 របៀបរស់នៅ',
        catPopular: '👑 ការពេញនិយម'
    },
    zh: {
        discountBanner: '领取您的 $5 折扣券',
        searchPlaceholder: '搜索商品',
        login: '登录/注册',
        cs: '客户服务',
        cart: '购物车',
        catBeauty: '💄 韩国美妆',
        catLiving: '🏠 居家生活',
        catPopular: '👑 热销商品'
    }
};

export default function Header() {
    const { language, setLanguage } = useAppStore();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const t = translations[language];

    // Prevent hydration mismatch for client-side zustand state
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 font-sans shadow-sm">
            {/* Top Banner */}
            <div className="bg-gray-900 text-white text-xs py-2 px-4 flex justify-between items-center">
                <div className="flex-1 text-center sm:text-left text-blue-400 font-semibold tracking-wide">
                    {t.discountBanner} &rarr;
                </div>

                {/* Language Selector */}
                <div className="relative hidden sm:block">
                    <button
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                        className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
                    >
                        <Globe className="w-3 h-3" />
                        <span className="uppercase">{language}</span>
                    </button>

                    {isLangMenuOpen && (
                        <div className="absolute right-0 mt-2 py-1 w-24 bg-white rounded shadow-xl text-gray-800 border border-gray-100">
                            <button className="block w-full text-left px-4 py-1 hover:bg-gray-50 text-xs" onClick={() => { setLanguage('ko'); setIsLangMenuOpen(false); }}>한국어 (KO)</button>
                            <button className="block w-full text-left px-4 py-1 hover:bg-gray-50 text-xs" onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }}>English (EN)</button>
                            <button className="block w-full text-left px-4 py-1 hover:bg-gray-50 text-xs" onClick={() => { setLanguage('km'); setIsLangMenuOpen(false); }}>ភាសាខ្មែរ (KM)</button>
                            <button className="block w-full text-left px-4 py-1 hover:bg-gray-50 text-xs" onClick={() => { setLanguage('zh'); setIsLangMenuOpen(false); }}>中文 (ZH)</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Mobile Menu & Logo */}
                    <div className="flex items-center">
                        <button className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 md:hidden">
                            <Menu className="w-6 h-6" />
                        </button>
                        <Link href="/" className="font-extrabold text-2xl tracking-tighter text-gray-900 flex items-center lg:mr-6 xl:mr-10">
                            <span className="text-blue-600 mr-1">KK</span>shop.cc
                        </Link>
                    </div>

                    {/* Desktop Category Navigation Pills */}
                    <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 mr-auto whitespace-nowrap overflow-hidden">
                        <button className="bg-white border border-gray-200 text-gray-800 font-bold py-1.5 px-4 rounded-full text-sm shadow-sm hover:shadow-md hover:border-pink-200 hover:text-pink-600 transition-all duration-300">
                            {t.catBeauty}
                        </button>
                        <button className="bg-white border border-gray-200 text-gray-800 font-bold py-1.5 px-4 rounded-full text-sm shadow-sm hover:shadow-md hover:border-blue-200 hover:text-blue-600 transition-all duration-300">
                            {t.catLiving}
                        </button>
                        <button className="bg-gray-900 border border-gray-900 text-white font-bold py-1.5 px-4 rounded-full text-sm shadow-md hover:shadow-lg hover:bg-gray-800 transition-all duration-300">
                            {t.catPopular}
                        </button>
                    </div>

                    {/* Expanded Search Bar (Hidden on Mobile, shown on MD+) */}
                    <div className="hidden md:flex flex-1 max-w-sm xl:max-w-md mx-4 relative">
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full py-2.5 px-6 pr-12 text-sm transition-all outline-none border ring-2 ring-transparent focus:ring-blue-100"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center space-x-2 md:space-x-6">
                        <button className="hidden md:flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 transition-colors group">
                            <User className="w-6 h-6 mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-medium">{t.login}</span>
                        </button>

                        <button className="hidden sm:flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 transition-colors group">
                            <HelpCircle className="w-6 h-6 mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-medium">{t.cs}</span>
                        </button>

                        {/* Mobile Search Icon (Instead of full bar) */}
                        <button className="md:hidden p-2 text-gray-600">
                            <Search className="w-6 h-6" />
                        </button>

                        {/* Cart Icon */}
                        <button className="relative p-2 text-gray-800 hover:text-blue-600 transition-colors">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                                3
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
