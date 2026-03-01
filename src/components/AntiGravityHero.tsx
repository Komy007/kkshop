"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Promo banner slides — compact like Naver
const slides = [
    {
        id: 1,
        gradient: "from-[#FF6B6B] to-[#EE4D8B]",
        titleKo: "매일 11시, 오늘끝딜",
        titleEn: "Daily 11AM Flash Deals",
        titleKm: "ប្រូម៉ូសិនរាល់ថ្ងៃ 11 ព្រឹក",
        titleZh: "每日11点限时特卖",
        descKo: "무료배송에 최대 혜택까지!",
        descEn: "Free shipping + max savings!",
        descKm: "ដឹកជញ្ជូនឥតគិតថ្លៃ!",
        descZh: "免费送货 + 最大优惠！",
        images: [
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200&h=200",
            "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=200&h=200",
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=200&h=200",
        ],
        href: "/category/sale",
    },
    {
        id: 2,
        gradient: "from-[#6366F1] to-[#8B5CF6]",
        titleKo: "K-Beauty 베스트",
        titleEn: "K-Beauty Bestsellers",
        titleKm: "K-Beauty លក់ដាច់បំផុត",
        titleZh: "K-Beauty 热卖榜",
        descKo: "한국 정품 화장품 특별 할인",
        descEn: "Authentic Korean cosmetics on sale",
        descKm: "គ្រឿងសម្អាងកូរ៉េបញ្ចុះតម្លៃ",
        descZh: "正品韩国化妆品特惠",
        images: [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200&h=200",
            "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=200&h=200",
        ],
        href: "/category/skincare",
    },
    {
        id: 3,
        gradient: "from-[#06B6D4] to-[#0891B2]",
        titleKo: "생활용품 기획전",
        titleEn: "Living Essentials Sale",
        titleKm: "ការលក់របស់ប្រើប្រាស់ប្រចាំថ្ងៃ",
        titleZh: "生活用品专场",
        descKo: "프놈펜 생활 업그레이드",
        descEn: "Upgrade your Phnom Penh life",
        descKm: "ធ្វើឱ្យជីវិតរស់នៅភ្នំពេញប្រសើរឡើង",
        descZh: "升级你的金边生活",
        images: [
            "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=200&h=200",
            "https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&q=80&w=200&h=200",
        ],
        href: "/category/living",
    },
];

export default function AntiGravityHero() {
    const { language } = useAppStore();
    const [current, setCurrent] = useState(0);

    const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
    const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

    // Auto-slide every 4 seconds
    useEffect(() => {
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [next]);

    const slide = slides[current]!;
    const lang = language as 'ko' | 'en' | 'km' | 'zh';
    const titleKey = `title${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof slide;
    const descKey = `desc${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof slide;
    const title = (slide[titleKey] as string) || slide.titleEn;
    const desc = (slide[descKey] as string) || slide.descEn;

    return (
        <section className="w-full px-3 pt-2 pb-1">
            <Link href={slide.href} className="block">
                <div className={`relative w-full rounded-2xl bg-gradient-to-r ${slide.gradient} overflow-hidden`}>
                    <div className="flex items-center justify-between p-4 sm:p-5">
                        {/* Left text */}
                        <div className="flex-1 min-w-0 z-10">
                            <h2 className="text-white font-extrabold text-base sm:text-lg leading-tight mb-1">
                                {title}
                            </h2>
                            <p className="text-white/80 text-xs sm:text-sm">
                                {desc}
                            </p>
                        </div>

                        {/* Right product images */}
                        <div className="flex items-end gap-2 ml-3 flex-shrink-0">
                            {(slide.images as string[]).slice(0, 3).map((img, i) => (
                                <div
                                    key={i}
                                    className={`rounded-xl overflow-hidden bg-white/20 shadow-lg ${i === 0 ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-16 sm:h-16'
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        loading={i === 0 ? "eager" : "lazy"}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Slide indicator */}
                    <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5 text-white text-[10px] font-medium">
                        <span>{current + 1}</span>
                        <span className="text-white/50">/</span>
                        <span className="text-white/50">{slides.length}</span>
                    </div>
                </div>
            </Link>

            {/* Nav arrows — desktop only */}
            <div className="hidden sm:flex justify-center gap-2 mt-2">
                <button onClick={prev} className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-gray-800' : 'bg-gray-300'}`}
                    />
                ))}
                <button onClick={next} className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </section>
    );
}
