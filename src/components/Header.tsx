'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Globe, Menu, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const LANGS = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'km', label: 'ភាសាខ្មែរ', flag: '🇰🇭' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
] as const;

const translations: Record<string, any> = {
    ko: { searchPlaceholder: '상품을 검색해보세요', catBeauty: '💄 K-Beauty', catLiving: '🏠 생활/리빙', catPopular: '👑 인기 상품' },
    en: { searchPlaceholder: 'Search for products', catBeauty: '💄 K-Beauty', catLiving: '🏠 Living', catPopular: '👑 Bestsellers' },
    km: { searchPlaceholder: 'ស្វែងរកផលិតផល', catBeauty: '💄 K-Beauty', catLiving: '🏠 ជីវភាព', catPopular: '👑 ពេញនិយម' },
    zh: { searchPlaceholder: '搜索商品', catBeauty: '💄 韩国美妆', catLiving: '🏠 居家生活', catPopular: '👑 热销商品' },
};

export default function Header() {
    const { language, setLanguage } = useAppStore();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const t = translations[language] ?? translations['en']!;
    const currentLang = LANGS.find(l => l.code === language) ?? LANGS[0]!;

    const LangSelector = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className="relative">
            <button
                onClick={() => setIsLangMenuOpen(prev => !prev)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all
                    ${isMobile
                        ? 'border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
                        : 'border-gray-200 bg-white text-gray-700 shadow-sm hover:border-blue-300 hover:text-blue-600'
                    }`}
            >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLang?.flag}</span>
                <span className="uppercase">{language}</span>
            </button>
            {isLangMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />
                    <div className={`absolute z-50 mt-2 w-40 rounded-2xl shadow-2xl overflow-hidden border
                        ${isMobile ? 'right-0' : 'right-0'}
                        bg-white border-gray-100`}
                    >
                        {LANGS.map(l => (
                            <button
                                key={l.code}
                                onClick={() => { setLanguage(l.code); setIsLangMenuOpen(false); }}
                                className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors
                                    ${language === l.code
                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-base">{l.flag}</span>
                                <span>{l.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <header className="sticky top-0 z-50 w-full font-sans">
            {/* ── Mobile Top Bar (visible only on small screens) ── */}
            <div className="flex sm:hidden items-center justify-between px-4 py-2 bg-space-900 border-b border-white/10">
                <Link href="/" className="font-extrabold text-xl tracking-tighter text-white flex items-center">
                    <span className="text-brand-secondary mr-0.5">KK</span>shop
                </Link>
                {/* Language selector front and center on mobile */}
                <LangSelector isMobile />
                <div className="flex items-center gap-2">
                    <button className="text-white p-1.5">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="relative text-white p-1.5">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-rose-500 text-white rounded-full">3</span>
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(v => !v)} className="text-white p-1.5">
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* ── Mobile Category Drawer ── */}
            {isMobileMenuOpen && (
                <div className="sm:hidden bg-space-900 border-b border-white/10 px-4 py-3 flex flex-col gap-2">
                    <button className="text-left text-white/80 py-2 px-3 rounded-xl hover:bg-white/10 text-sm font-medium">{t.catBeauty}</button>
                    <button className="text-left text-white/80 py-2 px-3 rounded-xl hover:bg-white/10 text-sm font-medium">{t.catLiving}</button>
                    <button className="text-left text-white/80 py-2 px-3 rounded-xl hover:bg-white/10 text-sm font-medium">{t.catPopular}</button>
                </div>
            )}

            {/* ── Desktop Header (hidden on mobile) ── */}
            <div className="hidden sm:block w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
                {/* Desktop Top Banner */}
                <div className="bg-gray-900 text-white text-xs py-2 px-6 flex justify-between items-center">
                    <span className="text-blue-400 font-semibold">🎉 $5 할인 쿠폰 받기 →</span>
                    <LangSelector />
                </div>

                {/* Desktop Nav */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="font-extrabold text-2xl tracking-tighter text-gray-900 flex items-center lg:mr-6">
                            <span className="text-blue-600 mr-1">KK</span>shop.cc
                        </Link>

                        <div className="hidden lg:flex items-center space-x-2 mr-auto">
                            <button className="bg-white border border-gray-200 text-gray-800 font-bold py-1.5 px-4 rounded-full text-sm shadow-sm hover:border-pink-200 hover:text-pink-600 transition-all">{t.catBeauty}</button>
                            <button className="bg-white border border-gray-200 text-gray-800 font-bold py-1.5 px-4 rounded-full text-sm shadow-sm hover:border-blue-200 hover:text-blue-600 transition-all">{t.catLiving}</button>
                            <button className="bg-gray-900 text-white font-bold py-1.5 px-4 rounded-full text-sm shadow-md hover:bg-gray-800 transition-all">{t.catPopular}</button>
                        </div>

                        <div className="hidden md:flex flex-1 max-w-sm xl:max-w-md mx-4 relative">
                            <input type="text" placeholder={t.searchPlaceholder}
                                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full py-2.5 px-6 pr-12 text-sm outline-none border ring-2 ring-transparent focus:ring-blue-100 transition-all" />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center space-x-2 md:space-x-4">
                            <button className="hidden md:flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors">
                                <User className="w-6 h-6" />
                                <span className="text-[10px]">로그인</span>
                            </button>
                            <button className="relative p-2 text-gray-800 hover:text-blue-600">
                                <ShoppingCart className="w-6 h-6" />
                                <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full">3</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
