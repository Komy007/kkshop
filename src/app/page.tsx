'use client';

import React, { useEffect, useState } from 'react';
import CategoryShortcuts from '@/components/CategoryShortcuts';
import CurationSection from '@/components/CurationSection';
import Footer from '@/components/Footer';
import { useSafeAppStore } from '@/store/useAppStore';
import { Search, Star, Flame, Sparkles, Crown, ChevronRight, ArrowRight, Zap, Clock } from 'lucide-react';
import Link from 'next/link';
import { type TranslatedProduct } from '@/lib/api';
import TaegukgiIcon from '@/components/TaegukgiIcon';

interface FlashSaleItem {
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    originalPriceUsd: number;
    salePriceUsd: number;
    endAt: string;
    labelKo?: string;
    labelEn?: string;
    stockQty?: number;
}

const homeT: Record<string, any> = {
    ko: {
        searchPlaceholder: '상품명 또는 브랜드 검색',
        forYou: 'FOR YOU',
        curationTitle: '님을 위한 추천',
        flashTitle: '타임세일',
        flashEnds: '종료까지',
        newArrival: '신상품',
        popular: '인기 상품',
        hotSale: '핫딜',
        viewAll: '전체보기',
        freeShipping: '🚚 $30 이상 무료배송',
        authentic: '✅ 한국정품 100%',
        fast: '⚡ 프놈펜 빠른 배송',
        heroBadge: '캄보디아 No.1 한국 쇼핑몰',
        heroTitle: '진짜 한국 상품을\n문 앞까지',
        heroSub: '화장품 100% 한국산 정품 · 한국인이 검증한 가성비 베스트 상품',
        shopNow: '지금 쇼핑하기',
        outOfStock: '품절',
        soldCount: '판매',
    },
    en: {
        searchPlaceholder: 'Search products or brands',
        forYou: 'FOR YOU',
        curationTitle: "'s Picks",
        flashTitle: 'Flash Sale',
        flashEnds: 'Ends in',
        newArrival: 'New Arrivals',
        popular: 'Popular',
        hotSale: 'Hot Deals',
        viewAll: 'View All',
        freeShipping: '🚚 Free shipping $30+',
        authentic: '✅ 100% Authentic Korean',
        fast: '⚡ Fast Phnom Penh Delivery',
        heroBadge: 'Cambodia\'s No.1 Korean Shop',
        heroTitle: 'Premium Korean Products\nDelivered to Your Door',
        heroSub: 'Cosmetics, lifestyle & more — Curated by Korean Insight for Cambodia',
        shopNow: 'Shop Now',
        outOfStock: 'Sold Out',
        soldCount: 'sold',
    },
    km: {
        searchPlaceholder: 'ស្វែងរកផលិតផល',
        forYou: 'FOR YOU',
        curationTitle: ' សម្រាប់អ្នក',
        flashTitle: 'ការលក់ Flash',
        flashEnds: 'បញ្ចប់ក្នុង',
        newArrival: 'ផលិតផលថ្មី',
        popular: 'ពេញនិយម',
        hotSale: 'ដំណើរការលក់ក្ដៅ',
        viewAll: 'មើលទាំងអស់',
        freeShipping: '🚚 ដឹកជញ្ជូនឥតគិតថ្លៃ $30+',
        authentic: '✅ គ្រឿងសំអាងកូរ៉េ 100%',
        fast: '⚡ ដឹកជញ្ជូនរហ័ស',
        heroBadge: 'ហាងកូរ៉េលេខ ១ នៅកម្ពុជា',
        heroTitle: 'ផលិតផលកូរ៉េ Premium\nដល់ទ្វារផ្ទះអ្នក',
        heroSub: 'គ្រឿងសំអាង 100% កូរ៉េ · ផ្ទះ & ច្រើនទៀត — ផ្ទៀងផ្ទាត់ & ជ្រើសរើសដោយជំនាញកូរ៉េ',
        shopNow: 'ទិញឥឡូវ',
        outOfStock: 'អស់ស្តុក',
        soldCount: 'បានលក់',
    },
    zh: {
        searchPlaceholder: '搜索商品或品牌',
        forYou: 'FOR YOU',
        curationTitle: '为你推荐',
        flashTitle: '限时闪购',
        flashEnds: '剩余',
        newArrival: '新品上市',
        popular: '热门商品',
        hotSale: '爆款热卖',
        viewAll: '查看全部',
        freeShipping: '🚚 $30以上免运费',
        authentic: '✅ 100%韩国正品',
        fast: '⚡ 金边快速配送',
        heroBadge: '柬埔寨第一韩国购物平台',
        heroTitle: '韩国精品\n直达您家门口',
        heroSub: '100%韩国化妆品 · 生活精选 — 经韩国专业甄选与品质认证',
        shopNow: '立即购物',
        outOfStock: '已售罄',
        soldCount: '已售',
    }
};

// ── Countdown Hook ────────────────────────────────────────────────────────────
function useCountdown(endAt: string) {
    const calc = () => {
        const diff = new Date(endAt).getTime() - Date.now();
        if (diff <= 0) return { h: 0, m: 0, s: 0 };
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return { h, m, s };
    };
    const [time, setTime] = useState(calc);
    useEffect(() => {
        const id = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(id);
    }, [endAt]);
    return time;
}

// ── Flash Sale Section ────────────────────────────────────────────────────────
function FlashSaleCard({ item, t }: { item: FlashSaleItem; t: any }) {
    const time = useCountdown(item.endAt);
    const discountPct = Math.round((1 - item.salePriceUsd / item.originalPriceUsd) * 100);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        <Link href={`/products/${item.productId}`} className="flex-shrink-0 w-36 sm:w-40 group block">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square mb-1.5 border border-gray-100">
                <img
                    src={item.productImage || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400'}
                    alt={item.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
                {discountPct > 0 && (
                    <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow">
                        -{discountPct}%
                    </div>
                )}
            </div>
            <p className="text-[11px] text-gray-700 font-bold line-clamp-2 mb-1 leading-snug">{item.productName}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-[14px] font-black text-red-500">${item.salePriceUsd.toFixed(2)}</span>
                <span className="text-[10px] text-gray-400 line-through">${item.originalPriceUsd.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
                <Clock className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />
                <span className="text-[10px] font-bold text-orange-500 font-mono">
                    {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
                </span>
            </div>
        </Link>
    );
}

function FlashSaleSection({ t }: { t: any }) {
    const [items, setItems] = useState<FlashSaleItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/products/flash-sale')
            .then(res => res.ok ? res.json() : [])
            .then(data => { setItems(Array.isArray(data) ? data : []); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, []);

    if (!loaded || items.length === 0) return null;

    return (
        <section className="mb-5">
            <div className="flex items-center justify-between mb-3 px-3">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-400 rounded-md flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white fill-white" />
                    </div>
                    <h3 className="text-[15px] font-extrabold text-black">⚡ {t.flashTitle}</h3>
                </div>
            </div>
            <div className="px-3 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {items.map(item => (
                    <FlashSaleCard key={item.id} item={item} t={t} />
                ))}
            </div>
        </section>
    );
}

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, t }: { product: TranslatedProduct; t: any }) {
    const isSoldOut = product.status === 'SOLDOUT' || product.stockQty === 0;
    const effectivePrice = product.isHotSale && product.hotSalePrice ? product.hotSalePrice : product.priceUsd;
    const hasDiscount = product.isHotSale && product.hotSalePrice && product.hotSalePrice < product.priceUsd;
    const discountPct = hasDiscount
        ? Math.round((1 - effectivePrice / product.priceUsd) * 100)
        : 0;
    const rating = product.reviewAvg > 0 ? product.reviewAvg : null;

    return (
        <Link href={`/products/${product.id}`} className="group block flex-shrink-0">
            {/* Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-1.5 border border-gray-100">
                <img
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400'}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${isSoldOut ? 'opacity-60' : 'group-hover:scale-105'}`}
                    loading="lazy"
                />
                {/* Badges */}
                {isSoldOut ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-white text-[10px] font-extrabold bg-black/60 px-2 py-1 rounded">{t.outOfStock}</span>
                    </div>
                ) : (
                    <>
                        {product.isHotSale && (
                            <div className="absolute top-1.5 left-1.5 bg-[#FF4444] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />HOT
                            </div>
                        )}
                        {product.isNew && !product.isHotSale && (
                            <div className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">NEW</div>
                        )}
                        {discountPct > 0 && (
                            <div className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">{discountPct}%</div>
                        )}
                    </>
                )}
            </div>
            {/* Brand */}
            {product.brandName && (
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide truncate mb-0.5">{product.brandName}</p>
            )}
            {/* Name */}
            <p className="text-[12px] sm:text-[13px] font-bold text-gray-900 leading-[1.3] line-clamp-2 mb-1 min-h-[32px]">
                {product.name}
            </p>
            {/* Price */}
            <div className="flex items-baseline gap-1.5">
                <span className="text-[14px] sm:text-[15px] font-black text-[#E52528]">
                    <span className="text-[11px] font-bold mr-px">$</span>{effectivePrice.toFixed(2)}
                </span>
                {hasDiscount && (
                    <span className="text-[11px] text-gray-400 line-through">${product.priceUsd.toFixed(2)}</span>
                )}
            </div>
            {/* Rating */}
            {rating ? (
                <div className="flex items-center gap-0.5 mt-0.5">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] text-gray-500 font-semibold">{rating.toFixed(1)}</span>
                    {product.reviewCount > 0 && (
                        <span className="text-[10px] text-gray-400">({product.reviewCount})</span>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(s => (
                        <Star key={s} className="w-2 h-2 text-gray-200 fill-gray-200" />
                    ))}
                </div>
            )}
        </Link>
    );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, viewAllHref, t }: { icon: React.ReactNode; title: string; viewAllHref: string; t: any }) {
    return (
        <div className="flex items-center justify-between mb-3 px-3">
            <div className="flex items-center gap-1.5">
                {icon}
                <h3 className="text-[15px] font-extrabold text-black">{title}</h3>
            </div>
            <Link href={viewAllHref} className="flex items-center gap-0.5 text-[11px] font-bold text-gray-500 hover:text-black transition-colors">
                {t.viewAll}<ChevronRight className="w-3 h-3" />
            </Link>
        </div>
    );
}

// ── Product Grid ──────────────────────────────────────────────────────────────
function ProductGrid({ products, title, icon, viewAllHref, t }: {
    products: TranslatedProduct[];
    title: string;
    icon: React.ReactNode;
    viewAllHref: string;
    t: any;
}) {
    if (!products || products.length === 0) return null;
    return (
        <section className="mb-6">
            <SectionHeader icon={icon} title={title} viewAllHref={viewAllHref} t={t} />
            <div className="px-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                {products.slice(0, 6).map(p => (
                    <ProductCard key={p.id} product={p} t={t} />
                ))}
            </div>
        </section>
    );
}

// ── Hero Banner ───────────────────────────────────────────────────────────────
function HeroBanner({ t }: { t: any }) {
    return (
        <div className="mx-3 mt-2 mb-4 rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] min-h-[160px] sm:min-h-[200px] flex items-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #e94560 0%, transparent 60%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 50%)' }}
            />
            {/* Flag decoration */}
            <div className="absolute right-4 top-4 w-16 sm:w-20 opacity-90 select-none drop-shadow-lg">
                <TaegukgiIcon />
            </div>

            <div className="relative z-10 px-5 py-5 max-w-[70%]">
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold text-white/70 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider">
                    <TaegukgiIcon className="w-4 h-[11px] flex-shrink-0" />
                    {t.heroBadge}
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-white leading-tight mb-2 whitespace-pre-line">
                    {t.heroTitle}
                </h2>
                <p className="text-[11px] sm:text-xs text-white/60 mb-3 line-clamp-2">{t.heroSub}</p>
                <Link href="/category"
                    className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-xs font-extrabold px-3 py-2 rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                    {t.shopNow} <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
    const store = useSafeAppStore();
    const language = store?.language || 'en';
    const t = homeT[language] || homeT.en;

    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [trustBadges, setTrustBadges] = useState<string[]>([]);
    const [topBanner, setTopBanner] = useState<any>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!mounted) return;
        fetch(`/api/products?lang=${language}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setProducts(Array.isArray(data) ? data : []))
            .catch(() => setProducts([]));
    }, [language, mounted]);

    useEffect(() => {
        if (!mounted) return;
        fetch('/api/settings?keys=landing_trust_badges,landing_top_banner')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (!Array.isArray(data)) return;
                for (const s of data) {
                    if (s.key === 'landing_trust_badges' && s.value) {
                        const badges = Object.values(s.value as any) as string[];
                        if (badges.length > 0) setTrustBadges(badges);
                    }
                    if (s.key === 'landing_top_banner' && s.value?.isActive) {
                        setTopBanner(s.value);
                    }
                }
            })
            .catch(() => {});
    }, [mounted]);

    if (!mounted) return null;

    // Separate products by type — no fallback (empty sections are hidden by ProductGrid)
    const showHot = products.filter(p => p.isHotSale);
    const showNew = products.filter(p => p.isNew);
    const showPopular = products.filter(p => p.reviewAvg >= 4 && p.reviewCount > 0);

    const activeBadges = trustBadges.length > 0
        ? trustBadges
        : [t.freeShipping, t.authentic, t.fast];

    return (
        <>
            <main className="flex-grow pb-4">
                {/* ── Top Promo Banner (from admin settings) ── */}
                {topBanner && (
                    <Link href={topBanner.link || '#'}
                        className="flex items-center justify-center px-4 py-2.5 text-center text-[13px] font-bold shadow-sm"
                        style={{ backgroundColor: topBanner.bgColor || '#EF4444', color: topBanner.textColor || '#FFFFFF' }}>
                        {topBanner.text}
                    </Link>
                )}

                {/* ── Search Bar ── */}
                <div className="px-3 pt-2 pb-1">
                    <Link href="/search"
                        className="flex items-center gap-2.5 w-full px-4 py-3 rounded-full bg-white border-[1.5px] border-gray-200 text-gray-500 text-sm font-medium hover:border-gray-400 shadow-sm transition-colors">
                        <Search className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span>{t.searchPlaceholder}</span>
                    </Link>
                </div>

                {/* ── Trust Badge Strip ── */}
                <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
                    {activeBadges.map((badge, i) => (
                        <span key={i} className="flex-shrink-0 text-[11px] text-gray-700 bg-white border border-gray-200 shadow-sm rounded-full px-2.5 py-1 font-semibold whitespace-nowrap">
                            {badge}
                        </span>
                    ))}
                </div>

                {/* ── Category Shortcuts ── */}
                <CategoryShortcuts />

                {/* ── Hero Banner ── */}
                <HeroBanner t={t} />

                {/* ── Flash Sale ── */}
                <FlashSaleSection t={t} />

                {/* ── AI Curation Section ── */}
                <div className="mb-2">
                    <div className="px-3 flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center">
                            <span className="text-[9px] font-extrabold text-brand-primary">{t.forYou}</span>
                        </div>
                        <p className="text-[14px] text-black font-extrabold">Premium{t.curationTitle}</p>
                    </div>
                    <CurationSection products={products} />
                </div>

                {/* ── Hot Deal Grid ── */}
                <ProductGrid
                    products={showHot}
                    title={`🔥 ${t.hotSale}`}
                    icon={<Flame className="w-4 h-4 text-[#FF4444]" />}
                    viewAllHref="/category/all"
                    t={t}
                />

                {/* ── New Arrivals Grid ── */}
                <ProductGrid
                    products={showNew}
                    title={`✨ ${t.newArrival}`}
                    icon={<Sparkles className="w-4 h-4 text-blue-500" />}
                    viewAllHref="/category/new"
                    t={t}
                />

                {/* ── Popular Products Grid ── */}
                <ProductGrid
                    products={showPopular}
                    title={`👑 ${t.popular}`}
                    icon={<Crown className="w-4 h-4 text-amber-500" />}
                    viewAllHref="/category/all"
                    t={t}
                />
            </main>
            <Footer />
        </>
    );
}
