'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    rank?: number;
}

interface SlideData {
    type: 'brand' | 'categoryPair' | 'hotDeal' | 'newArrivals' | 'bestSellers';
    categories?: string[];
    products?: (CarouselProduct | null)[];
    product?: CarouselProduct | null;
    discountPercent?: number;
}

interface HeroCarouselProps {
    t: any; // homepage translations
    language: string;
}

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, {
    icon: React.ElementType;
    gradient: string;
    labelKo: string; labelEn: string; labelKm: string; labelZh: string;
}> = {
    skincare: {
        icon: Droplets,
        gradient: 'from-pink-400 to-rose-500',
        labelKo: '스킨케어', labelEn: 'Skincare', labelKm: 'ថែស្បែក', labelZh: '护肤',
    },
    makeup: {
        icon: Palette,
        gradient: 'from-rose-400 to-pink-600',
        labelKo: '메이크업', labelEn: 'Makeup', labelKm: 'គ្រឿងសំអាង', labelZh: '彩妆',
    },
    'hair-body': {
        icon: Bath,
        gradient: 'from-sky-400 to-cyan-500',
        labelKo: '헤어/바디', labelEn: 'Hair/Body', labelKm: 'សក់/រាងកាយ', labelZh: '洗护',
    },
    living: {
        icon: Sofa,
        gradient: 'from-emerald-400 to-teal-500',
        labelKo: '생활용품', labelEn: 'Living', labelKm: 'គ្រឿងប្រើប្រាស់', labelZh: '生活用品',
    },
    health: {
        icon: HeartPulse,
        gradient: 'from-amber-400 to-orange-500',
        labelKo: '건강식품', labelEn: 'Health', labelKm: 'សុខភាព', labelZh: '保健品',
    },
    fnb: {
        icon: UtensilsCrossed,
        gradient: 'from-orange-400 to-red-500',
        labelKo: '한국식품', labelEn: 'Korean F&B', labelKm: 'ម្ហូបកូរ៉េ', labelZh: '韩国食品',
    },
};

function getCategoryLabel(slug: string, lang: string) {
    const meta = CATEGORY_META[slug];
    if (!meta) return slug;
    const key = `label${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof meta;
    return (meta[key] as string) || meta.labelEn;
}

// ─── Slide translations ───────────────────────────────────────────────────────
const slideT: Record<string, Record<string, string>> = {
    ko: {
        hotDeal: '오늘의 핫딜',
        off: '할인',
        newArrivals: '신상품',
        bestSellers: '베스트셀러',
        viewCategory: '더보기',
    },
    en: {
        hotDeal: "Today's Hot Deal",
        off: 'OFF',
        newArrivals: 'New Arrivals',
        bestSellers: 'Best Sellers',
        viewCategory: 'View',
    },
    km: {
        hotDeal: 'ការផ្សព្វផ្សាយថ្ងៃនេះ',
        off: 'បញ្ចុះ',
        newArrivals: 'ផលិតផលថ្មី',
        bestSellers: 'លក់ដាច់បំផុត',
        viewCategory: 'មើល',
    },
    zh: {
        hotDeal: '今日特惠',
        off: '折扣',
        newArrivals: '新品上市',
        bestSellers: '畅销榜',
        viewCategory: '查看',
    },
};

// ─── Mini Category Icons ──────────────────────────────────────────────────────
const MINI_CATEGORIES = [
    { slug: 'skincare', icon: Droplets, color: 'text-pink-300' },
    { slug: 'makeup', icon: Palette, color: 'text-rose-300' },
    { slug: 'hair-body', icon: Bath, color: 'text-sky-300' },
    { slug: 'living', icon: Sofa, color: 'text-emerald-300' },
    { slug: 'health', icon: HeartPulse, color: 'text-amber-300' },
    { slug: 'fnb', icon: UtensilsCrossed, color: 'text-orange-300' },
    { slug: 'best', icon: Crown, color: 'text-yellow-300' },
    { slug: 'new', icon: Sparkles, color: 'text-violet-300' },
    { slug: 'sale', icon: Flame, color: 'text-red-300' },
    { slug: 'all', icon: LayoutGrid, color: 'text-blue-300' },
];

// ─── Product Card (shared) ────────────────────────────────────────────────────
function ProductCard({ product, size = 'md' }: { product: CarouselProduct; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-[90px] h-[90px]',
        md: 'w-[130px] h-[130px] sm:w-[150px] sm:h-[150px]',
        lg: 'w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]',
    };
    const hasDiscount = product.isHotSale && product.hotSalePrice && product.hotSalePrice < product.priceUsd;
    const effectivePrice = hasDiscount ? product.hotSalePrice! : product.priceUsd;

    return (
        <Link href={`/products/${product.id}`} className="group flex flex-col items-center gap-1">
            <div className={`${sizeClasses[size]} rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">No Image</div>
                )}
            </div>
            <p className="text-[10px] sm:text-xs text-white font-semibold text-center line-clamp-1 max-w-[130px] sm:max-w-[150px]">
                {product.name}
            </p>
            <div className="flex items-center gap-1">
                {hasDiscount && (
                    <span className="text-[9px] text-white/50 line-through">${product.priceUsd.toFixed(2)}</span>
                )}
                <span className={`text-xs font-black ${hasDiscount ? 'text-yellow-300' : 'text-white'}`}>
                    ${effectivePrice.toFixed(2)}
                </span>
            </div>
        </Link>
    );
}

// ─── Slide Components ─────────────────────────────────────────────────────────

// Slide 1: Brand Banner
function BrandSlide({ t }: { t: any }) {
    return (
        <div className="relative w-full h-full flex items-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #e94560 0%, transparent 60%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 50%)' }}
            />
            <div className="absolute right-4 top-4 w-14 sm:w-18 opacity-80 select-none drop-shadow-lg">
                <TaegukgiIcon />
            </div>

            <div className="relative z-10 px-5 py-4 flex flex-col justify-between h-full w-full">
                <div className="max-w-[70%]">
                    <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-extrabold text-white/70 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full mb-1.5 uppercase tracking-wider">
                        <TaegukgiIcon className="w-3.5 h-[10px] flex-shrink-0" />
                        {t.heroBadge}
                    </span>
                    <h2 className="text-[15px] sm:text-xl font-black text-white leading-tight mb-1 whitespace-pre-line">
                        {t.heroTitle}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-white/55 mb-2 line-clamp-2">{t.heroSub}</p>
                    <Link href="/category"
                        className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-[10px] sm:text-xs font-extrabold px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                        {t.shopNow} <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Mini category icons row */}
                <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-white/10">
                    {MINI_CATEGORIES.map(({ slug, icon: Icon, color }) => (
                        <Link key={slug} href={`/category/${slug}`}
                            className="hover:scale-125 transition-transform duration-200">
                            <Icon className={`w-4 h-4 ${color} drop-shadow-sm`} strokeWidth={2} />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Slide 2, 4: Category Pair
function CategoryPairSlide({ slide, language, st }: { slide: SlideData; language: string; st: any }) {
    const [slug1, slug2] = slide.categories || ['skincare', 'makeup'];
    const meta1 = CATEGORY_META[slug1] || CATEGORY_META.skincare;
    const meta2 = CATEGORY_META[slug2] || CATEGORY_META.makeup;
    const Icon1 = meta1.icon;
    const Icon2 = meta2.icon;
    const products = slide.products || [];

    return (
        <div className={`relative w-full h-full bg-gradient-to-br ${meta1.gradient} overflow-hidden`}>
            {/* Diagonal split effect */}
            <div className={`absolute right-0 top-0 w-1/2 h-full bg-gradient-to-br ${meta2.gradient} opacity-90`}
                style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }}
            />
            <div className="absolute inset-0 bg-black/20" />

            <div className="relative z-10 flex h-full px-3 py-3">
                {/* Left Category */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Link href={`/category/${slug1}`} className="flex items-center gap-1.5 mb-2 hover:scale-105 transition-transform">
                        <Icon1 className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />
                        <span className="text-xs sm:text-sm font-black text-white drop-shadow">{getCategoryLabel(slug1, language)}</span>
                        <ArrowRight className="w-3 h-3 text-white/70" />
                    </Link>
                    {products[0] && <ProductCard product={products[0]} size="md" />}
                    {!products[0] && (
                        <Link href={`/category/${slug1}`} className="text-[10px] text-white/70 bg-white/10 px-3 py-1 rounded-full">{st.viewCategory}</Link>
                    )}
                </div>

                {/* Divider */}
                <div className="w-px bg-white/20 mx-1 self-stretch" />

                {/* Right Category */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Link href={`/category/${slug2}`} className="flex items-center gap-1.5 mb-2 hover:scale-105 transition-transform">
                        <Icon2 className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />
                        <span className="text-xs sm:text-sm font-black text-white drop-shadow">{getCategoryLabel(slug2, language)}</span>
                        <ArrowRight className="w-3 h-3 text-white/70" />
                    </Link>
                    {products[1] && <ProductCard product={products[1]} size="md" />}
                    {!products[1] && (
                        <Link href={`/category/${slug2}`} className="text-[10px] text-white/70 bg-white/10 px-3 py-1 rounded-full">{st.viewCategory}</Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// Slide 3: Hot Deal
function HotDealSlide({ slide, st }: { slide: SlideData; st: any }) {
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
            {/* Animated fire pattern */}
            <div className="absolute inset-0 opacity-15"
                style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #fff 0%, transparent 40%), radial-gradient(circle at 70% 30%, #fff 0%, transparent 40%)' }}
            />

            <div className="relative z-10 flex h-full items-center px-4 gap-3">
                {/* Left: Product Image */}
                <Link href={`/products/${product.id}`} className="flex-shrink-0 group">
                    <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] rounded-2xl overflow-hidden bg-white shadow-2xl group-hover:scale-105 transition-transform duration-200 ring-2 ring-white/30">
                        {product.imageUrl ? (
                            <Image src={product.imageUrl} alt={product.name} width={200} height={200} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">No Image</div>
                        )}
                    </div>
                </Link>

                {/* Right: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Flame className="w-4 h-4 text-yellow-200" />
                        <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">{st.hotDeal}</span>
                    </div>

                    <Link href={`/products/${product.id}`}>
                        <p className="text-sm sm:text-base font-bold text-white line-clamp-2 mb-2 hover:underline">
                            {product.name}
                        </p>
                    </Link>

                    {hasDiscount && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-yellow-300 text-red-700 text-xs sm:text-sm font-black px-2 py-0.5 rounded-lg shadow">
                                -{discount}% {st.off}
                            </span>
                        </div>
                    )}

                    <div className="flex items-baseline gap-2">
                        {hasDiscount && (
                            <span className="text-sm text-white/50 line-through">${product.priceUsd.toFixed(2)}</span>
                        )}
                        <span className="text-xl sm:text-2xl font-black text-yellow-200">
                            ${(hasDiscount ? product.hotSalePrice! : product.priceUsd).toFixed(2)}
                        </span>
                    </div>

                    {product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                            <span className="text-[10px] text-white/70 font-semibold">{product.reviewAvg.toFixed(1)} ({product.reviewCount})</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Slide 5: New Arrivals
function NewArrivalsSlide({ slide, st }: { slide: SlideData; st: any }) {
    const products = (slide.products || []).filter(Boolean) as CarouselProduct[];

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500 overflow-hidden">
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #fff 0%, transparent 60%)' }}
            />
            <div className="relative z-10 flex flex-col h-full px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-yellow-200" />
                    <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">{st.newArrivals}</span>
                </div>

                <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3">
                    {products.slice(0, 3).map((product) => (
                        <ProductCard key={product.id} product={product} size="sm" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Slide 6: Best Sellers
function BestSellersSlide({ slide, st }: { slide: SlideData; st: any }) {
    const products = (slide.products || []).filter(Boolean) as (CarouselProduct & { rank?: number })[];

    const rankColors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-orange-400 to-orange-600'];

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 50%)' }}
            />
            <div className="relative z-10 flex flex-col h-full px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">{st.bestSellers}</span>
                </div>

                <div className="flex-1 flex flex-col justify-center gap-1.5">
                    {products.slice(0, 3).map((product, idx) => {
                        const hasDiscount = product.isHotSale && product.hotSalePrice && product.hotSalePrice < product.priceUsd;
                        const effectivePrice = hasDiscount ? product.hotSalePrice! : product.priceUsd;
                        return (
                            <Link key={product.id} href={`/products/${product.id}`}
                                className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl p-2 hover:bg-white/15 transition-colors border border-white/5">
                                {/* Rank badge */}
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${rankColors[idx] || rankColors[2]} flex items-center justify-center flex-shrink-0 shadow`}>
                                    <span className="text-xs font-black text-white">{idx + 1}</span>
                                </div>

                                {/* Thumbnail */}
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                    {product.imageUrl ? (
                                        <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-white/5" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] sm:text-xs font-bold text-white truncate">{product.name}</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-yellow-300">${effectivePrice.toFixed(2)}</span>
                                        {product.reviewCount > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <Star className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                                                <span className="text-[9px] text-white/50">{product.reviewAvg.toFixed(1)}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Transition Effects ───────────────────────────────────────────────────────
// 4 premium transitions that cycle: slideUp → slideLeft → zoomBlur → flip3D
type TransitionType = 'slideUp' | 'slideLeft' | 'zoomBlur' | 'flip3D';
const TRANSITIONS: TransitionType[] = ['slideUp', 'slideLeft', 'zoomBlur', 'flip3D'];

const TRANSITION_DURATION = 600; // ms

// CSS for outgoing slide (exit)
function getExitStyle(effect: TransitionType): React.CSSProperties {
    switch (effect) {
        case 'slideUp':
            return { transform: 'translateY(-100%)', opacity: 0 };
        case 'slideLeft':
            return { transform: 'translateX(-100%)', opacity: 0 };
        case 'zoomBlur':
            return { transform: 'scale(1.3)', opacity: 0, filter: 'blur(20px)' };
        case 'flip3D':
            return { transform: 'perspective(800px) rotateY(90deg)', opacity: 0 };
    }
}

// CSS for incoming slide (enter from)
function getEnterFromStyle(effect: TransitionType): React.CSSProperties {
    switch (effect) {
        case 'slideUp':
            return { transform: 'translateY(100%)', opacity: 0 };
        case 'slideLeft':
            return { transform: 'translateX(100%)', opacity: 0 };
        case 'zoomBlur':
            return { transform: 'scale(0.7)', opacity: 0, filter: 'blur(20px)' };
        case 'flip3D':
            return { transform: 'perspective(800px) rotateY(-90deg)', opacity: 0 };
    }
}

// CSS for settled state
function getSettledStyle(): React.CSSProperties {
    return { transform: 'translateY(0) translateX(0) scale(1) perspective(800px) rotateY(0deg)', opacity: 1, filter: 'blur(0px)' };
}

// ─── Main Carousel ────────────────────────────────────────────────────────────
export default function HeroCarousel({ t, language }: HeroCarouselProps) {
    const [slides, setSlides] = useState<SlideData[]>([{ type: 'brand' }]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState<number | null>(null);
    const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
    const [transitionIdx, setTransitionIdx] = useState(0);
    const [kenBurnsKey, setKenBurnsKey] = useState(0);
    const [touchStartX, setTouchStartX] = useState(0);
    const [isTouching, setIsTouching] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const st = slideT[language] || slideT.en;
    const currentEffect = TRANSITIONS[transitionIdx % TRANSITIONS.length];

    // Fetch carousel data
    useEffect(() => {
        fetch(`/api/homepage/carousel?lang=${language}`)
            .then(r => r.json())
            .then(data => {
                if (data.slides?.length > 0) {
                    setSlides(data.slides);
                    setCurrentIndex(Math.floor(Math.random() * data.slides.length));
                }
            })
            .catch(() => {});
    }, [language]);

    // Transition engine: idle → exit → enter → idle
    const goTo = useCallback((idx: number) => {
        if (phase !== 'idle' || idx === currentIndex) return;
        setNextIndex(idx);
        setPhase('exit');

        // After exit animation, swap slide and start enter
        setTimeout(() => {
            setCurrentIndex(idx);
            setNextIndex(null);
            setPhase('enter');
            setKenBurnsKey(k => k + 1);

            // After enter animation, settle
            setTimeout(() => {
                setPhase('idle');
                setTransitionIdx(i => i + 1);
            }, TRANSITION_DURATION);
        }, TRANSITION_DURATION);
    }, [phase, currentIndex]);

    const goNext = useCallback(() => {
        goTo((currentIndex + 1) % slides.length);
    }, [currentIndex, slides.length, goTo]);

    // Auto-advance every 5s
    useEffect(() => {
        if (isTouching || slides.length <= 1 || phase !== 'idle') return;
        timerRef.current = setInterval(goNext, 5000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [goNext, isTouching, slides.length, phase]);

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsTouching(true);
        setTouchStartX(e.touches[0].clientX);
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        setIsTouching(false);
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goTo((currentIndex + 1) % slides.length);
            else goTo((currentIndex - 1 + slides.length) % slides.length);
        }
    };

    // Render slide content by type
    const renderSlide = (slide: SlideData) => {
        switch (slide.type) {
            case 'brand':
                return <BrandSlide t={t} />;
            case 'categoryPair':
                return <CategoryPairSlide slide={slide} language={language} st={st} />;
            case 'hotDeal':
                return <HotDealSlide slide={slide} st={st} />;
            case 'newArrivals':
                return <NewArrivalsSlide slide={slide} st={st} />;
            case 'bestSellers':
                return <BestSellersSlide slide={slide} st={st} />;
            default:
                return <BrandSlide t={t} />;
        }
    };

    // Current slide style based on phase
    const slideStyle = useMemo((): React.CSSProperties => {
        const base = {
            transition: `all ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            willChange: 'transform, opacity, filter',
        };
        if (phase === 'exit') return { ...base, ...getExitStyle(currentEffect) };
        if (phase === 'enter') return { ...base, ...getEnterFromStyle(currentEffect) };
        return { ...base, ...getSettledStyle() };
    }, [phase, currentEffect]);

    // On 'enter' phase, we need to start from enterFrom then animate to settled.
    // We use a two-step approach: set enterFrom immediately, then settled on next frame
    const [enterAnimStyle, setEnterAnimStyle] = useState<React.CSSProperties>({});
    useEffect(() => {
        if (phase === 'enter') {
            // Start from enterFrom position
            setEnterAnimStyle({
                ...getEnterFromStyle(currentEffect),
                transition: 'none',
            });
            // Next frame: animate to settled
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setEnterAnimStyle({
                        ...getSettledStyle(),
                        transition: `all ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    });
                });
            });
        } else if (phase === 'idle') {
            setEnterAnimStyle({
                ...getSettledStyle(),
                transition: `all ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            });
        }
    }, [phase, currentEffect]);

    // Final style: exit phase uses slideStyle, enter/idle uses enterAnimStyle
    const finalStyle = phase === 'exit' ? slideStyle : enterAnimStyle;

    return (
        <div className="mx-3 mt-2 mb-4">
            <div
                className="relative rounded-2xl overflow-hidden shadow-lg"
                style={{ minHeight: '210px', height: '210px', perspective: '800px' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseEnter={() => setIsTouching(true)}
                onMouseLeave={() => setIsTouching(false)}
            >
                {/* Slide with Ken Burns + transition effects */}
                <div
                    className="absolute inset-0"
                    style={{ ...finalStyle, transformStyle: 'preserve-3d' }}
                >
                    {/* Ken Burns: subtle slow zoom while slide is visible */}
                    <div
                        key={kenBurnsKey}
                        className="w-full h-full"
                        style={{
                            animation: phase === 'idle' || phase === 'enter'
                                ? 'kenBurns 6s ease-out forwards'
                                : 'none',
                        }}
                    >
                        {slides[currentIndex] && renderSlide(slides[currentIndex])}
                    </div>
                </div>

                {/* Dot indicators */}
                {slides.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                className={`rounded-full transition-all duration-300 ${
                                    idx === currentIndex
                                        ? 'w-5 h-1.5 bg-white shadow-sm'
                                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                                }`}
                                aria-label={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Transition type indicator (subtle) */}
                <div className="absolute top-2 right-2 z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
            </div>

            {/* Ken Burns keyframes */}
            <style jsx>{`
                @keyframes kenBurns {
                    0% { transform: scale(1) translate(0, 0); }
                    100% { transform: scale(1.06) translate(-1%, -1%); }
                }
            `}</style>
        </div>
    );
}
