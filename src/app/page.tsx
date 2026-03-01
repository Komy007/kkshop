'use client';

import React, { useEffect, useState } from 'react';
import AntiGravityHero from '@/components/AntiGravityHero';
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

// Mock product data for display
const mockProducts = [
    { id: '1', name: '고재구전통쌀엿 1kg', nameEn: 'Traditional Rice Candy 1kg', price: 40.0, salePrice: 30.0, unit: '$', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=300', discount: 25, rating: 4.8 },
    { id: '2', name: '호정가 찹쌀약과세트', nameEn: 'Rice Cookie Gift Set', price: 15.0, salePrice: 12.0, unit: '$', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300', discount: 20, rating: 4.5 },
    { id: '3', name: '동결건조 엿 파삭 100g', nameEn: 'Freeze-dried Snack 100g', price: 10.0, salePrice: 10.0, unit: '$', image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=300', discount: 0, rating: 4.9 },
    { id: '4', name: '프리미엄 선크림 SPF50', nameEn: 'Premium Sunscreen SPF50', price: 25.0, salePrice: 18.0, unit: '$', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=300', discount: 28, rating: 4.7 },
    { id: '5', name: '히알루론산 세럼 30ml', nameEn: 'Hyaluronic Acid Serum 30ml', price: 35.0, salePrice: 22.0, unit: '$', image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=300', discount: 37, rating: 4.6 },
    { id: '6', name: '클렌징 폼 150ml', nameEn: 'Cleansing Foam 150ml', price: 15.0, salePrice: 11.0, unit: '$', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=300', discount: 27, rating: 4.4 },
];

function ProductGrid({ products, title, showViewAll = true, t }: { products: typeof mockProducts; title: string; showViewAll?: boolean; t: any }) {
    return (
        <section className="px-3 mb-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                {showViewAll && (
                    <Link href="/category" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
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
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                            {product.discount > 0 && (
                                <div className="absolute top-1 left-1 bg-[#FF4444] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                                    {product.discount}%
                                </div>
                            )}
                        </div>
                        {/* Text */}
                        <p className="text-[11px] sm:text-xs text-gray-700 leading-tight line-clamp-2 mb-1 min-h-[28px]">
                            {product.name}
                        </p>
                        {/* Price */}
                        <div>
                            {product.discount > 0 && (
                                <span className="text-[10px] text-gray-400 line-through mr-1">
                                    {product.unit}{product.price.toLocaleString()}
                                </span>
                            )}
                            <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                                <span className="text-[11px] font-medium mr-px">{product.unit}</span>
                                {product.salePrice.toLocaleString()}
                            </span>
                        </div>
                        {/* Rating */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] text-gray-400">{product.rating}</span>
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

    if (!mounted) return null;

    return (
        <>
            <main className="flex-grow pb-4">
                {/* ── Search Bar ── */}
                <div className="px-3 pt-2 pb-1">
                    <Link href="/search" className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm hover:border-gray-300 transition-colors">
                        <Search className="w-4 h-4 flex-shrink-0" />
                        <span>{t.searchPlaceholder}</span>
                    </Link>
                </div>

                {/* ── Promo Banner Carousel ── */}
                <AntiGravityHero />

                {/* ── Trust Strip (compact) ── */}
                <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide text-nowrap">
                    {[t.freeShipping, t.authentic, t.fast].map((badge: string, i: number) => (
                        <span key={i} className="flex-shrink-0 text-[10px] sm:text-xs text-gray-600 bg-white border border-gray-200 shadow-sm rounded-full px-2.5 py-1 font-medium">
                            {badge}
                        </span>
                    ))}
                </div>

                {/* ── Category Shortcuts (round icons) ── */}
                <CategoryShortcuts />

                {/* ── Curation Banner ── */}
                <div className="px-3 py-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full border-2 border-brand-primary/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-brand-primary">{t.forYou}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                            <span className="font-bold text-gray-900">Premium</span>{t.curationTitle}
                        </p>
                    </div>
                </div>

                {/* ── AI Curation (horizontal scroll) ── */}
                <CurationSection products={products} />

                {/* ── Flash Sale Product Grid ── */}
                <ProductGrid products={mockProducts.slice(0, 3)} title={t.flashTitle} t={t} />

                {/* ── New Arrivals Grid ── */}
                <ProductGrid products={mockProducts.slice(3, 6)} title={t.newArrival} t={t} />

                {/* ── Popular Products Grid ── */}
                <ProductGrid products={mockProducts} title={t.popular} t={t} />

            </main>
            <Footer />
        </>
    );
}
