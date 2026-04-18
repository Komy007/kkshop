'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    ArrowRight, Flame, Sparkles, Crown, Star,
    Droplets, Palette, Bath, Sofa, HeartPulse,
    UtensilsCrossed, LayoutGrid,
} from 'lucide-react';
import TaegukgiIcon from '@/components/TaegukgiIcon';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CarouselProduct {
    id: string;
    name: string;
    priceUsd: number;
    hotSalePrice: number | null;
    isHotSale: boolean;
    imageUrl: string | null;
    reviewAvg: number;
    reviewCount: number;
    categorySlug: string | null;
    discountPercent?: number;
}

// Raw slide from API — contains pools instead of single products
interface RawSlide {
    type: 'brand' | 'categoryPair' | 'hotDeal' | 'newArrivals' | 'bestSellers';
    categories?: string[];
    pool?: CarouselProduct[];
    pool1?: CarouselProduct[];
    pool2?: CarouselProduct[];
}

// Resolved slide — pools replaced with concrete picks for rendering
interface ResolvedSlide {
    type: RawSlide['type'];
    categories?: string[];
    products?: (CarouselProduct | null)[];  // categoryPair: [left, right]; newArrivals: [3]; bestSellers: [3]
    product?: CarouselProduct | null;        // hotDeal single
    discountPercent?: number;
}

interface HeroCarouselProps {
    t: any;
    language: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[], n: number): T[] {
    if (!arr || arr.length === 0) return [];
    if (arr.length <= n) return [...arr];
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

function pickOne<T>(arr: T[]): T | null {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// Resolve a raw slide's pools into concrete product picks
function resolveSlide(raw: RawSlide): ResolvedSlide {
    switch (raw.type) {
        case 'categoryPair': {
            const p1 = pickOne(raw.pool1 || []);
            const p2 = pickOne(raw.pool2 || []);
            return { type: 'categoryPair', categories: raw.categories, products: [p1, p2] };
        }
        case 'hotDeal': {
            const p = pickOne(raw.pool || []);
            return { type: 'hotDeal', product: p, discountPercent: p?.discountPercent ?? 0 };
        }
        case 'newArrivals': {
            const picks = pickRandom(raw.pool || [], 3);
            return { type: 'newArrivals', products: picks };
        }
        case 'bestSellers': {
            const picks = pickRandom(raw.pool || [], 3);
            return { type: 'bestSellers', products: picks };
        }
        default:
            return { type: 'brand' };
    }
}

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, {
    icon: React.ElementType;
    gradient: string;
    labelKo: string; labelEn: string; labelKm: string; labelZh: string;
}> = {
    skincare:   { icon: Droplets,        gradient: 'from-pink-400 to-rose-500',    labelKo: '스킨케어', labelEn: 'Skincare',     labelKm: 'ថែស្បែក',         labelZh: '护肤'   },
    makeup:     { icon: Palette,         gradient: 'from-rose-400 to-pink-600',    labelKo: '메이크업', labelEn: 'Makeup',       labelKm: 'គ្រឿងសំអាង',      labelZh: '彩妆'   },
    'hair-body':{ icon: Bath,            gradient: 'from-sky-400 to-cyan-500',     labelKo: '헤어/바디', labelEn: 'Hair/Body',   labelKm: 'សក់/រាងកាយ',      labelZh: '洗护'   },
    living:     { icon: Sofa,            gradient: 'from-emerald-400 to-teal-500', labelKo: '생활용품', labelEn: 'Living',       labelKm: 'គ្រឿងប្រើប្រាស់', labelZh: '生活用品'},
    health:     { icon: HeartPulse,      gradient: 'from-amber-400 to-orange-500', labelKo: '건강식품', labelEn: 'Health',       labelKm: 'សុខភាព',           labelZh: '保健品' },
    fnb:        { icon: UtensilsCrossed, gradient: 'from-orange-400 to-red-500',   labelKo: '한국식품', labelEn: 'Korean F&B',  labelKm: 'ម្ហូបកូរ៉េ',      labelZh: '韩国食品'},
};

function getCategoryLabel(slug: string, lang: string) {
    const meta = CATEGORY_META[slug];
    if (!meta) return slug;
    const key = `label${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof meta;
    return (meta[key] as string) || meta.labelEn;
}

// ─── Slide translations ───────────────────────────────────────────────────────
const slideT: Record<string, Record<string, string>> = {
    ko: { hotDeal: '오늘의 핫딜', off: '할인', newArrivals: '신상품', bestSellers: '베스트셀러', viewCategory: '더보기' },
    en: { hotDeal: "Today's Hot Deal", off: 'OFF', newArrivals: 'New Arrivals', bestSellers: 'Best Sellers', viewCategory: 'View' },
    km: { hotDeal: 'ការផ្សព្វផ្សាយថ្ងៃនេះ', off: 'បញ្ចុះ', newArrivals: 'ផលិតផលថ្មី', bestSellers: 'លក់ដាច់បំផុត', viewCategory: 'មើល' },
    zh: { hotDeal: '今日特惠', off: '折扣', newArrivals: '新品上市', bestSellers: '畅销榜', viewCategory: '查看' },
};

const MINI_CATEGORIES = [
    { slug: 'skincare',   icon: Droplets,        color: 'text-pink-300'    },
    { slug: 'makeup',     icon: Palette,         color: 'text-rose-300'    },
    { slug: 'hair-body',  icon: Bath,            color: 'text-sky-300'     },
    { slug: 'living',     icon: Sofa,            color: 'text-emerald-300' },
    { slug: 'health',     icon: HeartPulse,      color: 'text-amber-300'   },
    { slug: 'fnb',        icon: UtensilsCrossed, color: 'text-orange-300'  },
    { slug: 'best',       icon: Crown,           color: 'text-yellow-300'  },
    { slug: 'new',        icon: Sparkles,        color: 'text-violet-300'  },
    { slug: 'sale',       icon: Flame,           color: 'text-red-300'     },
    { slug: 'all',        icon: LayoutGrid,      color: 'text-blue-300'    },
];

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, size = 'md', fadeIn }: {
    product: CarouselProduct; size?: 'sm' | 'md'; fadeIn?: boolean;
}) {
    const sizeMap = { sm: 'w-[108px] h-[108px]', md: 'w-[158px] h-[158px] sm:w-[178px] sm:h-[178px]' };
    const hasDiscount = product.isHotSale && product.hotSalePrice && product.hotSalePrice < product.priceUsd;
    const price = hasDiscount ? product.hotSalePrice! : product.priceUsd;

    return (
        <Link href={`/products/${product.id}`}
            className={`group flex flex-col items-center gap-1 ${fadeIn ? 'carousel-product-enter' : ''}`}>
            {/* Image box */}
            <div className={`${sizeMap[size]} rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/30 shadow-2xl group-hover:scale-105 group-active:scale-95 transition-transform duration-200`}>
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    /* Placeholder gradient when no image */
                    <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                        <span className="text-white/40 text-2xl">🛍</span>
                    </div>
                )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-white font-semibold text-center line-clamp-2 max-w-[130px] leading-tight">{product.name}</p>
            <div className="flex items-center gap-1">
                {hasDiscount && <span className="text-[9px] text-white/50 line-through">${product.priceUsd.toFixed(2)}</span>}
                <span className={`text-[11px] font-black ${hasDiscount ? 'text-yellow-300' : 'text-white'}`}>${price.toFixed(2)}</span>
            </div>
        </Link>
    );
}

// ─── Slide renderers ──────────────────────────────────────────────────────────

function BrandSlide({ t }: { t: any }) {
    return (
        <div className="relative w-full h-full flex items-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden">
            <div className="absolute inset-0 opacity-25"
                style={{ backgroundImage: 'radial-gradient(circle at 18% 55%, #e94560 0%, transparent 55%), radial-gradient(circle at 80% 15%, #6366f1 0%, transparent 50%), radial-gradient(circle at 60% 80%, #0891b2 0%, transparent 40%)' }} />
            {/* Korean flag — larger, more prominent */}
            <div className="absolute right-3 top-3 w-20 sm:w-24 opacity-85 select-none drop-shadow-xl">
                <TaegukgiIcon />
            </div>
            <div className="relative z-10 px-5 flex flex-col justify-between h-full w-full py-4">
                {/* Top: branding */}
                <div className="max-w-[72%]">
                    <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] font-extrabold text-white/75 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full mb-2 uppercase tracking-widest">
                        <TaegukgiIcon className="w-4 h-[10px] flex-shrink-0" />
                        {t.heroBadge}
                    </span>
                    <h2 className="text-[17px] sm:text-2xl font-black text-white leading-tight mb-1.5 whitespace-pre-line drop-shadow">{t.heroTitle}</h2>
                    <p className="text-[11px] sm:text-[13px] text-white/60 mb-3 line-clamp-2 leading-relaxed">{t.heroSub}</p>
                    <Link href="/category" className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-[11px] sm:text-xs font-extrabold px-4 py-2 rounded-full hover:bg-gray-100 transition-colors shadow-md">
                        {t.shopNow} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                {/* Bottom: category shortcut icons */}
                <div className="flex items-center justify-around pt-2.5 border-t border-white/10">
                    {MINI_CATEGORIES.map(({ slug, icon: Icon, color }) => (
                        <Link key={slug} href={`/category/${slug}`} className="hover:scale-125 transition-transform duration-200 p-1">
                            <Icon className={`w-5 h-5 ${color} drop-shadow-sm`} strokeWidth={1.8} />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CategoryPairSlide({ slide, language, st }: { slide: ResolvedSlide; language: string; st: any }) {
    const [slug1, slug2] = slide.categories || ['skincare', 'makeup'];
    const meta1 = CATEGORY_META[slug1] || CATEGORY_META.skincare;
    const meta2 = CATEGORY_META[slug2] || CATEGORY_META.makeup;
    const Icon1 = meta1.icon;
    const Icon2 = meta2.icon;
    const products = slide.products || [];

    return (
        <div className={`relative w-full h-full bg-gradient-to-br ${meta1.gradient} overflow-hidden`}>
            <div className={`absolute right-0 top-0 w-1/2 h-full bg-gradient-to-br ${meta2.gradient} opacity-90`}
                style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }} />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative z-10 flex h-full px-2 pt-2 pb-3">
                {/* Left category */}
                <div className="flex-1 flex flex-col items-center justify-between">
                    <Link href={`/category/${slug1}`} className="flex items-center gap-1 self-start ml-1 hover:scale-105 transition-transform">
                        <div className="bg-white/20 rounded-full p-0.5">
                            <Icon1 className="w-3.5 h-3.5 text-white drop-shadow" strokeWidth={2.5} />
                        </div>
                        <span className="text-[11px] font-black text-white drop-shadow">{getCategoryLabel(slug1, language)}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-white/60" />
                    </Link>
                    <div className="flex-1 flex items-center justify-center mt-1">
                        {products[0]
                            ? <ProductCard product={products[0]} size="md" fadeIn />
                            : <Link href={`/category/${slug1}`} className="text-[10px] text-white/70 bg-white/10 px-3 py-1 rounded-full">{st.viewCategory}</Link>
                        }
                    </div>
                </div>
                {/* Divider */}
                <div className="w-px bg-white/25 mx-1.5 self-stretch" />
                {/* Right category */}
                <div className="flex-1 flex flex-col items-center justify-between">
                    <Link href={`/category/${slug2}`} className="flex items-center gap-1 self-start ml-1 hover:scale-105 transition-transform">
                        <div className="bg-white/20 rounded-full p-0.5">
                            <Icon2 className="w-3.5 h-3.5 text-white drop-shadow" strokeWidth={2.5} />
                        </div>
                        <span className="text-[11px] font-black text-white drop-shadow">{getCategoryLabel(slug2, language)}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-white/60" />
                    </Link>
                    <div className="flex-1 flex items-center justify-center mt-1">
                        {products[1]
                            ? <ProductCard product={products[1]} size="md" fadeIn />
                            : <Link href={`/category/${slug2}`} className="text-[10px] text-white/70 bg-white/10 px-3 py-1 rounded-full">{st.viewCategory}</Link>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

function HotDealSlide({ slide, st }: { slide: ResolvedSlide; st: any }) {
    const product = slide.product;
    const discount = slide.discountPercent || 0;
    if (!product) return (
        <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Flame className="w-12 h-12 text-white/30" />
        </div>
    );
    const hasDiscount = product.isHotSale && product.hotSalePrice && product.hotSalePrice < product.priceUsd;

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 overflow-hidden">
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 25% 75%, #fff 0%, transparent 45%), radial-gradient(circle at 75% 25%, #fff 0%, transparent 45%)' }} />
            <div className="relative z-10 flex h-full items-center px-3 gap-3">
                {/* Product image — dominant left side */}
                <Link href={`/products/${product.id}`} className="flex-shrink-0 group carousel-product-enter">
                    <div className="w-[175px] h-[175px] sm:w-[210px] sm:h-[210px] rounded-2xl overflow-hidden bg-white shadow-2xl group-hover:scale-105 transition-transform duration-200 ring-2 ring-white/40">
                        {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                            : <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-3xl">🛍</div>
                        }
                    </div>
                </Link>
                {/* Text info — right side */}
                <div className="flex-1 min-w-0 carousel-product-enter flex flex-col justify-center gap-1.5">
                    <div className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-yellow-200" />
                        <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">{st.hotDeal}</span>
                    </div>
                    <Link href={`/products/${product.id}`}>
                        <p className="text-[13px] sm:text-sm font-bold text-white line-clamp-3 leading-snug hover:underline">{product.name}</p>
                    </Link>
                    {hasDiscount && (
                        <span className="inline-flex items-center gap-0.5 self-start bg-yellow-300 text-red-700 text-[11px] font-black px-2 py-0.5 rounded-lg shadow">
                            -{discount}% {st.off}
                        </span>
                    )}
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        {hasDiscount && <span className="text-xs text-white/50 line-through">${product.priceUsd.toFixed(2)}</span>}
                        <span className="text-[22px] font-black text-yellow-200 leading-none">${(hasDiscount ? product.hotSalePrice! : product.priceUsd).toFixed(2)}</span>
                    </div>
                    {product.reviewCount > 0 && (
                        <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                            <span className="text-[10px] text-white/70">{product.reviewAvg.toFixed(1)} ({product.reviewCount})</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NewArrivalsSlide({ slide, st }: { slide: ResolvedSlide; st: any }) {
    const products = (slide.products || []).filter(Boolean) as CarouselProduct[];
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500 overflow-hidden">
            <div className="absolute inset-0 opacity-15"
                style={{ backgroundImage: 'radial-gradient(circle at 50% 40%, #fff 0%, transparent 65%)' }} />
            <div className="relative z-10 flex flex-col h-full px-2 pt-2 pb-2">
                <div className="flex items-center gap-1.5 mb-1 px-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">{st.newArrivals}</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3">
                    {products.map((p) => <ProductCard key={p.id} product={p} size="sm" fadeIn />)}
                </div>
            </div>
        </div>
    );
}

function BestSellersSlide({ slide, st }: { slide: ResolvedSlide; st: any }) {
    const products = (slide.products || []).filter(Boolean) as CarouselProduct[];
    const rankColors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-orange-400 to-orange-600'];
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 opacity-15"
                style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, #f59e0b 0%, transparent 55%)' }} />
            <div className="relative z-10 flex flex-col h-full px-3 pt-2 pb-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Crown className="w-3.5 h-3.5 text-yellow-300" />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">{st.bestSellers}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-2">
                    {products.map((p, idx) => {
                        const hasDiscount = p.isHotSale && p.hotSalePrice && p.hotSalePrice < p.priceUsd;
                        const price = hasDiscount ? p.hotSalePrice! : p.priceUsd;
                        return (
                            <Link key={p.id} href={`/products/${p.id}`}
                                className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-2 py-1.5 hover:bg-white/18 transition-colors border border-white/8 carousel-product-enter">
                                {/* Rank badge */}
                                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${rankColors[idx] || rankColors[2]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                    <span className="text-[13px] font-black text-white">{idx + 1}</span>
                                </div>
                                {/* Thumbnail — bigger */}
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 border border-white/10">
                                    {p.imageUrl
                                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                        : <div className="w-full h-full bg-white/5 flex items-center justify-center text-lg">🛍</div>}
                                </div>
                                {/* Product info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate mb-0.5">{p.name}</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-black text-yellow-300">${price.toFixed(2)}</span>
                                        {hasDiscount && <span className="text-[10px] text-white/40 line-through">${p.priceUsd.toFixed(2)}</span>}
                                    </div>
                                    {p.reviewCount > 0 && (
                                        <span className="flex items-center gap-0.5 mt-0.5">
                                            <Star className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                                            <span className="text-[9px] text-white/55">{p.reviewAvg.toFixed(1)}</span>
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Transition Engine ────────────────────────────────────────────────────────
// 4 premium effects — avoid flip3D (CSS cannot interpolate between typed ↔ 'none')
type TransitionType = 'slideUp' | 'slideLeft' | 'zoomBlur' | 'crossFade';
const TRANSITIONS: TransitionType[] = ['slideUp', 'slideLeft', 'zoomBlur', 'crossFade'];
const TRANSITION_MS = 550;

// Neutral "settled" uses explicit typed transforms so CSS can interpolate cleanly
const SETTLED: React.CSSProperties = {
    transform: 'translateY(0px) translateX(0px) scale(1)',
    opacity: 1,
    filter: 'blur(0px)',
};

function exitStyle(fx: TransitionType): React.CSSProperties {
    switch (fx) {
        case 'slideUp':   return { transform: 'translateY(-108%) translateX(0px) scale(1)',     opacity: 0, filter: 'blur(0px)' };
        case 'slideLeft': return { transform: 'translateY(0px) translateX(-108%) scale(1)',     opacity: 0, filter: 'blur(0px)' };
        case 'zoomBlur':  return { transform: 'translateY(0px) translateX(0px) scale(1.28)',   opacity: 0, filter: 'blur(16px)' };
        case 'crossFade': return { transform: 'translateY(0px) translateX(0px) scale(1.05)',   opacity: 0, filter: 'blur(4px)' };
    }
}
function enterFromStyle(fx: TransitionType): React.CSSProperties {
    switch (fx) {
        case 'slideUp':   return { transform: 'translateY(108%) translateX(0px) scale(1)',     opacity: 0, filter: 'blur(0px)' };
        case 'slideLeft': return { transform: 'translateY(0px) translateX(108%) scale(1)',     opacity: 0, filter: 'blur(0px)' };
        case 'zoomBlur':  return { transform: 'translateY(0px) translateX(0px) scale(0.72)',   opacity: 0, filter: 'blur(16px)' };
        case 'crossFade': return { transform: 'translateY(0px) translateX(0px) scale(0.95)',   opacity: 0, filter: 'blur(4px)' };
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeroCarousel({ t, language }: HeroCarouselProps) {
    const [rawSlides, setRawSlides] = useState<RawSlide[]>([{ type: 'brand' }]);
    const [resolved, setResolved] = useState<ResolvedSlide>({ type: 'brand' });
    const [currentIdx, setCurrentIdx] = useState(0);
    const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
    const [fxIdx, setFxIdx] = useState(0);                 // cycles through TRANSITIONS
    const [kenKey, setKenKey] = useState(0);               // re-triggers ken burns
    const [slideStyle, setSlideStyle] = useState<React.CSSProperties>(SETTLED);
    const [isTouching, setIsTouching] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const phaseRef = useRef<'idle' | 'exit' | 'enter'>('idle');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const st = slideT[language] || slideT.en;
    const fx = TRANSITIONS[fxIdx % TRANSITIONS.length];

    // Fetch product pools
    useEffect(() => {
        fetch(`/api/homepage/carousel?lang=${language}`)
            .then(r => r.json())
            .then(data => {
                if (data.slides?.length > 0) {
                    setRawSlides(data.slides);
                    const startIdx = Math.floor(Math.random() * data.slides.length);
                    setCurrentIdx(startIdx);
                    setResolved(resolveSlide(data.slides[startIdx]));
                }
            })
            .catch(() => {});
    }, [language]);

    // Transition: idle → exit(old) → swap+enter(new) → idle
    const goTo = useCallback((idx: number) => {
        if (phaseRef.current !== 'idle' || idx === currentIdx) return;

        phaseRef.current = 'exit';
        setPhase('exit');
        setSlideStyle({ ...exitStyle(fx), transition: `all ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)` });

        setTimeout(() => {
            // Resolve NEW products randomly from the pool
            const newResolved = resolveSlide(rawSlides[idx]);
            setCurrentIdx(idx);
            setResolved(newResolved);
            setKenKey(k => k + 1);

            // Start from enterFrom (no transition)
            setSlideStyle({ ...enterFromStyle(fx), transition: 'none' });
            phaseRef.current = 'enter';
            setPhase('enter');

            // One frame later: animate to settled
            requestAnimationFrame(() => requestAnimationFrame(() => {
                setSlideStyle({ ...SETTLED, transition: `all ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)` });

                setTimeout(() => {
                    phaseRef.current = 'idle';
                    setPhase('idle');
                    setFxIdx(i => i + 1);   // next slide uses the next transition type
                }, TRANSITION_MS);
            }));
        }, TRANSITION_MS);
    }, [currentIdx, rawSlides, fx]);

    const goNext = useCallback(() => {
        goTo((currentIdx + 1) % rawSlides.length);
    }, [currentIdx, rawSlides.length, goTo]);

    // Auto-advance every 5s
    useEffect(() => {
        if (isTouching || rawSlides.length <= 1) return;
        timerRef.current = setInterval(goNext, 5000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [goNext, isTouching, rawSlides.length]);

    // Touch / swipe
    const onTouchStart = (e: React.TouchEvent) => { setIsTouching(true); setTouchStartX(e.touches[0].clientX); };
    const onTouchEnd   = (e: React.TouchEvent) => {
        setIsTouching(false);
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goTo((currentIdx + 1) % rawSlides.length);
            else           goTo((currentIdx - 1 + rawSlides.length) % rawSlides.length);
        }
    };

    const renderResolved = (r: ResolvedSlide) => {
        switch (r.type) {
            case 'brand':        return <BrandSlide t={t} />;
            case 'categoryPair': return <CategoryPairSlide slide={r} language={language} st={st} />;
            case 'hotDeal':      return <HotDealSlide slide={r} st={st} />;
            case 'newArrivals':  return <NewArrivalsSlide slide={r} st={st} />;
            case 'bestSellers':  return <BestSellersSlide slide={r} st={st} />;
        }
    };

    return (
        <div className="mx-3 mt-2 mb-4">
            <div
                className="relative rounded-2xl overflow-hidden shadow-xl"
                style={{ height: '280px' }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseEnter={() => setIsTouching(true)}
                onMouseLeave={() => setIsTouching(false)}
            >
                {/* Slide wrapper — multi-transition applied here */}
                <div className="absolute inset-0" style={slideStyle}>
                    {/* Ken Burns inner wrapper — uses globals.css class (NOT style jsx) */}
                    <div
                        key={kenKey}
                        className={`w-full h-full ${phase !== 'exit' ? 'carousel-ken-burns' : ''}`}
                    >
                        {renderResolved(resolved)}
                    </div>
                </div>

                {/* Dot indicators — larger tap target for mobile */}
                {rawSlides.length > 1 && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                        {rawSlides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                className={`rounded-full transition-all duration-300 ${
                                    idx === currentIdx
                                        ? 'w-6 h-2 bg-white shadow-md'
                                        : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                                }`}
                                aria-label={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
