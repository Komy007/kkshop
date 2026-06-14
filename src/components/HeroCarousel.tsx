'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight, Flame, Crown, Star,
    Droplets, Palette, Bath, Sofa, HeartPulse,
    UtensilsCrossed, LayoutGrid,
} from 'lucide-react';
import { NewArrivalIcon } from '@/components/NewArrivalIcon';

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

interface RawSlide {
    type: 'brand' | 'categoryPair' | 'hotDeal' | 'newArrivals' | 'bestSellers';
    categories?: string[];
    pool?: CarouselProduct[];
    pool1?: CarouselProduct[];
    pool2?: CarouselProduct[];
}

interface FlatSlide {
    type: 'brand' | 'product';
    product?: CarouselProduct;
    badge?: 'HOT' | 'NEW' | 'BEST';
    gradient: string;
}

interface HeroCarouselProps {
    t: any;
    language: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[], n: number): T[] {
    if (!arr || arr.length === 0) return [];
    if (arr.length <= n) return [...arr];
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function pickOne<T>(arr: T[]): T | null {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// Flatten raw API slides → one product per slide (brand slide always first)
function flattenSlides(rawSlides: RawSlide[]): FlatSlide[] {
    const flat: FlatSlide[] = [{ type: 'brand', gradient: 'from-[#1a1a2e] to-[#0f3460]' }];
    for (const raw of rawSlides) {
        if (raw.type === 'brand') continue;
        if (raw.type === 'hotDeal') {
            pickRandom(raw.pool ?? [], 2).forEach(p =>
                flat.push({ type: 'product', product: p, badge: 'HOT', gradient: 'from-red-700 via-red-600 to-orange-600' })
            );
        } else if (raw.type === 'categoryPair') {
            const p1 = pickOne(raw.pool1 ?? []);
            const p2 = pickOne(raw.pool2 ?? []);
            if (p1) flat.push({ type: 'product', product: p1, gradient: 'from-pink-700 to-rose-600' });
            if (p2) flat.push({ type: 'product', product: p2, gradient: 'from-sky-700 to-cyan-600' });
        } else if (raw.type === 'newArrivals') {
            pickRandom(raw.pool ?? [], 2).forEach(p =>
                flat.push({ type: 'product', product: p, badge: 'NEW', gradient: 'from-violet-700 to-purple-600' })
            );
        } else if (raw.type === 'bestSellers') {
            pickRandom(raw.pool ?? [], 2).forEach(p =>
                flat.push({ type: 'product', product: p, badge: 'BEST', gradient: 'from-slate-800 to-slate-700' })
            );
        }
    }
    return flat;
}

// CTA button label per language
const CTA: Record<string, string> = {
    ko: '지금 보기', en: 'View Now', km: 'មើលឥឡូវ', zh: '立即查看',
};

// Mini category icons shown at bottom of BrandSlide
const MINI_CATS = [
    { slug: 'skincare',  Icon: Droplets,        color: 'text-pink-300'    },
    { slug: 'makeup',    Icon: Palette,          color: 'text-rose-300'    },
    { slug: 'hair-body', Icon: Bath,             color: 'text-sky-300'     },
    { slug: 'living',    Icon: Sofa,             color: 'text-emerald-300' },
    { slug: 'health',    Icon: HeartPulse,       color: 'text-amber-300'   },
    { slug: 'fnb',       Icon: UtensilsCrossed,  color: 'text-orange-300'  },
    { slug: 'best',      Icon: Crown,            color: 'text-yellow-300'  },
    { slug: 'new',       Icon: NewArrivalIcon,   color: 'text-violet-300'  },
    { slug: 'sale',      Icon: Flame,            color: 'text-red-300'     },
    { slug: 'all',       Icon: LayoutGrid,       color: 'text-blue-300'    },
];

// ─── Brand Slide ──────────────────────────────────────────────────────────────
function BrandSlide({ t }: { t: any }) {
    return (
        <div className="relative w-full h-full flex flex-col justify-between bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden px-5 pt-4 pb-3">
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 18% 55%, #e94560 0%, transparent 55%), radial-gradient(circle at 80% 15%, #6366f1 0%, transparent 50%)' }}
            />
            <div className="relative z-10">
                <span className="inline-flex items-center text-[9px] font-extrabold text-white/70 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full mb-2 uppercase tracking-widest">
                    🇰🇷 {t.heroBadge}
                </span>
                <h2 className="text-[18px] sm:text-xl font-black text-white leading-tight whitespace-pre-line drop-shadow mb-1.5">
                    {t.heroTitle}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-white/55 line-clamp-2 leading-relaxed mb-3">
                    {t.heroSub}
                </p>
                <Link
                    href="/category"
                    className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-[11px] font-extrabold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-md"
                >
                    {t.shopNow} <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            {/* Category quick-links */}
            <div className="relative z-10 flex items-center justify-around pt-2 border-t border-white/10">
                {MINI_CATS.map(({ slug, Icon, color }) => (
                    <Link key={slug} href={`/category/${slug}`} className="hover:scale-125 transition-transform duration-200 p-1">
                        <Icon className={`w-4 h-4 ${color} drop-shadow-sm`} strokeWidth={1.8} />
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ─── Single Product Slide ─────────────────────────────────────────────────────
function SingleProductSlide({ slide, language }: { slide: FlatSlide; language: string }) {
    const p = slide.product!;
    const hasDiscount = p.isHotSale && p.hotSalePrice != null && p.hotSalePrice < p.priceUsd;
    const price = hasDiscount ? p.hotSalePrice! : p.priceUsd;
    const discountPct = hasDiscount ? Math.round((1 - p.hotSalePrice! / p.priceUsd) * 100) : 0;
    const cta = CTA[language] ?? CTA.en;

    return (
        <div className={`relative w-full h-full bg-gradient-to-br ${slide.gradient} overflow-hidden`}>
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 85% 10%, rgba(255,255,255,0.9) 0%, transparent 45%)' }}
            />
            <div className="relative z-10 flex h-full items-center px-4 gap-3">
                {/* Product image — left 44% */}
                <Link href={`/products/${p.id}`} className="flex-shrink-0 w-[44%]">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/10 shadow-2xl ring-1 ring-white/20">
                        {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill sizes="44vw" className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">🛍</div>
                        )}
                        {slide.badge && (
                            <span className={`absolute top-1.5 left-1.5 text-[9px] font-black text-white px-1.5 py-0.5 rounded shadow-sm ${
                                slide.badge === 'HOT' ? 'bg-red-500' :
                                slide.badge === 'NEW' ? 'bg-blue-500' : 'bg-amber-500'
                            }`}>
                                {slide.badge}
                            </span>
                        )}
                    </div>
                </Link>

                {/* Product info — right */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {discountPct > 0 && (
                        <span className="inline-flex self-start bg-yellow-300 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                            -{discountPct}% OFF
                        </span>
                    )}
                    <Link href={`/products/${p.id}`}>
                        <p className="text-[12px] sm:text-[13px] font-bold text-white line-clamp-3 leading-snug">
                            {p.name}
                        </p>
                    </Link>
                    <div className="flex items-baseline gap-1 flex-wrap">
                        {hasDiscount && (
                            <span className="text-[10px] text-white/45 line-through">${p.priceUsd.toFixed(2)}</span>
                        )}
                        <span className="text-[18px] font-black text-yellow-200 leading-none">${price.toFixed(2)}</span>
                    </div>
                    {p.reviewCount > 0 && (
                        <div className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                            <span className="text-[9px] text-white/65">
                                {p.reviewAvg.toFixed(1)} ({p.reviewCount})
                            </span>
                        </div>
                    )}
                    <Link
                        href={`/products/${p.id}`}
                        className="inline-flex items-center gap-1 mt-0.5 bg-white text-gray-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-md self-start hover:bg-gray-100 transition-colors"
                    >
                        {cta} <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeroCarousel({ t, language }: HeroCarouselProps) {
    const [slides, setSlides] = useState<FlatSlide[]>([{ type: 'brand', gradient: 'from-[#1a1a2e] to-[#0f3460]' }]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [visible, setVisible] = useState(true);
    const [isTouching, setIsTouching] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const transitioning = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch carousel data and flatten into individual product slides
    useEffect(() => {
        fetch(`/api/homepage/carousel?lang=${language}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data.slides) && data.slides.length > 0) {
                    setSlides(flattenSlides(data.slides));
                }
            })
            .catch(() => {});
    }, [language]);

    // Simple fade transition
    const goTo = useCallback((idx: number) => {
        if (transitioning.current || idx === currentIdx) return;
        transitioning.current = true;
        setVisible(false);
        setTimeout(() => {
            setCurrentIdx(idx);
            setVisible(true);
            transitioning.current = false;
        }, 200);
    }, [currentIdx]);

    const goNext = useCallback(() => {
        goTo((currentIdx + 1) % slides.length);
    }, [currentIdx, slides.length, goTo]);

    // Auto-advance every 5s, pause on touch/hover
    useEffect(() => {
        if (isTouching || slides.length <= 1) return;
        timerRef.current = setInterval(goNext, 5000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [goNext, isTouching, slides.length]);

    const onTouchStart = (e: React.TouchEvent) => {
        setIsTouching(true);
        setTouchStartX(e.touches[0].clientX);
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        setIsTouching(false);
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0
                ? goTo((currentIdx + 1) % slides.length)
                : goTo((currentIdx - 1 + slides.length) % slides.length);
        }
    };

    const current = slides[currentIdx] ?? slides[0];

    return (
        <div className="mx-3 mt-2 mb-3">
            <div
                className="relative rounded-2xl overflow-hidden shadow-xl h-[220px] sm:h-[240px]"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseEnter={() => setIsTouching(true)}
                onMouseLeave={() => setIsTouching(false)}
            >
                {/* Slide content — simple fade */}
                <div
                    className="absolute inset-0 transition-opacity duration-200"
                    style={{ opacity: visible ? 1 : 0 }}
                >
                    {current?.type === 'brand' ? (
                        <BrandSlide t={t} />
                    ) : current?.product ? (
                        <SingleProductSlide slide={current} language={language} />
                    ) : (
                        <BrandSlide t={t} />
                    )}
                </div>

                {/* Dot indicators */}
                {slides.length > 1 && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                className={`rounded-full transition-all duration-300 ${
                                    idx === currentIdx
                                        ? 'w-5 h-2 bg-white shadow-md'
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
