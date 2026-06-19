'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    pool?: CarouselProduct[];
    pool1?: CarouselProduct[];
    pool2?: CarouselProduct[];
}

type ProductSlideData = {
    type: 'product';
    product: CarouselProduct;
    badge?: 'HOT' | 'NEW' | 'BEST';
    gradient: string; // fallback background when a product has no image
};

interface HeroCarouselProps {
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

function flattenProductSlides(rawSlides: RawSlide[]): ProductSlideData[] {
    const flat: ProductSlideData[] = [];
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

// ─── Product Slide Component ──────────────────────────────────────────────────
// "Wide photo" look: a blurred, scaled copy of the same product image fills the
// whole slide, so the photo's own background colour bleeds edge-to-edge. The sharp
// product sits on top. A dark bottom scrim guarantees the white name / price stay
// readable regardless of how light or dark the underlying photo is.
function ProductSlide({ slide, priority = false }: { slide: ProductSlideData; priority?: boolean }) {
    const p = slide.product;
    const hasDiscount = p.isHotSale && p.hotSalePrice != null && p.hotSalePrice < p.priceUsd;
    const price = hasDiscount ? p.hotSalePrice! : p.priceUsd;
    const discountPct = hasDiscount ? Math.round((1 - p.hotSalePrice! / p.priceUsd) * 100) : 0;

    return (
        <Link href={`/products/${p.id}`} className="block relative w-full h-full overflow-hidden bg-neutral-100">
            {p.imageUrl ? (
                <>
                    {/* Blurred full-bleed background — extends the photo's own colours */}
                    <Image
                        src={p.imageUrl}
                        alt=""
                        aria-hidden
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover scale-110 blur-2xl"
                        priority={priority}
                    />
                    {/* Soft wash to unify and lift contrast a touch */}
                    <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                    {/* Sharp product image — centred */}
                    <div className="absolute inset-x-8 top-2 bottom-2">
                        <div className="relative w-full h-full">
                            <Image
                                src={p.imageUrl}
                                alt={p.name}
                                fill
                                sizes="(max-width: 640px) 80vw, 40vw"
                                className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                                priority={priority}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex items-center justify-center pb-14`}>
                    <span className="text-7xl opacity-30">🛍</span>
                </div>
            )}

            {/* Top scrim — keeps badges legible on light photos */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

            {/* Bottom scrim — guarantees text readability on any background colour */}
            <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none" />

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
export default function HeroCarousel({ language }: HeroCarouselProps) {
    // Products-only carousel — no intro slide.
    const [slides, setSlides] = useState<ProductSlideData[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [sliding, setSliding] = useState(false);
    const [isTouching, setIsTouching] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetch(`/api/homepage/carousel?lang=${language}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data.slides) && data.slides.length > 0) {
                    setSlides(flattenProductSlides(data.slides));
                }
            })
            .catch(() => {});
    }, [language]);

    const goTo = useCallback((idx: number) => {
        if (idx === currentIdx) return;
        setSliding(true);
        setCurrentIdx(idx);
        if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
        slideTimerRef.current = setTimeout(() => setSliding(false), 380);
    }, [currentIdx]);

    const goNext = useCallback(() => {
        if (slides.length === 0) return;
        goTo((currentIdx + 1) % slides.length);
    }, [currentIdx, slides.length, goTo]);

    useEffect(() => {
        if (isTouching || slides.length <= 1) return;
        timerRef.current = setInterval(goNext, 5000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [goNext, isTouching, slides.length]);

    useEffect(() => {
        return () => { if (slideTimerRef.current) clearTimeout(slideTimerRef.current); };
    }, []);

    const onTouchStart = (e: React.TouchEvent) => {
        setIsTouching(true);
        setTouchStartX(e.touches[0].clientX);
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        setIsTouching(false);
        if (slides.length <= 1) return;
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
                className="relative overflow-hidden h-[215px] sm:h-[235px] bg-neutral-100"
                style={{ touchAction: 'pan-y' }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseEnter={() => setIsTouching(true)}
                onMouseLeave={() => setIsTouching(false)}
            >
                {slides.length === 0 ? (
                    /* Loading skeleton — avoids an empty flash before products arrive */
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200" />
                ) : (
                    <>
                        {/* All slides in DOM — GPU translateX */}
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
                                    style={{ width: `${slideWidthPct}%`, flexShrink: 0, height: '100%', position: 'relative' }}
                                >
                                    <ProductSlide slide={slide} priority={i < 2} />
                                </div>
                            ))}
                        </div>

                        {/* Dot indicators */}
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
                    </>
                )}
            </div>
        </div>
    );
}
