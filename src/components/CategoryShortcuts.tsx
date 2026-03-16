'use client';

import React from 'react';
import Link from 'next/link';
import { useSafeAppStore } from '@/store/useAppStore';

const shortcutTranslations: Record<string, Record<string, string>> = {
    ko: {
        skincare: '스킨케어',
        makeup: '메이크업',
        hairBody: '헤어/바디',
        living: '생활용품',
        health: '건강식품',
        fnb: '한국식품',
        best: '베스트',
        newArrivals: '신상품',
        sale: '특가세일',
        all: '전체보기',
    },
    en: {
        skincare: 'Skincare',
        makeup: 'Makeup',
        hairBody: 'Hair/Body',
        living: 'Living',
        health: 'Health',
        fnb: 'Korean F&B',
        best: 'Best',
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
        fnb: 'ម្ហូបកូរ៉េ',
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
        fnb: '韩国食品',
        best: '热销',
        newArrivals: '新品',
        sale: '特价',
        all: '全部',
    },
};

interface Shortcut {
    key: string;
    emoji: string;
    href: string;
    bg: string;          // circle background color
    shadow: string;      // drop shadow color
    badge?: string;      // optional top badge text
    badgeBg?: string;    // badge background color
}

const shortcuts: Shortcut[] = [
    {
        key: 'skincare',
        emoji: '🧴',
        href: '/category/skincare',
        bg: 'bg-[#FFD6E7]',
        shadow: 'shadow-pink-300',
    },
    {
        key: 'makeup',
        emoji: '💄',
        href: '/category/makeup',
        bg: 'bg-[#FFAFC5]',
        shadow: 'shadow-rose-300',
    },
    {
        key: 'hairBody',
        emoji: '🧖',
        href: '/category/hair-body',
        bg: 'bg-[#B8E8FF]',
        shadow: 'shadow-sky-300',
    },
    {
        key: 'living',
        emoji: '🏡',
        href: '/category/living',
        bg: 'bg-[#B8F0D8]',
        shadow: 'shadow-emerald-300',
    },
    {
        key: 'health',
        emoji: '💊',
        href: '/category/health',
        bg: 'bg-[#FFE4A0]',
        shadow: 'shadow-amber-300',
    },
    {
        key: 'fnb',
        emoji: '🍜',
        href: '/category/fnb',
        bg: 'bg-[#FFCBA4]',
        shadow: 'shadow-orange-300',
        badge: 'KOREA',
        badgeBg: 'bg-[#E52528]',
    },
    {
        key: 'best',
        emoji: '👑',
        href: '/category/best',
        bg: 'bg-[#FFE566]',
        shadow: 'shadow-yellow-300',
        badge: 'BEST',
        badgeBg: 'bg-[#FF6B00]',
    },
    {
        key: 'newArrivals',
        emoji: '✨',
        href: '/category/new',
        bg: 'bg-[#DDD4FF]',
        shadow: 'shadow-violet-300',
        badge: 'NEW',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'sale',
        emoji: '🔥',
        href: '/category/sale',
        bg: 'bg-[#FFBABA]',
        shadow: 'shadow-red-300',
        badge: 'SALE',
        badgeBg: 'bg-[#E52528]',
    },
    {
        key: 'all',
        emoji: '📦',
        href: '/search',
        bg: 'bg-[#D4E4FF]',
        shadow: 'shadow-blue-300',
    },
];

export default function CategoryShortcuts() {
    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
    const t = shortcutTranslations[language] ?? shortcutTranslations.en;

    return (
        <section className="py-4 px-3 bg-white" aria-label="Category shortcuts">
            <div className="grid grid-cols-5 gap-y-4 gap-x-1">
                {shortcuts.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className="group flex flex-col items-center gap-2"
                    >
                        {/* Icon circle */}
                        <div className="relative">
                            <div
                                className={`
                                    w-[56px] h-[56px] sm:w-[64px] sm:h-[64px]
                                    rounded-[20px] sm:rounded-[24px]
                                    ${item.bg}
                                    shadow-md ${item.shadow}
                                    flex items-center justify-center
                                    group-hover:scale-110 group-active:scale-95
                                    transition-transform duration-200
                                `}
                                style={{
                                    boxShadow: `0 6px 16px -4px var(--tw-shadow-color, rgba(0,0,0,0.15))`,
                                }}
                            >
                                <span
                                    className="text-[28px] sm:text-[32px] leading-none select-none"
                                    style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))' }}
                                >
                                    {item.emoji}
                                </span>
                            </div>

                            {/* Badge */}
                            {item.badge && (
                                <span
                                    className={`
                                        absolute -bottom-1 left-1/2 -translate-x-1/2
                                        ${item.badgeBg} text-white
                                        text-[9px] font-black tracking-wider
                                        px-1.5 py-0.5 rounded-full
                                        leading-none whitespace-nowrap
                                        shadow-sm
                                    `}
                                >
                                    {item.badge}
                                </span>
                            )}
                        </div>

                        {/* Label */}
                        <span className="text-[11px] sm:text-[12px] font-bold text-gray-800 group-hover:text-brand-primary transition-colors text-center leading-tight line-clamp-1 w-full px-0.5">
                            {t?.[item.key] ?? item.key}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
