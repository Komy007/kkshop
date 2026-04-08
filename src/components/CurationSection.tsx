'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Flame, TrendingUp, Eye } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useAppStore, useSafeAppStore } from '@/store/useAppStore';
import { type TranslatedProduct } from '@/lib/api';

const curationTranslations: Record<string, Record<string, string>> = {
    ko: {
        todayPick: '오늘의 추천',
        todayPickDesc: '당신을 위한 맞춤 상품',
        categoryBest: '카테고리 베스트',
        categoryBestDesc: '가장 많이 팔린 인기 상품',
        alsoViewed: '함께 많이 본 상품',
        alsoViewedDesc: '다른 고객님들이 함께 둘러본 상품',
        viewAll: '전체보기',
    },
    en: {
        todayPick: "Today's Picks",
        todayPickDesc: 'Curated just for you',
        categoryBest: 'Category Best',
        categoryBestDesc: 'Most popular products',
        alsoViewed: 'Also Viewed Together',
        alsoViewedDesc: 'Other customers also browsed these',
        viewAll: 'View All',
    },
    km: {
        todayPick: 'ជម្រើសថ្ងៃនេះ',
        todayPickDesc: 'ផលិតផលសម្រាប់អ្នក',
        categoryBest: 'ពេញនិយមបំផុត',
        categoryBestDesc: 'ផលិតផលដែលលក់ដាច់បំផុត',
        alsoViewed: 'មើលជាមួយគ្នា',
        alsoViewedDesc: 'អតិថិជនផ្សេងទៀតក៏មើលផងដែរ',
        viewAll: 'មើលទាំងអស់',
    },
    zh: {
        todayPick: '今日推荐',
        todayPickDesc: '为你精选的商品',
        categoryBest: '分类热销',
        categoryBestDesc: '最受欢迎的商品',
        alsoViewed: '大家都在看',
        alsoViewedDesc: '其他用户也浏览了这些',
        viewAll: '查看全部',
    },
};

interface CurationSectionProps {
    products: TranslatedProduct[];
    todayPicks?: TranslatedProduct[]; // admin-curated Today's Picks (isTodayPick=true); falls back to slice if empty
}

interface SectionProps {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    subtitle: string;
    viewAllText: string;
    viewAllHref: string;
    children: React.ReactNode;
}

function Section({ icon: Icon, iconColor, title, subtitle, viewAllText, viewAllHref, children }: SectionProps) {
    return (
        <div className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex items-end justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-[22px] font-black text-black tracking-tight">{title}</h2>
                            <p className="text-[14px] font-semibold text-gray-600 mt-1">{subtitle}</p>
                        </div>
                    </div>
                    <Link href={viewAllHref} className="hidden sm:flex items-center gap-1 text-brand-primary font-semibold text-sm hover:text-brand-primary/80 transition-colors">
                        {viewAllText} <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Horizontal Scroll Product Row */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function CurationSection({ products, todayPicks: curatedPicks = [] }: CurationSectionProps) {
    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
    const t = curationTranslations[language] ?? curationTranslations.en;

    // Category Best: always top 4 (1위~4위)
    const categoryBest = products.slice(0, 4);
    const categoryBestIds = new Set(categoryBest.map(p => p.id));

    // Today's Picks:
    // - admin 큐레이션이 있으면 → categoryBest와 겹치는 상품 제외 후 최대 4개
    // - 폴백이면 → 3위부터 시작(slice(2,6))하여 Category Best(1위~4위)와 중복 최소화
    const todayPicks = curatedPicks.length > 0
        ? curatedPicks.filter(p => !categoryBestIds.has(p.id)).slice(0, 4)
        : products.slice(2, 6);

    const alsoViewed = products.slice(4, 8);

    const renderCard = (product: TranslatedProduct) => (
        <div key={product.id} className="min-w-[200px] max-w-[240px] flex-shrink-0 snap-start">
            <ProductCard
                product={{
                    id: product.id,
                    sku: product.sku,
                    priceUsd: product.priceUsd,
                    stockQty: product.stockQty,
                    imageUrl: product.imageUrl ?? null,
                    name: product.name,
                    shortDesc: product.shortDesc || '',
                    rating: product.reviewAvg,
                    reviewCount: product.reviewCount,
                    badgeAuthentic: product.badgeAuthentic,
                    badgeKoreanCertified: product.badgeKoreanCertified,
                    brandName: product.brandName,
                    origin: product.origin,
                }}
            />
        </div>
    );

    if (products.length === 0) return null;

    return (
        <div className="border-t border-gray-200 bg-gray-50/50">
            {/* Today's Picks */}
            {todayPicks.length > 0 && (
                <Section
                    icon={Flame}
                    iconColor="bg-gradient-to-br from-vivid-pink to-vivid-coral"
                    title={t?.todayPick ?? "Today's Picks"}
                    subtitle={t?.todayPickDesc ?? 'Curated just for you'}
                    viewAllText={t?.viewAll ?? 'View All'}
                    viewAllHref="/category/all"
                >
                    {todayPicks.map(renderCard)}
                </Section>
            )}

            {/* Category Best */}
            {categoryBest.length > 0 && (
                <Section
                    icon={TrendingUp}
                    iconColor="bg-gradient-to-br from-vivid-cyan to-brand-primary"
                    title={t?.categoryBest ?? 'Category Best'}
                    subtitle={t?.categoryBestDesc ?? 'Most popular products'}
                    viewAllText={t?.viewAll ?? 'View All'}
                    viewAllHref="/category/all?sort=popular"
                >
                    {categoryBest.map(renderCard)}
                </Section>
            )}

            {/* Also Viewed Together */}
            {alsoViewed.length > 0 && (
                <Section
                    icon={Eye}
                    iconColor="bg-gradient-to-br from-vivid-violet to-brand-secondary"
                    title={t?.alsoViewed ?? 'Also Viewed Together'}
                    subtitle={t?.alsoViewedDesc ?? 'Other customers also browsed these'}
                    viewAllText={t?.viewAll ?? 'View All'}
                    viewAllHref="/category/all?sort=rating"
                >
                    {alsoViewed.map(renderCard)}
                </Section>
            )}
        </div>
    );
}
