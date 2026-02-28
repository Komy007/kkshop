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
    ko: {
        searchPlaceholder: '상품을 검색해보세요', catBeauty: '💄 K-Beauty', catLiving: '🏠 생활/리빙', catPopular: '👑 인기 상품',
        aboutUsTitle: '회사 소개',
        aboutUsText: 'KKshop은 Khmer/Korea의 약자입니다. 캄보디아 No.1 프리미엄 크로스보더 이커머스. 한국의 진짜 맛과 품질을 프놈펜으로 직배송합니다. 화장품은 100% 한국산이며, 나머지 생활용품은 한국산 및 외국산 중 한국에서 선택된 가성비 좋은 상품만 캄보디아에 판매합니다.',
        langSelect: '언어 선택',
    },
    en: {
        searchPlaceholder: 'Search for products', catBeauty: '💄 K-Beauty', catLiving: '🏠 Living', catPopular: '👑 Bestsellers',
        aboutUsTitle: 'About Us',
        aboutUsText: "KKshop stands for Khmer/Korea. Cambodia's No.1 Premium Cross-Border E-commerce. Bringing the authentic taste and quality of Korea directly to Phnom Penh. Cosmetics are 100% Korean, and other daily necessities include both Korean and foreign products, carefully selected in Korea for their cost-effectiveness and sold in Cambodia.",
        langSelect: 'Select Language',
    },
    km: {
        searchPlaceholder: 'ស្វែងរកផលិតផល', catBeauty: '💄 K-Beauty', catLiving: '🏠 ជីវភាព', catPopular: '👑 ពេញនិយម',
        aboutUsTitle: 'អំពីយើង',
        aboutUsText: 'KKshop មកពីពាក្យ Khmer/Korea។ ជាវេទិកាពាណិជ្ជកម្មតាមប្រព័ន្ធអេឡិចត្រូនិកឆ្លងដែនកម្រិតខ្ពស់លេខ១នៅកម្ពុជា។ នាំយករសជាតិ និងគុណភាពពិតប្រាកដរបស់កូរ៉េមកកាន់រាជធានីភ្នំពេញដោយផ្ទាល់។ គ្រឿងសំអាងគឺជារបស់កូរ៉េ 100% ហើយទំនិញប្រើប្រាស់ប្រចាំថ្ងៃផ្សេងទៀតរួមមានទាំងផលិតផលកូរ៉េ និងបរទេស ដែលត្រូវបានជ្រើសរើសយ៉ាងយកចិត្តទុកដាក់នៅប្រទេសកូរ៉េដើម្បីទទួលបានតម្លៃសមរម្យល្អបំផុត និងដាក់លក់នៅកម្ពុជា។',
        langSelect: 'ជ្រើសរើសភាសា',
    },
    zh: {
        searchPlaceholder: '搜索商品', catBeauty: '💄 韩国美妆', catLiving: '🏠 居家生活', catPopular: '👑 热销商品',
        aboutUsTitle: '关于我们',
        aboutUsText: 'KKshop是Khmer/Korea的缩写。柬埔寨第一的高端跨境电商。将韩国地道的味道和品质直接送到金边。化妆品为100%韩国原装，其他生活用品包括在韩国精心挑选的高性价比中外产品，在柬埔寨销售。',
        langSelect: '选择语言',
    },
};

export default function Header() {
    const { language, setLanguage } = useAppStore();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isLangDrawerOpen, setIsLangDrawerOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined' && !localStorage.getItem('kkshop-lang-initialized')) {
            requestAnimationFrame(() => {
                const browserLang = navigator.language.slice(0, 2);
                const supported = LANGS.map(l => l.code);
                if (supported.includes(browserLang as any)) {
                    setLanguage(browserLang as any);
                }
                localStorage.setItem('kkshop-lang-initialized', 'true');
            });
        }
    }, [setLanguage]);

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
                    <span className="text-white mr-0.5">KK</span>
                    <span className="text-[#Ef4444]">S</span>
                    <span className="text-[#EAB308]">h</span>
                    <span className="text-[#22C55E]">o</span>
                    <span className="text-[#38BDF8]">p</span>
                </Link>
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                    <button className="text-white p-1.5">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="relative text-white p-1.5">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-rose-500 text-white rounded-full">3</span>
                    </button>
                    <button onClick={() => setIsLangDrawerOpen(v => !v)} className="text-white p-1.5">
                        {isLangDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* ── Mobile Language Drawer ── */}
            {isLangDrawerOpen && (
                <div className="sm:hidden fixed inset-x-0 top-[53px] bottom-0 bg-space-900 border-t border-white/10 z-40 flex flex-col pt-6 pb-8 overflow-y-auto">
                    <div className="px-6 flex-1">
                        <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">{t.langSelect}</h3>
                        <div className="flex flex-col gap-3">
                            {LANGS.map(l => (
                                <button
                                    key={l.code}
                                    onClick={() => { setLanguage(l.code); setIsLangDrawerOpen(false); }}
                                    className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all border
                                        ${language === l.code
                                            ? 'bg-blue-600/20 border-blue-500/50 text-white font-bold'
                                            : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-2xl">{l.flag}</span>
                                    <span className="text-base flex-1 text-left">{l.label}</span>
                                    {language === l.code && (
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 px-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                <span className="text-brand-secondary">KK</span>shop - {t.aboutUsTitle}
                            </h4>
                            <p className="text-sm text-white/70 leading-relaxed text-left">
                                {t.aboutUsText}
                            </p>
                        </div>
                    </div>
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
                            <span className="text-gray-900 mr-1">KK</span>
                            <span className="text-[#Ef4444]">S</span>
                            <span className="text-[#EAB308]">h</span>
                            <span className="text-[#22C55E]">o</span>
                            <span className="text-[#38BDF8]">p</span>
                            <span className="text-gray-400 text-sm ml-1">.cc</span>
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
