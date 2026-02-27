'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';

const shortcutTranslations: Record<string, Record<string, string>> = {
    ko: {
        skincare: '스킨케어',
        makeup: '메이크업',
        hairBody: '헤어/바디',
        living: '생활용품',
        health: '건강식품',
        best: '베스트',
        newArrivals: '신상품',
        sale: '할인',
        all: '전체보기',
    },
    en: {
        skincare: 'Skincare',
        makeup: 'Makeup',
        hairBody: 'Hair/Body',
        living: 'Living',
        health: 'Health',
        best: 'Bestseller',
        newArrivals: 'New',
        sale: 'Sale',
        all: 'View All',
    },
    km: {
        skincare: 'ថែស្បែក',
        makeup: 'គ្រឿងសំអាង',
        hairBody: 'សក់/រាងកាយ',
        living: 'គ្រឿងប្រើប្រាស់',
        health: 'សុខភាព',
        best: 'ពេញនិយម',
        newArrivals: 'ថ្មី',
        sale: 'បញ្ចុះតម្លៃ',
        all: 'មើលទាំងអស់',
    },
    zh: {
        skincare: '护肤',
        makeup: '彩妆',
        hairBody: '洗护',
        living: '生活用品',
        health: '保健品',
        best: '热销',
        newArrivals: '新品',
        sale: '折扣',
        all: '全部',
    },
};

interface Shortcut {
    key: string;
    emoji: string;
    href: string;
    gradient: string;
}

const shortcuts: Shortcut[] = [
    { key: 'skincare', emoji: '🧴', href: '/category/skincare', gradient: 'from-pink-500/20 to-purple-500/20' },
    { key: 'makeup', emoji: '💄', href: '/category/makeup', gradient: 'from-rose-500/20 to-pink-500/20' },
    { key: 'hairBody', emoji: '🧖', href: '/category/hair-body', gradient: 'from-cyan-500/20 to-blue-500/20' },
    { key: 'living', emoji: '🏠', href: '/category/living', gradient: 'from-green-500/20 to-emerald-500/20' },
    { key: 'health', emoji: '💊', href: '/category/health', gradient: 'from-amber-500/20 to-orange-500/20' },
    { key: 'best', emoji: '👑', href: '/category/best', gradient: 'from-yellow-500/20 to-amber-500/20' },
    { key: 'newArrivals', emoji: '✨', href: '/category/new', gradient: 'from-violet-500/20 to-indigo-500/20' },
    { key: 'sale', emoji: '🔥', href: '/category/sale', gradient: 'from-red-500/20 to-orange-500/20' },
    { key: 'all', emoji: '📦', href: '/category', gradient: 'from-gray-500/20 to-slate-500/20' },
];

export default function CategoryShortcuts() {
    const { language } = useAppStore();
    const t = shortcutTranslations[language] ?? shortcutTranslations.en;

    return (
        <section className="py-8" aria-label="Category shortcuts">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-3 sm:gap-4">
                    {shortcuts.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="group flex flex-col items-center gap-2 min-w-[44px]"
                        >
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${item.gradient} border border-white/5 flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 group-hover:border-white/20 transition-all duration-200 active:scale-95`}>
                                {item.emoji}
                            </div>
                            <span className="text-[11px] sm:text-xs font-medium text-white/70 group-hover:text-white transition-colors text-center leading-tight line-clamp-1">
                                {t?.[item.key] ?? item.key}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
