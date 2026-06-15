'use client';

import React, { useEffect, useState, useRef } from 'react';
import CategoryShortcuts from '@/components/CategoryShortcuts';
import CurationSection from '@/components/CurationSection';
import HeroCarousel from '@/components/HeroCarousel';
import Footer from '@/components/Footer';
import { useSafeAppStore } from '@/store/useAppStore';
import { Search, Star, Flame, Crown, ChevronRight, Zap, Clock, Plus, CheckCircle, X, ArrowUp } from 'lucide-react';
import { NewArrivalIcon } from '@/components/NewArrivalIcon';
import Link from 'next/link';
import Image from 'next/image';
import { type TranslatedProduct } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { useSession } from 'next-auth/react';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400';
const BLUR_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

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
        searchKeywords: ['COSRX 세럼', '시트마스크', '선크림', '한국 과자', 'LANEIGE'],
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
        recentlyViewed: '최근 본 상품',
        signupBanner: '🎁 회원가입 후 매 주문 1% 포인트 적립',
        tickerBought: '구매',
        tickerMinAgo: '분 전',
        tickerHrAgo: '시간 전',
        stockLeft: '잔여',
        stockUnit: '개',
    },
    en: {
        searchPlaceholder: 'Search products or brands',
        searchKeywords: ['COSRX serum', 'Sheet mask', 'Sunscreen', 'Korean snacks', 'LANEIGE'],
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
        recentlyViewed: 'Recently Viewed',
        signupBanner: '🎁 Sign up & get 1% points on every order',
        tickerBought: 'bought',
        tickerMinAgo: ' min ago',
        tickerHrAgo: ' hr ago',
        stockLeft: 'Only',
        stockUnit: 'left',
    },
    km: {
        searchPlaceholder: 'ស្វែងរកផលិតផល',
        searchKeywords: ['ក្រែម COSRX', 'ម៉ាស់មុខ', 'គ្រប់ព្រះអាទិត្យ', 'LANEIGE', 'ផលិតផលថ្មី'],
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
        recentlyViewed: 'បានមើលថ្មីៗ',
        signupBanner: '🎁 ចុះឈ្មោះ & ទទួល 1% ពិន្ទុគ្រប់ការបញ្ជាទិញ',
        tickerBought: 'បានទិញ',
        tickerMinAgo: ' នាទីមុន',
        tickerHrAgo: ' ម៉ោងមុន',
        stockLeft: 'នៅ',
        stockUnit: 'ទៀត',
    },
    zh: {
        searchPlaceholder: '搜索商品或品牌',
        searchKeywords: ['COSRX精华', '面膜', '防晒霜', '韩国零食', 'LANEIGE'],
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
        recentlyViewed: '最近浏览',
        signupBanner: '🎁 注册即可每次购物获1%积分',
        tickerBought: '购买了',
        tickerMinAgo: '分钟前',
        tickerHrAgo: '小时前',
        stockLeft: '仅剩',
        stockUnit: '件',
    }
};

// ── useInView hook ─────────────────────────────────────────────────────────────
function useInView(ref: React.RefObject<any>, rootMargin = '300px') {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
            { rootMargin }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return inView;
}

// ── Skeleton components ────────────────────────────────────────────────────────
function CardSkeleton() {
    return (
        <div className="flex-shrink-0 w-[116px] sm:w-[130px]">
            <div className="aspect-square rounded-xl bg-gray-200 animate-pulse mb-1.5" />
            <div className="h-2.5 bg-gray-200 animate-pulse rounded mb-1" />
            <div className="h-2.5 bg-gray-200 animate-pulse rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
        </div>
    );
}

function ProductGridSkeleton({ title, icon }: { title: string; icon: React.ReactNode }) {
    return (
        <section className="mb-4">
            <div className="flex items-center justify-between mb-3 px-3">
                <div className="flex items-center gap-1.5">{icon}<span className="text-[15px] font-extrabold text-black">{title}</span></div>
            </div>
            <div className="flex gap-3 overflow-x-auto px-3 pb-2 scrollbar-hide">
                {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
        </section>
    );
}

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
    const [imgError, setImgError] = useState(false);
    return (
        <Link href={`/products/${item.productId}`} className="flex-shrink-0 w-36 sm:w-40 group block">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square mb-1.5 border border-gray-100">
                <Image
                    src={imgError || !item.productImage ? PLACEHOLDER_IMG : item.productImage}
                    alt={item.productName}
                    fill
                    sizes="160px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => setImgError(true)}
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
        <section className="mb-3">
            <div className="flex items-center justify-between mb-3 px-3">
                <div className="flex items-center gap-2">
                    <div className="icon-3d w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 animate-zap-pulse">
                        <Zap className="w-4 h-4 text-white fill-white" />
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
    const [quickAdded, setQuickAdded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const addItem = useCartStore((state) => state.addItem);

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
            productId: product.id,
            name: product.name,
            priceUsd: effectivePrice,
            imageUrl: product.imageUrl || '',
        });
        setQuickAdded(true);
        setTimeout(() => setQuickAdded(false), 800);
    };

    return (
        <Link href={`/products/${product.id}`} className="group block flex-shrink-0">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-1.5 border border-gray-100">
                <Image
                    src={imgError || !product.imageUrl ? PLACEHOLDER_IMG : product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 130px, 16vw"
                    className={`object-cover transition-transform duration-300 ${isSoldOut ? 'opacity-60' : 'group-hover:scale-105'}`}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    onError={() => setImgError(true)}
                />
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
                        {(product as any).isNew && !product.isHotSale && (
                            <div className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">NEW</div>
                        )}
                        {discountPct > 0 && (
                            <div className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">{discountPct}%</div>
                        )}
                        {product.stockQty != null && product.stockQty > 0 && product.stockQty <= 5 && (
                            <div className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                                {t.stockLeft} {product.stockQty}{t.stockUnit}
                            </div>
                        )}
                        <button
                            onClick={handleQuickAdd}
                            className={`absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-150 active:scale-95 hover:scale-110 ${quickAdded ? 'bg-green-500' : 'bg-brand-primary hover:bg-brand-primary/90'}`}
                            aria-label="Add to cart"
                        >
                            {quickAdded
                                ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                                : <Plus className="w-3.5 h-3.5 text-white" />
                            }
                        </button>
                    </>
                )}
            </div>
            {(product.brandName || (product.origin && /korea/i.test(product.origin))) && (
                <div className="flex items-center gap-1 mb-0.5">
                    {product.brandName && (
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide truncate">{product.brandName}</span>
                    )}
                    {product.origin && /korea/i.test(product.origin) && (
                        <span className="text-[9px] bg-rose-50 text-rose-600 font-bold px-1 py-px rounded-full whitespace-nowrap">🇰🇷</span>
                    )}
                </div>
            )}
            <p className="text-[12px] sm:text-[13px] font-bold text-gray-900 leading-[1.3] line-clamp-2 mb-1 min-h-[32px]">
                {product.name}
            </p>
            <div className="flex items-baseline gap-1.5">
                <span className="text-[14px] sm:text-[15px] font-black text-[#E52528]">
                    <span className="text-[11px] font-bold mr-px">$</span>{effectivePrice.toFixed(2)}
                </span>
                {hasDiscount && (
                    <span className="text-[11px] text-gray-400 line-through">${product.priceUsd.toFixed(2)}</span>
                )}
            </div>
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
        <section className="mb-4">
            <SectionHeader icon={icon} title={title} viewAllHref={viewAllHref} t={t} />
            <div className="flex gap-3 overflow-x-auto px-3 pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible md:pb-0 md:flex-none md:snap-none">
                {products.map(p => (
                    <div key={p.id} className="flex-shrink-0 w-[116px] sm:w-[130px] snap-start md:w-auto md:flex-shrink">
                        <ProductCard product={p} t={t} />
                    </div>
                ))}
                <Link href={viewAllHref} className="md:hidden flex-shrink-0 w-[72px] flex flex-col items-center justify-center gap-1.5 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-[10px] font-bold text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors snap-start">
                    <ChevronRight className="w-5 h-5" />
                    <span className="text-center leading-tight">{t.viewAll}</span>
                </Link>
            </div>
        </section>
    );
}

// ── Recently Viewed Section ───────────────────────────────────────────────────
const RECENTLY_VIEWED_KEY = 'kkshop_recently_viewed';

function RecentlyViewedSection({ t }: { t: any }) {
    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const ids: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
            if (!ids.length) return;
            const limitedIds = ids.slice(0, 6);
            fetch(`/api/user/recently-viewed?ids=${limitedIds.join(',')}`)
                .then(r => r.ok ? r.json() : [])
                .then(data => { if (Array.isArray(data) && data.length > 0) setProducts(data as TranslatedProduct[]); })
                .catch(() => {});
        } catch {
            // localStorage unavailable
        }
    }, []);

    if (!mounted || products.length === 0) return null;

    return (
        <section className="mb-4">
            <SectionHeader
                icon={<span className="badge-3d bg-gradient-to-r from-slate-500 to-blue-500 text-white"><Clock className="w-3.5 h-3.5" /></span>}
                title={t.recentlyViewed || 'Recently Viewed'}
                viewAllHref="/recently-viewed"
                t={t}
            />
            <div className="flex gap-3 overflow-x-auto px-3 pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible md:pb-0 md:flex-none md:snap-none">
                {products.map(p => (
                    <div key={p.id} className="flex-shrink-0 w-[116px] sm:w-[130px] snap-start md:w-auto md:flex-shrink">
                        <ProductCard product={p} t={t} />
                    </div>
                ))}
            </div>
        </section>
    );
}

// ── Live Purchase Ticker ──────────────────────────────────────────────────────
function PurchaseTicker({ t }: { t: any }) {
    const [items, setItems] = useState<{ maskedName: string; province: string; productName: string; minutesAgo: number }[]>([]);
    const [idx, setIdx] = useState(0);
    const [visible, setVisible] = useState(true);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/products/recent-purchases')
            .then(r => r.ok ? r.json() : [])
            .then(data => { if (Array.isArray(data)) { setItems(data); } setLoaded(true); })
            .catch(() => setLoaded(true));
    }, []);

    useEffect(() => {
        if (items.length === 0) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => { setIdx(i => (i + 1) % items.length); setVisible(true); }, 300);
        }, 4000);
        return () => clearInterval(interval);
    }, [items.length]);

    if (!loaded || items.length === 0) return null;

    const item = items[idx];
    const timeStr = item.minutesAgo < 60
        ? `${item.minutesAgo}${t.tickerMinAgo}`
        : `${Math.floor(item.minutesAgo / 60)}${t.tickerHrAgo}`;

    return (
        <div className="px-3 mb-1.5">
            <div
                className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 transition-opacity duration-300 overflow-hidden"
                style={{ opacity: visible ? 1 : 0 }}>
                <span className="flex-shrink-0">🛒</span>
                <span className="font-bold text-gray-800 flex-shrink-0">{item.maskedName}</span>
                <span className="text-gray-300">·</span>
                <span className="flex-shrink-0">{item.province}</span>
                <span className="text-gray-300">·</span>
                <span className="flex-shrink-0">{t.tickerBought}</span>
                <span className="font-semibold text-gray-800 truncate">{item.productName}</span>
                <span className="text-gray-300 flex-shrink-0">·</span>
                <span className="text-gray-400 flex-shrink-0">{timeStr}</span>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
    const store = useSafeAppStore();
    const language = store?.language || 'en';
    const t = homeT[language] || homeT.en;

    const sessionResult = useSession();
    const session = sessionResult?.data;

    const [mounted, setMounted] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showTodayPick, setShowTodayPick] = useState<TranslatedProduct[]>([]);
    const [showHot, setShowHot] = useState<TranslatedProduct[]>([]);
    const [showNew, setShowNew] = useState<TranslatedProduct[]>([]);
    const [showPopular, setShowPopular] = useState<TranslatedProduct[]>([]);
    const [trustBadges, setTrustBadges] = useState<string[]>([]);
    const [topBanner, setTopBanner] = useState<any>(null);
    const [bannerClosed, setBannerClosed] = useState(false);
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [placeholderFade, setPlaceholderFade] = useState(true);
    const [sectionsFetched, setSectionsFetched] = useState(false);

    const hotRef = useRef<HTMLDivElement>(null);
    const hotInView = useInView(hotRef);

    // Mount init
    useEffect(() => {
        setMounted(true);
        try { setBannerClosed(sessionStorage.getItem('home_top_banner_closed') === '1'); } catch {}
        const onScroll = () => setShowScrollTop(window.scrollY > 300);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Eager: settings + curation todaypick
    useEffect(() => {
        if (!mounted) return;
        fetch(`/api/products?lang=${language}&limit=8&section=todaypick`)
            .then(r => r.ok ? r.json() : { products: [] })
            .then(data => setShowTodayPick(data.products ?? []))
            .catch(() => {});
        fetch('/api/settings?keys=landing_trust_badges,landing_top_banner')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (!Array.isArray(data)) return;
                for (const s of data) {
                    if (s.key === 'landing_trust_badges' && s.value) {
                        const badges = Object.values(s.value as any) as string[];
                        if (badges.length > 0) setTrustBadges(badges);
                    }
                    if (s.key === 'landing_top_banner' && s.value?.isActive) setTopBanner(s.value);
                }
            })
            .catch(() => {});
    }, [mounted, language]);

    // Trigger unified sections fetch when hot section enters viewport
    useEffect(() => { if (hotInView) setSectionsFetched(true); }, [hotInView]);

    // Single API call — hot/new/popular deduplicated server-side, no overlap
    useEffect(() => {
        if (!sectionsFetched) return;
        fetch(`/api/homepage/sections?lang=${language}`)
            .then(r => r.ok ? r.json() : {})
            .then(data => {
                if (Array.isArray(data.hot))     setShowHot(data.hot);
                if (Array.isArray(data.new))     setShowNew(data.new);
                if (Array.isArray(data.popular)) setShowPopular(data.popular);
            })
            .catch(() => {});
    }, [sectionsFetched, language]);

    // Rotating search placeholder (client-only, respects prefers-reduced-motion)
    useEffect(() => {
        if (!mounted) return;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) return;
        const keywords = (homeT[language]?.searchKeywords || homeT.en.searchKeywords) as string[];
        const interval = setInterval(() => {
            setPlaceholderFade(false);
            setTimeout(() => {
                setPlaceholderIdx(i => (i + 1) % keywords.length);
                setPlaceholderFade(true);
            }, 180);
        }, 4000);
        return () => clearInterval(interval);
    }, [mounted, language]);

    const activeBadges = trustBadges.length > 0 ? trustBadges : [t.freeShipping, t.authentic, t.fast];
    const keywords = (homeT[language]?.searchKeywords || homeT.en.searchKeywords) as string[];
    const currentPlaceholder = mounted ? keywords[placeholderIdx] : t.searchPlaceholder;

    return (
        <>
            <main className="flex-grow pb-4">
                {/* ── Top Promo Banner ── */}
                {topBanner && !bannerClosed && (
                    <div
                        className="flex items-center justify-between px-4 py-2.5 text-[13px] font-bold shadow-sm"
                        style={{ backgroundColor: topBanner.bgColor || '#EF4444', color: topBanner.textColor || '#FFFFFF' }}>
                        <Link href={topBanner.link || '#'} className="flex-1 text-center">{topBanner.text}</Link>
                        <button
                            onClick={() => { try { sessionStorage.setItem('home_top_banner_closed', '1'); } catch {} setBannerClosed(true); }}
                            className="ml-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
                            aria-label="Close banner">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ── Sticky Search Bar ── */}
                <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-3 py-2">
                    <Link href="/search"
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium hover:border-gray-400 shadow-sm transition-colors">
                        <Search className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span
                            className="text-gray-500 transition-opacity duration-200"
                            style={{ opacity: placeholderFade ? 1 : 0 }}>
                            {currentPlaceholder}
                        </span>
                    </Link>
                </div>

                {/* ── Hero Carousel ── */}
                <HeroCarousel t={t} language={language} />

                {/* ── Trust Badge Strip ── */}
                <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto scrollbar-hide">
                    {activeBadges.map((badge, i) => (
                        <span key={i} className="flex-shrink-0 text-[11px] text-gray-700 bg-white border border-gray-200 shadow-sm rounded-full px-2.5 py-1 font-semibold whitespace-nowrap">
                            {badge}
                        </span>
                    ))}
                </div>

                {/* ── Live Purchase Ticker ── */}
                <PurchaseTicker t={t} />

                {/* ── Flash Sale ── */}
                <FlashSaleSection t={t} />

                {/* ── Category Shortcuts ── */}
                <CategoryShortcuts />

                {/* ── Signup Perk Banner (hidden for logged-in users) ── */}
                {!session && (
                    <div className="mx-3 mb-3">
                        <Link href="/signup"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 text-white text-[13px] font-extrabold shadow-md hover:opacity-90 transition-opacity">
                            {t.signupBanner}
                        </Link>
                    </div>
                )}

                {/* ── Recently Viewed ── */}
                <RecentlyViewedSection t={t} />

                {/* ── FOR YOU Curation ── */}
                {showTodayPick.length > 0 && (
                    <div className="mb-1">
                        <div className="px-3 flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                <span className="text-[9px] font-extrabold text-brand-primary">{t.forYou}</span>
                            </div>
                            <p className="text-[14px] text-black font-extrabold">Premium{t.curationTitle}</p>
                        </div>
                        <CurationSection products={showTodayPick} todayPicks={showTodayPick} />
                    </div>
                )}

                {/* ── Hot Deal Grid (lazy) ── */}
                <div ref={hotRef}>
                    {showHot.length > 0 ? (
                        <ProductGrid
                            products={showHot}
                            title={`🔥 ${t.hotSale}`}
                            icon={<span className="badge-3d bg-gradient-to-r from-red-500 to-orange-500 text-white"><Flame className="w-3.5 h-3.5" /></span>}
                            viewAllHref="/category/all?sort=hot"
                            t={t}
                        />
                    ) : (
                        <ProductGridSkeleton
                            title={`🔥 ${t.hotSale}`}
                            icon={<span className="badge-3d bg-gradient-to-r from-red-500 to-orange-500 text-white"><Flame className="w-3.5 h-3.5" /></span>}
                        />
                    )}
                </div>

                {/* ── New Arrivals Grid (lazy) ── */}
                <div>
                    {showNew.length > 0 ? (
                        <ProductGrid
                            products={showNew}
                            title={`✨ ${t.newArrival}`}
                            icon={<span className="badge-3d bg-gradient-to-r from-blue-500 to-cyan-500 text-white"><NewArrivalIcon className="w-3.5 h-3.5" /></span>}
                            viewAllHref="/category/new?sort=newest"
                            t={t}
                        />
                    ) : (
                        <ProductGridSkeleton
                            title={`✨ ${t.newArrival}`}
                            icon={<span className="badge-3d bg-gradient-to-r from-blue-500 to-cyan-500 text-white"><NewArrivalIcon className="w-3.5 h-3.5" /></span>}
                        />
                    )}
                </div>

                {/* ── Popular Products Grid (lazy) ── */}
                <div>
                    {showPopular.length > 0 ? (
                        <ProductGrid
                            products={showPopular}
                            title={`👑 ${t.popular}`}
                            icon={<span className="badge-3d bg-gradient-to-r from-amber-500 to-yellow-500 text-white"><Crown className="w-3.5 h-3.5" /></span>}
                            viewAllHref="/category/all?sort=popular"
                            t={t}
                        />
                    ) : (
                        <ProductGridSkeleton
                            title={`👑 ${t.popular}`}
                            icon={<span className="badge-3d bg-gradient-to-r from-amber-500 to-yellow-500 text-white"><Crown className="w-3.5 h-3.5" /></span>}
                        />
                    )}
                </div>
            </main>
            <Footer />
            {/* Scroll-to-top FAB */}
            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all duration-200"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="w-4 h-4 text-gray-600" />
                </button>
            )}
        </>
    );
}
