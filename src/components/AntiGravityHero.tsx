"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles, ArrowRight, Zap, Clock } from "lucide-react";
import Link from "next/link";

export const heroTranslations: Record<string, any> = {
    ko: {
        topText: "100% 한국 정품 · 프놈펜 직배송",
        badge: "오늘의 특가",
        title: "K-뷰티의 진심,\n지금 바로 경험하세요",
        desc: "캄보디아 기후에 완벽히 맞춘 한국 프리미엄 스킨케어를 특가로 만나보세요.",
        cta: "베스트셀러 보기",
        flashTitle: "오늘의 플래시딜",
        flashDesc: "매일 오전 11시 업데이트",
        endIn: "마감까지",
    },
    en: {
        topText: "100% Authentic Korean · Ships to Phnom Penh",
        badge: "Today's Deal",
        title: "K-Beauty\nAt Its Best",
        desc: "Premium Korean skincare perfectly suited for Cambodia's climate.",
        cta: "Shop Bestsellers",
        flashTitle: "Flash Deals",
        flashDesc: "Updated daily at 11AM",
        endIn: "Ends in",
    },
    km: {
        topText: "100% ផលិតផលកូរ៉េ · ដឹកជញ្ជូនទៅភ្នំពេញ",
        badge: "ទំនិញថ្ងៃនេះ",
        title: "K-Beauty\nល្អបំផុត",
        desc: "ថែស្បែកកូរ៉េដ៏ប្រសើរ ស័ក្ដិសមជាមួយអាកាសធាតុកម្ពុជា",
        cta: "មើលផលិតផលលក់ដាច់",
        flashTitle: "ការបញ្ចុះតម្លៃ",
        flashDesc: "ធ្វើបច្ចុប្បន្នភាពម៉ោង 11 ព្រឹក",
        endIn: "ផុតកំណត់",
    },
    zh: {
        topText: "100% 韩国正品 · 直送金边",
        badge: "今日特价",
        title: "K-Beauty\n极致体验",
        desc: "专为柬埔寨气候打造的韩国顶级护肤品",
        cta: "查看热销商品",
        flashTitle: "限时特惠",
        flashDesc: "每天上午11点更新",
        endIn: "结束倒计时",
    },
};

// Flash deal products linked to actual product pages
const flashDeals = [
    {
        id: "1",
        emoji: "🧴",
        name: "세럼 SET",
        originalPrice: 45,
        salePrice: 28,
        discount: 38,
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200",
        href: "/products/1",
    },
    {
        id: "2",
        emoji: "💄",
        name: "립 팔레트",
        originalPrice: 35,
        salePrice: 19,
        discount: 46,
        imageUrl: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=200",
        href: "/products/2",
    },
    {
        id: "3",
        emoji: "✨",
        name: "마스크팩 10장",
        originalPrice: 25,
        salePrice: 15,
        discount: 40,
        imageUrl: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=200",
        href: "/products/3",
    },
    {
        id: "4",
        emoji: "🧖",
        name: "선크림 SPF50",
        originalPrice: 22,
        salePrice: 13,
        discount: 41,
        imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=200",
        href: "/products/4",
    },
];

function useCountdown(targetHour = 23) {
    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const target = new Date();
            target.setHours(targetHour, 0, 0, 0);
            if (now >= target) target.setDate(target.getDate() + 1);
            const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
            setTimeLeft({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetHour]);
    return timeLeft;
}

export default function AntiGravityHero({ customData }: { customData?: any }) {
    const { language } = useAppStore();
    const t = heroTranslations[language] || heroTranslations['en']!;
    const countdown = useCountdown(23);

    const topTextContent = customData?.topTextParams?.text || t.topText;
    const badgeText = customData?.badgeParams?.text || t.badge;
    const titleText = customData?.titleParams?.text || t.title;

    const defaultImages = [
        { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600", title: "Luminous Serum", label: "K-Premium", href: "/products/1" },
        { url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=400", href: "/products/2" },
        { url: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=500", href: "/products/3" }
    ];
    const imgs = customData?.images || defaultImages;
    const img0 = imgs[0] || defaultImages[0]!;
    const img1 = imgs[1] || defaultImages[1]!;
    const img2 = imgs[2] || defaultImages[2]!;

    // Deterministic stars
    const stars = Array.from({ length: 12 }, (_, i) => ({
        width: (((i * 7 + 3) % 5) + 1) + "px",
        top: (((i * 23 + 11) % 100)) + "%",
        left: (((i * 37 + 5) % 100)) + "%",
        opacity: ((i * 13 % 5) + 2) / 10,
        duration: ((i * 11 % 3) + 2) + "s",
        delay: ((i * 7 % 5) * 0.4) + "s",
    }));

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <section className="relative w-full overflow-hidden">
            {/* ── Part 1: Hero Banner ── */}
            <div className="relative min-h-[75svh] sm:min-h-[85vh] flex items-center justify-center">
                {/* Aurora Background */}
                <div className="absolute inset-0 bg-aurora opacity-30 pointer-events-none" />

                {/* Stars */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {stars.map((star, i) => (
                        <div
                            key={`star-${i}`}
                            className="absolute bg-white rounded-full animate-star"
                            style={{
                                width: star.width, height: star.width,
                                top: star.top, left: star.left,
                                opacity: star.opacity,
                                '--star-duration': star.duration,
                                '--star-delay': star.delay,
                            } as React.CSSProperties}
                        />
                    ))}
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

                    {/* ── Left Text ── */}
                    <div className="flex flex-col items-start gap-3 sm:gap-4 animate-fade-in-left">
                        {/* Top badge */}
                        <p className="text-white/70 font-medium tracking-wide text-xs sm:text-sm">
                            {topTextContent}
                        </p>

                        {/* Pill badge */}
                        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 border border-brand-secondary/30 animate-fade-in-up delay-100">
                            <Sparkles className="w-3.5 h-3.5 text-brand-secondary animate-pulse-glow flex-shrink-0" />
                            <span className="text-white/90 font-semibold text-xs sm:text-sm">
                                {badgeText}
                            </span>
                        </div>

                        {/* H1 — Mobile: 1.75rem, SM: 2.5rem, LG: 3.5rem */}
                        <h1 className="font-extrabold text-white leading-[1.1] tracking-tight text-[1.75rem] sm:text-[2.25rem] lg:text-[3rem]">
                            {String(titleText || '').split('\n').map((line: string, i: number) => (
                                <span key={i} className={`block ${i === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand-primary' : ''}`}>
                                    {line}
                                </span>
                            ))}
                        </h1>

                        {/* Description — small on mobile */}
                        <p className="text-sm sm:text-base text-white/60 max-w-sm leading-relaxed font-light">
                            {t.desc}
                        </p>

                        {/* CTA */}
                        <Link
                            href="/category"
                            className="mt-1 group relative inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-7 sm:py-3.5 bg-white text-space-900 rounded-full font-bold overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 text-sm sm:text-base btn-micro"
                        >
                            <span className="relative z-10">{t.cta}</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* ── Right Floating Product Images (mobile: horizontal row, desktop: float layout) ── */}

                    {/* Mobile: compact row */}
                    <div className="block lg:hidden w-full">
                        <div className="flex items-end gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
                            {/* Card 1 */}
                            <Link href={img0?.href || '/products/1'} className="snap-center flex-shrink-0 w-[150px] sm:w-[180px] aspect-[3/4] rounded-2xl overflow-hidden glass-card shadow-[0_15px_40px_rgba(236,72,153,0.2)] animate-float-slow relative group">
                                <img src={img0?.url} alt="Serum" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500" loading="lazy" />
                                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
                                    <h3 className="text-white font-bold text-xs">{img0?.title || 'Luminous Serum'}</h3>
                                    <p className="text-brand-secondary font-medium text-[10px]">{img0?.label || 'K-Premium'}</p>
                                </div>
                                <div className="absolute inset-0 ring-2 ring-white/0 group-hover:ring-brand-primary/40 rounded-2xl transition-all duration-300" />
                            </Link>

                            {/* Card 2 */}
                            <Link href={img1?.href || '/products/2'} className="snap-center flex-shrink-0 w-[110px] sm:w-[130px] aspect-square rounded-full overflow-hidden glass-card shadow-[0_10px_30px_rgba(99,102,241,0.25)] animate-float-medium group">
                                <img src={img1?.url} alt="Cream" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                            </Link>

                            {/* Card 3 */}
                            <Link href={img2?.href || '/products/3'} className="snap-center flex-shrink-0 w-[130px] sm:w-[150px] aspect-[4/3] rounded-xl overflow-hidden glass-card shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-float-fast group">
                                <img src={img2?.url} alt="Foundation" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                            </Link>
                        </div>
                    </div>

                    {/* Desktop: floating layout */}
                    <div className="relative h-[560px] hidden lg:block" style={{ perspective: '1000px' }}>
                        {/* Main card */}
                        <Link href={img0?.href || '/products/1'} className="group absolute top-[15%] left-[10%] w-[300px] aspect-[3/4] rounded-3xl overflow-hidden glass-card shadow-[0_20px_50px_rgba(236,72,153,0.15)] z-20 animate-float-slow block">
                            <img src={img0?.url} alt="Premium Serum" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" loading="lazy" />
                            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-white font-bold text-lg">{img0?.title || 'Luminous Serum'}</h3>
                                <p className="text-brand-secondary font-medium text-sm">{img0?.label || 'K-Premium'}</p>
                            </div>
                            <div className="absolute inset-0 ring-2 ring-white/0 group-hover:ring-brand-primary/50 rounded-3xl transition-all duration-300" />
                        </Link>

                        {/* Circle card */}
                        <Link href={img1?.href || '/products/2'} className="group absolute top-[5%] right-[5%] w-[180px] aspect-square rounded-full overflow-hidden glass-card shadow-[0_15px_40px_rgba(99,102,241,0.2)] z-10 animate-float-medium block">
                            <img src={img1?.url} alt="Cream" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                        </Link>

                        {/* Accent card */}
                        <Link href={img2?.href || '/products/3'} className="group absolute bottom-[10%] right-[20%] w-[220px] aspect-[4/3] rounded-2xl overflow-hidden glass-card shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-30 border-white/20 animate-float-fast block">
                            <img src={img2?.url} alt="Foundation" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        </Link>

                        {/* Glow orb */}
                        <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] bg-brand-primary/20 rounded-full blur-[100px] z-0 pointer-events-none animate-breathe" />
                    </div>
                </div>
            </div>

            {/* ── Part 2: Flash Deal Banner (Naver-style) ── */}
            <div className="relative z-10 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-t border-white/10 px-4 py-4 sm:py-5">
                <div className="max-w-7xl mx-auto">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-vivid-pink to-vivid-coral flex items-center justify-center">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <span className="text-white font-extrabold text-sm sm:text-base">{t.flashTitle}</span>
                                <span className="text-white/40 text-xs ml-2 hidden sm:inline">{t.flashDesc}</span>
                            </div>
                        </div>
                        {/* Countdown */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="w-3.5 h-3.5 text-vivid-coral" />
                            <span className="text-white/50 text-xs hidden sm:inline">{t.endIn}</span>
                            <div className="flex items-center gap-0.5">
                                {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((unit, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="text-white/40 font-bold">:</span>}
                                        <span className="bg-space-700 text-white font-mono font-black text-xs px-1.5 py-0.5 rounded-md min-w-[24px] text-center tabular-nums">{unit}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product scroll row */}
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
                        {flashDeals.map((deal) => (
                            <Link
                                key={deal.id}
                                href={deal.href}
                                className="snap-start flex-shrink-0 w-[120px] sm:w-[140px] group"
                            >
                                {/* Image */}
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-space-800 mb-2">
                                    <img
                                        src={deal.imageUrl}
                                        alt={deal.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    {/* Discount badge */}
                                    <div className="absolute top-1.5 left-1.5 bg-vivid-coral text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                                        -{deal.discount}%
                                    </div>
                                </div>
                                {/* Text */}
                                <p className="text-xs font-semibold text-white truncate">{deal.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-vivid-coral font-extrabold text-sm">${deal.salePrice}</span>
                                    <span className="text-white/30 text-[11px] line-through">${deal.originalPrice}</span>
                                </div>
                            </Link>
                        ))}
                        {/* View all */}
                        <Link
                            href="/category/sale"
                            className="snap-start flex-shrink-0 w-[80px] flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white transition-colors"
                        >
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] text-center">
                                {language === 'ko' ? '전체보기' : language === 'zh' ? '查看全部' : language === 'km' ? 'មើលទាំងអស់' : 'View All'}
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
