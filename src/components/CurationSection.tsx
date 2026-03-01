'use client';

import React from 'react';
import { ChevronRight, Flame, TrendingUp, Eye } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useAppStore } from '@/store/useAppStore';
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
}

interface SectionProps {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    subtitle: string;
    viewAllText: string;
    children: React.ReactNode;
}

function Section({ icon: Icon, iconColor, title, subtitle, viewAllText, children }: SectionProps) {
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
                            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                        </div>
                    </div>
                    <button className="hidden sm:flex items-center gap-1 text-brand-primary font-semibold text-sm hover:text-brand-primary/80 transition-colors">
                        {viewAllText} <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Horizontal Scroll Product Row */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function CurationSection({ products }: CurationSectionProps) {
    const { language } = useAppStore();
    const t = curationTranslations[language] ?? curationTranslations.en;

    // Split products into 3 sections (Cold Start fallback: use all products shuffled)
    const todayPicks = products.slice(0, 4);
    const categoryBest = products.slice(2, 6);
    const alsoViewed = products.slice(4, 8);

    const renderCard = (product: TranslatedProduct) => (
        <div key={product.id} className="min-w-[200px] max-w-[240px] flex-shrink-0 snap-start">
            <ProductCard
                product={{
                    id: product.id,
                    sku: product.sku,
                    priceUsd: product.priceUsd,
                    stockQty: product.stockQty,
                    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400',
                    name: product.name,
                    shortDesc: product.shortDesc || '',
                    rating: 4.5,
                    reviewCount: 128,
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
                >
                    {alsoViewed.map(renderCard)}
                </Section>
            )}
        </div>
    );
}
