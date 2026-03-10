'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { useAppStore, useSafeAppStore } from '@/store/useAppStore';
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

const categories = [
    { key: 'skincare',    emoji: '🧴', href: '/category/skincare',  bg: 'bg-pink-50 text-pink-500' },
    { key: 'makeup',      emoji: '💄', href: '/category/makeup',    bg: 'bg-rose-50 text-rose-500' },
    { key: 'hairBody',    emoji: '🧖', href: '/category/hair-body', bg: 'bg-cyan-50 text-cyan-500' },
    { key: 'living',      emoji: '🏠', href: '/category/living',    bg: 'bg-green-50 text-green-500' },
    { key: 'health',      emoji: '💊', href: '/category/health',    bg: 'bg-amber-50 text-amber-500' },
    { key: 'fnb',         emoji: '🍜', href: '/category/fnb',       bg: 'bg-orange-50 text-orange-500' },
    { key: 'best',        emoji: '👑', href: '/category/best',      bg: 'bg-yellow-50 text-yellow-500' },
    { key: 'newArrivals', emoji: '✨', href: '/category/new',       bg: 'bg-violet-50 text-violet-500' },
    { key: 'sale',        emoji: '🔥', href: '/category/sale',      bg: 'bg-red-50 text-red-500' },
];

export default function CategoryIndexPage() {
    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
    const [mounted, setMounted] = React.useState(false);
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

            {/* Content Array */}
            <div className="px-4 py-6 max-w-lg mx-auto">
                <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                    {categories.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${item.bg} flex items-center justify-center text-4xl group-hover:scale-105 group-active:scale-95 transition-all shadow-sm border border-gray-100`}>
                                {item.emoji}
                            </div>
                            <span className="text-[13px] sm:text-[14px] font-bold text-gray-800 group-hover:text-brand-primary text-center">
                                {t[item.key]}
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Link href="/category/all" className="w-full flex items-center justify-center p-4 bg-white border border-gray-300 rounded-xl font-bold text-gray-900 shadow-sm active:bg-gray-50 hover:bg-gray-50 transition-colors">
                        📦 {t.all}
                    </Link>
                </div>
            </div>

            <Footer />
        </main>
    );
}
