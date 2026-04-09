'use client';

import React from 'react';
import Link from 'next/link';
import { useSafeAppStore } from '@/store/useAppStore';
import {
    Droplets, Palette, Bath, Sofa, HeartPulse,
    UtensilsCrossed, Crown, Sparkles, Flame, LayoutGrid,
    type LucideIcon,
} from 'lucide-react';

// ─── Translations ─────────────────────────────────────────────────────────────
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

// ─── Shortcut Definition ──────────────────────────────────────────────────────
interface Shortcut {
    key: string;
    icon: LucideIcon;
    href: string;
    gradient: string;       // CSS gradient for the icon circle
    iconColor: string;      // Tailwind text color for the icon
    shadowColor: string;    // Tailwind shadow color
    ring?: string;          // subtle ring glow
    badge?: string;
    badgeGradient?: string; // CSS gradient for badge
}

const shortcuts: Shortcut[] = [
    {
        key: 'skincare',
        icon: Droplets,
        href: '/category/skincare',
        gradient: 'linear-gradient(135deg, #FFDEE9 0%, #F8B4D9 50%, #E879A8 100%)',
        iconColor: 'text-pink-600',
        shadowColor: 'shadow-pink-300/50',
    },
    {
        key: 'makeup',
        icon: Palette,
        href: '/category/makeup',
        gradient: 'linear-gradient(135deg, #FFC3D4 0%, #FF8FAB 50%, #E8527A 100%)',
        iconColor: 'text-rose-700',
        shadowColor: 'shadow-rose-300/50',
    },
    {
        key: 'hairBody',
        icon: Bath,
        href: '/category/hair-body',
        gradient: 'linear-gradient(135deg, #C3F0FF 0%, #7DD3FC 50%, #38BDF8 100%)',
        iconColor: 'text-sky-700',
        shadowColor: 'shadow-sky-300/50',
    },
    {
        key: 'living',
        icon: Sofa,
        href: '/category/living',
        gradient: 'linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 50%, #34D399 100%)',
        iconColor: 'text-emerald-700',
        shadowColor: 'shadow-emerald-300/50',
    },
    {
        key: 'health',
        icon: HeartPulse,
        href: '/category/health',
        gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 50%, #F59E0B 100%)',
        iconColor: 'text-amber-700',
        shadowColor: 'shadow-amber-300/50',
    },
    {
        key: 'fnb',
        icon: UtensilsCrossed,
        href: '/category/fnb',
        gradient: 'linear-gradient(135deg, #FFEDD5 0%, #FDBA74 50%, #F97316 100%)',
        iconColor: 'text-orange-700',
        shadowColor: 'shadow-orange-300/50',
        badge: 'KOREA',
        badgeGradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    },
    {
        key: 'best',
        icon: Crown,
        href: '/category/best',
        gradient: 'linear-gradient(135deg, #FEF9C3 0%, #FDE047 50%, #EAB308 100%)',
        iconColor: 'text-yellow-700',
        shadowColor: 'shadow-yellow-300/50',
        badge: 'BEST',
        badgeGradient: 'linear-gradient(135deg, #F97316, #EA580C)',
    },
    {
        key: 'newArrivals',
        icon: Sparkles,
        href: '/category/new',
        gradient: 'linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 50%, #8B5CF6 100%)',
        iconColor: 'text-violet-700',
        shadowColor: 'shadow-violet-300/50',
        badge: 'NEW',
        badgeGradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    },
    {
        key: 'sale',
        icon: Flame,
        href: '/category/sale',
        gradient: 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 50%, #EF4444 100%)',
        iconColor: 'text-red-600',
        shadowColor: 'shadow-red-300/50',
        badge: 'SALE',
        badgeGradient: 'linear-gradient(135deg, #EF4444, #B91C1C)',
    },
    {
        key: 'all',
        icon: LayoutGrid,
        href: '/search',
        gradient: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 50%, #3B82F6 100%)',
        iconColor: 'text-blue-700',
        shadowColor: 'shadow-blue-300/50',
    },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CategoryShortcuts() {
    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
    const t = shortcutTranslations[language] ?? shortcutTranslations.en;

    return (
        <section className="py-4 px-3 bg-white" aria-label="Category shortcuts">
            <div className="grid grid-cols-5 gap-y-5 gap-x-1">
                {shortcuts.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="group flex flex-col items-center gap-2"
                        >
                            {/* Icon circle with gradient + glass effect */}
                            <div className="relative">
                                {/* Glow ring (visible on hover) */}
                                <div
                                    className={`
                                        absolute -inset-1 rounded-[22px] opacity-0
                                        group-hover:opacity-40 group-active:opacity-50
                                        transition-opacity duration-300 blur-md
                                    `}
                                    style={{ background: item.gradient }}
                                />

                                {/* Main icon container */}
                                <div
                                    className={`
                                        relative
                                        w-[60px] h-[60px] sm:w-[68px] sm:h-[68px]
                                        rounded-2xl
                                        flex items-center justify-center
                                        shadow-lg ${item.shadowColor}
                                        group-hover:scale-110 group-active:scale-95
                                        transition-all duration-300 ease-out
                                        overflow-hidden
                                    `}
                                    style={{ background: item.gradient }}
                                >
                                    {/* Glass highlight overlay */}
                                    <div
                                        className="absolute inset-0 rounded-2xl"
                                        style={{
                                            background: 'linear-gradient(145deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)',
                                        }}
                                    />

                                    {/* Subtle inner border for glass depth */}
                                    <div
                                        className="absolute inset-[0.5px] rounded-2xl pointer-events-none"
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.4)',
                                        }}
                                    />

                                    {/* Icon */}
                                    <Icon
                                        className={`
                                            relative z-10 w-6 h-6 sm:w-7 sm:h-7
                                            ${item.iconColor}
                                            drop-shadow-sm
                                            group-hover:scale-110
                                            transition-transform duration-300
                                        `}
                                        strokeWidth={2}
                                    />
                                </div>

                                {/* Badge */}
                                {item.badge && (
                                    <span
                                        className={`
                                            absolute -bottom-1.5 left-1/2 -translate-x-1/2
                                            text-white
                                            text-[8px] sm:text-[9px] font-black tracking-wider
                                            px-2 py-[3px] rounded-full
                                            leading-none whitespace-nowrap
                                            shadow-md
                                            group-hover:scale-110
                                            transition-transform duration-300
                                        `}
                                        style={{ background: item.badgeGradient }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span className="text-[11px] sm:text-[12px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors duration-200 text-center leading-tight line-clamp-1 w-full px-0.5">
                                {t?.[item.key] ?? item.key}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
