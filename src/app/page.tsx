'use client';

import React, { useEffect, useState } from 'react';

import CategoryShortcuts from '@/components/CategoryShortcuts';
import CurationSection from '@/components/CurationSection';
import Footer from '@/components/Footer';
import { useAppStore } from '@/store/useAppStore';
import { Search, Star } from 'lucide-react';
import Link from 'next/link';
import { type TranslatedProduct } from '@/lib/api';

const homeTranslations: Record<string, any> = {
    ko: {
        searchPlaceholder: '상품명 또는 브랜드 입력',
        curationTitle: '님을 위한 큐레이션',
        forYou: 'FOR YOU',
        flashTitle: '🔥 타임세일',
        newArrival: '✨ 신상품',
        popular: '👑 인기 상품',
        viewAll: '전체보기',
        freeShipping: '🚚 $30 이상 무료배송',
        authentic: '✅ 100% 한국화장품',
        fast: '⚡ 프놈펜 빠른 배송',
    },
    en: {
        searchPlaceholder: 'Search products or brands',
        curationTitle: "'s Picks",
        forYou: 'FOR YOU',
        flashTitle: '🔥 Time Sale',
        newArrival: '✨ New Arrivals',
        popular: '👑 Popular',
        viewAll: 'View All',
        freeShipping: '🚚 Free shipping $30+',
        authentic: '✅ 100% Authentic Korean Cosmetics',
        fast: '⚡ Fast Phnom Penh Delivery',
    },
    km: {
        searchPlaceholder: 'ស្វែងរកផលិតផល',
        curationTitle: ' សម្រាប់អ្នក',
        forYou: 'FOR YOU',
        flashTitle: '🔥 ការលក់ពិសេស',
        newArrival: '✨ ផលិតផលថ្មី',
        popular: '👑 ពេញនិយម',
        viewAll: 'មើលទាំងអស់',
        freeShipping: '🚚 ដឹកជញ្ជូនឥតគិតថ្លៃ $30+',
        authentic: '✅ គ្រឿងសំអាងកូរ៉េ 100%',
        fast: '⚡ ដឹកជញ្ជូនរហ័សភ្នំពេញ',
    },
    zh: {
        searchPlaceholder: '搜索商品或品牌',
        curationTitle: '为你推荐',
        forYou: 'FOR YOU',
        flashTitle: '🔥 限时特卖',
        newArrival: '✨ 新品上市',
        popular: '👑 热门商品',
        viewAll: '查看全部',
        freeShipping: '🚚 $30以上免费送货',
        authentic: '✅ 100%韩国正品化妆品',
        fast: '⚡ 金边快速配送',
    }
};



function ProductGrid({ products, title, showViewAll = true, t }: { products: TranslatedProduct[]; title: string; showViewAll?: boolean; t: any }) {
    if (!products || products.length === 0) return null;

    return (
        <section className="px-3 mb-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-black">{title}</h3>
                {showViewAll && (
                    <Link href="/category" className="text-xs font-semibold text-gray-800 hover:text-black transition-colors">
                        {t.viewAll} &gt;
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                {products.map((product) => (
                    <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="group block"
                    >
                        {/* Image */}
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-1.5 border border-gray-200">
                            <img
                                src={product.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300'}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                            {/* Hot Deal / Sale Badge Demo */}
                            {product.priceUsd > 20 && (
                                <div className="absolute top-1 left-1 bg-[#FF4444] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                                    HOT
                                </div>
                            )}
                        </div>
                        {/* Text */}
                        <p className="text-[12px] sm:text-[13px] font-bold text-gray-900 leading-[1.3] line-clamp-2 mb-1 min-h-[34px]">
                            {product.name}
                        </p>
                        {/* Price */}
                        <div>
                            <span className="text-[13px] sm:text-[15px] font-black text-[#E52528]">
                                <span className="text-[11px] font-bold mr-px">$</span>
                                {product.priceUsd.toLocaleString()}
                            </span>
                        </div>
                        {/* Rating Component Stub */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] text-gray-400">4.9</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default function Home() {
    const { language } = useAppStore();
    const t = homeTranslations[language] || homeTranslations.en;

    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [trustBadges, setTrustBadges] = useState<string[]>([]);
    const [topBanner, setTopBanner] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch products
    useEffect(() => {
        async function loadProducts() {
            try {
                const response = await fetch(`/api/products?lang=${language}`);
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error("Error fetching products", error);
            }
        }
        if (mounted) loadProducts();
    }, [language, mounted]);

    // Fetch settings
    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await fetch('/api/settings?keys=landing_trust_badges,landing_top_banner');
                if (res.ok) {
                    const data = await res.json();
                    let fetchedBadges: any = null;
                    let fetchedBanner: any = null;

                    for (const s of data) {
                        if (s.key === 'landing_trust_badges' && s.value) {
                            fetchedBadges = Object.values(s.value as any) as string[];
                        }
                        if (s.key === 'landing_top_banner' && s.value) {
                            fetchedBanner = s.value;
                        }
                    }

                    if (fetchedBadges && fetchedBadges.length > 0) setTrustBadges(fetchedBadges);
                    if (fetchedBanner && fetchedBanner.isActive) setTopBanner(fetchedBanner);
                }
            } catch (err) {
                console.error("Error fetching settings", err);
            }
        }
        if (mounted) loadSettings();
    }, [mounted]);

    if (!mounted) return null;

    const activeBadges = trustBadges.length > 0 ? trustBadges : [t.freeShipping, t.authentic, t.fast];

    return (
        <>
            <main className="flex-grow pb-4">
                {/* ── Top Promo Banner ── */}
                {topBanner && (
                    <Link href={topBanner.link || '#'} className="block px-4 py-2 text-center text-[13px] font-bold shadow-sm" style={{ backgroundColor: topBanner.bgColor, color: topBanner.textColor }}>
                        {topBanner.text}
                    </Link>
                )}

                {/* ── Search Bar ── */}
                <div className="px-3 pt-2 pb-1">
                    <Link href="/search" className="flex items-center gap-2 w-full px-4 py-3 rounded-full bg-white border-[1.5px] border-gray-800 text-gray-800 text-sm font-bold hover:border-black shadow-sm transition-colors">
                        <Search className="w-5 h-5 flex-shrink-0 text-black" strokeWidth={2.5} />
                        <span>{t.searchPlaceholder}</span>
                    </Link>
                </div>

                {/* ── Promo Banner Carousel ── */}


                {/* ── Trust Strip (compact) ── */}
                <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide text-nowrap">
                    {activeBadges.map((badge, i) => (
                        <span key={i} className="flex-shrink-0 text-[11px] sm:text-xs text-gray-800 bg-white border border-gray-300 shadow-sm rounded-full px-2.5 py-1 font-bold">
                            {badge}
                        </span>
                    ))}
                </div>

                {/* ── Category Shortcuts (round icons) ── */}
                <CategoryShortcuts />

                {/* ── Curation Banner ── */}
                <div className="px-3 py-4 mt-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full border-2 border-brand-primary flex items-center justify-center">
                            <span className="text-xs font-extrabold text-brand-primary">{t.forYou}</span>
                        </div>
                        <p className="text-base text-black font-extrabold">
                            Premium{t.curationTitle}
                        </p>
                    </div>
                </div>

                {/* ── AI Curation (horizontal scroll) ── */}
                <CurationSection products={products} />

                {/* ── Flash Sale Product Grid ── */}
                <ProductGrid products={products.slice(0, 4)} title={t.flashTitle} t={t} />

                {/* ── New Arrivals Grid ── */}
                <ProductGrid products={products.slice(4, 8)} title={t.newArrival} t={t} />

                {/* ── Popular Products Grid ── */}
                <ProductGrid products={products.slice(0, 6)} title={t.popular} t={t} />

            </main>
            <Footer />
        </>
    );
}
