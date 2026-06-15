'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight, Flame, Crown,
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
        <div className="relative w-full h-full flex flex-col justify-between bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden px-4 pt-3 pb-2">
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 18% 55%, #e94560 0%, transparent 55%), radial-gradient(circle at 80% 15%, #6366f1 0%, transparent 50%)' }}
            />
            <div className="relative z-10">
                <span className="inline-flex items-center text-[8px] font-extrabold text-white/70 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full mb-1.5 uppercase tracking-widest">
                    🇰🇷 {t.heroBadge}
                </span>
                <h2 className="text-[15px] sm:text-[17px] font-black text-white leading-tight whitespace-pre-line drop-shadow mb-1">
                    {t.heroTitle}
                </h2>
                <p className="text-[9px] sm:text-[10px] text-white/55 line-clamp-1 leading-relaxed mb-2">
                    {t.heroSub}
                </p>
                <Link
                    href="/category"
                    className="inline-flex items-center gap-1 bg-white text-gray-900 text-[10px] font-extrabold px-3 py-1 rounded-full hover:bg-gray-100 transition-colors shadow-md"
                >
                    {t.shopNow} <ArrowRight className="w-2.5 h-2.5" />
                </Link>
            </div>
            {/* Category quick-links */}
            <div className="relative z-10 flex items-center justify-around pt-1.5 border-t border-white/10">
                {MINI_CATS.map(({ slug, Icon, color }) => (
                    <Link key={slug} href={`/category/${slug}`} className="hover:scale-125 transition-transform duration-200 p-0.5">
                        <Icon className={`w-3.5 h-3.5 ${color} drop-shadow-sm`} strokeWidth={1.8} />
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ─── Single Product Slide ─────────────────────────────────────────────────────
function SingleProductSlide({ slide, priority = false }: { slide: FlatSlide; priority?: boolean }) {
    const p = slide.product!;
    const hasDiscount = p.isHotSale && p.hotSalePrice != null && p.hotSalePrice < p.priceUsd;
    const price = hasDiscount ? p.hotSalePrice! : p.priceUsd;
    const discountPct = hasDiscount ? Math.round((1 - p.hotSalePrice! / p.priceUsd) * 100) : 0;

    return (
        <Link href={`/products/${p.id}`} className={`block relative w-full h-full bg-gradient-to-br ${slide.gradient} overflow-hidden`}>
            {/* Background light orb — top-right glow */}
            <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 70% 15%, rgba(255,255,255,0.9) 0%, transparent 55%)' }}
            />

            {/* Product image — full height bleed, gradient covers bottom text area */}
            {p.imageUrl ? (
                <div className="absolute inset-x-5 top-0 bottom-0">
                    <div className="relative w-full h-full">
                        <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 90vw, 50vw"
                            className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                            priority={priority}
                        />
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center pb-14">
                    <span className="text-7xl opacity-30">🛍</span>
                </div>
            )}

            {/* Top vignette — badge readability */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />

            {/* Bottom gradient — text overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-gradient-to-t from-black/95 via-black/65 to-transparent" />

            {/* Badge — top-left */}
            {slide.badge && (
                <span className={`absolute top-2 left-2.5 z-10 text-[10px] font-black text-white px-2 py-0.5 rounded shadow-lg ${
                    slide.badge === 'HOT' ? 'bg-red-500' :
                    slide.badge === 'NEW' ? 'bg-blue-500' : 'bg-amber-500'
                }`}>
                    {slide.badge}
                </span>
            )}

            {/* Discount % — top-right */}
            {discountPct > 0 && (
                <span className="absolute top-2 right-2.5 z-10 bg-yellow-300 text-red-700 text-[10px] font-black px-2 py-0.5 rounded shadow-lg">
                    -{discountPct}%
                </span>
            )}

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 z-10 h-[48px] flex items-center justify-between gap-2 px-3">
                <p className="flex-1 min-w-0 text-white text-[11px] sm:text-[12px] font-bold leading-snug line-clamp-2 drop-shadow">
                    {p.name}
                </p>
                <div className="flex-shrink-0 text-right">
                    {hasDiscount && (
                        <div className="text-white/55 text-[9px] line-through leading-none">${p.priceUsd.toFixed(2)}</div>
                    )}
                    <div className="text-yellow-300 text-[16px] font-black leading-tight drop-shadow">
                        ${price.toFixed(2)}
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeroCarousel({ t, language }: HeroCarouselProps) {
    const [slides, setSlides] = useState<FlatSlide[]>([{ type: 'brand', gradient: 'from-[#1a1a2e] to-[#0f3460]' }]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [sliding, setSliding] = useState(false);
    const [isTouching, setIsTouching] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // CSS translateX slide — GPU-accelerated, all slides stay in DOM
    const goTo = useCallback((idx: number) => {
        if (idx === currentIdx) return;
        setSliding(true);
        setCurrentIdx(idx);
        if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
        slideTimerRef.current = setTimeout(() => setSliding(false), 380);
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

    // Cleanup slide timer on unmount
    useEffect(() => {
        return () => { if (slideTimerRef.current) clearTimeout(slideTimerRef.current); };
    }, []);

    const onTouchStart = (e: React.TouchEvent) => {
        setIsTouching(true);
        setTouchStartX(e.touches[0].clientX);
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        setIsTouching(false);
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            diff > 0
                ? goTo((currentIdx + 1) % slides.length)
                : goTo((currentIdx - 1 + slides.length) % slides.length);
        }
    };

    const slideWidthPct = slides.length > 0 ? 100 / slides.length : 100;

    return (
        <div className="mb-1">
            <div
                className="relative overflow-hidden h-[215px] sm:h-[235px]"
                style={{ touchAction: 'pan-y' }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseEnter={() => setIsTouching(true)}
                onMouseLeave={() => setIsTouching(false)}
            >
                {/* All slides in DOM simultaneously — GPU translateX transition */}
                <div
                    className="flex h-full"
                    style={{
                        width: `${slides.length * 100}%`,
                        transform: `translateX(-${currentIdx * slideWidthPct}%)`,
                        transition: sliding ? 'transform 360ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        willChange: 'transform',
                    }}
                >
                    {slides.map((slide, i) => (
                        <div
                            key={i}
                            style={{
                                width: `${slideWidthPct}%`,
                                flexShrink: 0,
                                height: '100%',
                                position: 'relative',
                            }}
                        >
                            {slide.type === 'brand' ? (
                                <BrandSlide t={t} />
                            ) : slide.product ? (
                                <SingleProductSlide slide={slide} priority={i < 2} />
                            ) : (
                                <BrandSlide t={t} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Dot indicators — above info bar */}
                {slides.length > 1 && (
                    <div className="absolute bottom-[52px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
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
