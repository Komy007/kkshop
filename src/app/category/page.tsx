'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Droplets, Palette, Bath, Sofa, HeartPulse, UtensilsCrossed, Crown, Sparkles, Flame, Package, type LucideIcon } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';
import Footer from '@/components/Footer';

const categoryTranslations: Record<string, any> = {
    ko: {
        title: '카테고리',
        skincare: '스킨케어', makeup: '메이크업', hairBody: '헤어/바디',
        living: '생활용품', health: '건강식품', fnb: '한국식품',
        best: '베스트', newArrivals: '신상품', sale: '할인', all: '전체 상품 보기'
    },
    en: {
        title: 'Category',
        skincare: 'Skincare', makeup: 'Makeup', hairBody: 'Hair/Body',
        living: 'Living', health: 'Health', fnb: 'Korean F&B',
        best: 'Bestseller', newArrivals: 'New', sale: 'Sale', all: 'View All Products'
    },
    km: {
        title: 'ប្រភេទ',
        skincare: 'ថែស្បែក', makeup: 'គ្រឿងសំអាង', hairBody: 'សក់/រាងកាយ',
        living: 'គ្រឿងប្រើប្រាស់', health: 'សុខភាព', fnb: 'ម្ហូបកូរ៉េ',
        best: 'ពេញនិយម', newArrivals: 'ថ្មី', sale: 'បញ្ចុះតម្លៃ', all: 'ផលិតផលទាំងអស់'
    },
    zh: {
        title: '分类',
        skincare: '护肤', makeup: '彩妆', hairBody: '洗护',
        living: '生活用品', health: '保健品', fnb: '韩国食品',
        best: '热销', newArrivals: '新品', sale: '折扣', all: '全部商品'
    }
};

interface CategoryItem {
    key: string;
    icon: LucideIcon;
    href: string;
    gradient: string;
    iconColor: string;
    shadowColor: string;
    badge?: string;
    badgeGradient?: string;
}

const categories: CategoryItem[] = [
    {
        key: 'skincare', icon: Droplets,
        href: '/category/skincare',
        gradient: 'linear-gradient(135deg, #FFDEE9 0%, #F8B4D9 50%, #E879A8 100%)',
        iconColor: 'text-pink-600', shadowColor: 'shadow-pink-300/50',
    },
    {
        key: 'makeup', icon: Palette,
        href: '/category/makeup',
        gradient: 'linear-gradient(135deg, #FFC3D4 0%, #FF8FAB 50%, #E8527A 100%)',
        iconColor: 'text-rose-700', shadowColor: 'shadow-rose-300/50',
    },
    {
        key: 'hairBody', icon: Bath,
        href: '/category/hair-body',
        gradient: 'linear-gradient(135deg, #C3F0FF 0%, #7DD3FC 50%, #38BDF8 100%)',
        iconColor: 'text-sky-700', shadowColor: 'shadow-sky-300/50',
    },
    {
        key: 'living', icon: Sofa,
        href: '/category/living',
        gradient: 'linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 50%, #34D399 100%)',
        iconColor: 'text-emerald-700', shadowColor: 'shadow-emerald-300/50',
    },
    {
        key: 'health', icon: HeartPulse,
        href: '/category/health',
        gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 50%, #F59E0B 100%)',
        iconColor: 'text-amber-700', shadowColor: 'shadow-amber-300/50',
    },
    {
        key: 'fnb', icon: UtensilsCrossed,
        href: '/category/fnb',
        gradient: 'linear-gradient(135deg, #FFEDD5 0%, #FDBA74 50%, #F97316 100%)',
        iconColor: 'text-orange-700', shadowColor: 'shadow-orange-300/50',
        badge: 'KOREA', badgeGradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    },
    {
        key: 'best', icon: Crown,
        href: '/category/best',
        gradient: 'linear-gradient(135deg, #FEF9C3 0%, #FDE047 50%, #EAB308 100%)',
        iconColor: 'text-yellow-700', shadowColor: 'shadow-yellow-300/50',
        badge: 'BEST', badgeGradient: 'linear-gradient(135deg, #F97316, #EA580C)',
    },
    {
        key: 'newArrivals', icon: Sparkles,
        href: '/category/new',
        gradient: 'linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 50%, #8B5CF6 100%)',
        iconColor: 'text-violet-700', shadowColor: 'shadow-violet-300/50',
        badge: 'NEW', badgeGradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    },
    {
        key: 'sale', icon: Flame,
        href: '/category/sale',
        gradient: 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 50%, #EF4444 100%)',
        iconColor: 'text-red-600', shadowColor: 'shadow-red-300/50',
        badge: 'SALE', badgeGradient: 'linear-gradient(135deg, #EF4444, #B91C1C)',
    },
];

export default function CategoryIndexPage() {
    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
    const t = categoryTranslations[language] || categoryTranslations.en;

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 pb-24">
            {/* Header Area */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-black">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-extrabold text-black tracking-tight">{t.title}</h1>
                </div>
                <Link href="/search" className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                    <Search className="w-6 h-6" />
                </Link>
            </div>

            {/* Content */}
            <div className="px-4 py-6 max-w-lg mx-auto">
                <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                    {categories.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className="group flex flex-col items-center gap-2.5"
                            >
                                <div className="relative">
                                    {/* Glow ring on hover */}
                                    <div
                                        className="absolute -inset-1.5 rounded-[22px] opacity-0 group-hover:opacity-40 group-active:opacity-50 transition-opacity duration-300 blur-md"
                                        style={{ background: item.gradient }}
                                    />

                                    {/* Icon container */}
                                    <div
                                        className={`
                                            relative w-20 h-20 sm:w-24 sm:h-24
                                            rounded-2xl
                                            flex items-center justify-center
                                            shadow-lg ${item.shadowColor}
                                            group-hover:scale-110 group-active:scale-95
                                            transition-all duration-300 ease-out
                                            overflow-hidden
                                        `}
                                        style={{ background: item.gradient }}
                                    >
                                        {/* Glass highlight */}
                                        <div
                                            className="absolute inset-0 rounded-2xl"
                                            style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)' }}
                                        />
                                        {/* Inner border */}
                                        <div
                                            className="absolute inset-[0.5px] rounded-2xl pointer-events-none"
                                            style={{ border: '1px solid rgba(255,255,255,0.4)' }}
                                        />
                                        <Icon
                                            className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 ${item.iconColor} drop-shadow-sm group-hover:scale-110 transition-transform duration-300`}
                                            strokeWidth={2}
                                        />
                                    </div>

                                    {/* Badge */}
                                    {item.badge && (
                                        <span
                                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-white text-[9px] font-black tracking-wider px-2 py-[3px] rounded-full leading-none whitespace-nowrap shadow-md group-hover:scale-110 transition-transform duration-300"
                                            style={{ background: item.badgeGradient }}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </div>

                                <span className="text-[13px] sm:text-[14px] font-bold text-gray-800 group-hover:text-gray-900 transition-colors text-center">
                                    {t[item.key]}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Link href="/category/all" className="w-full flex items-center justify-center gap-2 p-4 bg-white border border-gray-300 rounded-xl font-bold text-gray-900 shadow-sm active:bg-gray-50 hover:bg-gray-50 transition-colors">
                        <Package className="w-5 h-5 text-blue-500" />
                        {t.all}
                    </Link>
                </div>
            </div>

            <Footer />
        </main>
    );
}
