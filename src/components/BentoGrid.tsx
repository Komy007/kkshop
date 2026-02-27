"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ArrowUpRight } from "lucide-react";

export const bentoTranslations: Record<string, any> = {
    ko: {
        sectionTitle: "한국인 추천 생활용품관",
        sectionDesc: "프놈펜 라이프를 한 단계 업그레이드할 필수 리빙 아이템",
        items: [
            { title: "오가닉 코튼 샤워 타월", desc: "부드럽고 빠른 흡수력" },
            { title: "스마트 공기청정 미니", desc: "건기에도 탁월한 상쾌함" },
            { title: "프리미엄 디퓨저", desc: "호텔 라운지의 향기" },
            { title: "인체공학 숙면 베개", desc: "더운 밤에도 시원하게" },
        ],
    },
    en: {
        sectionTitle: "Premium Lifestyle Picks",
        sectionDesc: "Essential living items to upgrade your life in Phnom Penh",
        items: [
            { title: "Organic Cotton Towels", desc: "Soft and fast-absorbing" },
            { title: "Smart Mini Purifier", desc: "Fresh air during dry season" },
            { title: "Signature Diffuser", desc: "Hotel lounge fragrance" },
            { title: "Ergonomic Pillow", desc: "Cool sleep on hot nights" },
        ],
    },
    km: {
        sectionTitle: "ផលិតផលរស់នៅកម្រិតខ្ពស់",
        sectionDesc: "របស់ចាំបាច់សម្រាប់ជីវិតប្រកបដោយផាសុកភាពនៅភ្នំពេញ",
        items: [
            { title: "កន្សែងកប្បាសធម្មជាតិ", desc: "ទន់ និងស្រូបទឹកបានល្អ" },
            { title: "ម៉ាស៊ីនបន្សុទ្ធខ្យល់ឆ្លាតវៃ", desc: "ខ្យល់បរិសុទ្ធរាល់ថ្ងៃ" },
            { title: "ទឹកអប់ក្នុងបន្ទប់", desc: "ក្លិនក្រអូបបែបសណ្ឋាគារ" },
            { title: "ខ្នើយខ្យល់ត្រជាក់", desc: "គេងលក់ស្រួលពេញមួយយប់" },
        ],
    },
    zh: {
        sectionTitle: "精选高品质生活用品",
        sectionDesc: "全面提升您在金边的生活质量",
        items: [
            { title: "有机纯棉亲肤浴巾", desc: "极致柔软 瞬间吸水" },
            { title: "智能迷你空气净化器", desc: "旱季必备 清新好空气" },
            { title: "高级香薰摆件", desc: "五星级酒店的大堂香调" },
            { title: "清凉助眠人体工学枕", desc: "热夜也能安然入梦" },
        ],
    },
};

const defaultImages = [
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=600",
];

export default function BentoGrid({ customData }: { customData?: any }) {
    const { language } = useAppStore();
    const t = bentoTranslations[language] || bentoTranslations.en;
    const gridRef = useRef<HTMLDivElement>(null);

    const displayTitle = customData?.sectionTitle || t.sectionTitle;
    const displayDesc = customData?.sectionDesc || t.sectionDesc;

    const items = t.items.map((item: any, idx: number) => {
        const dbItem = customData?.items?.[idx];
        return {
            title: (dbItem?.title || item.title || "") as string,
            desc: (dbItem?.desc || item.desc || "") as string,
            image: (dbItem?.image || defaultImages[idx] || "") as string
        };
    });

    // IntersectionObserver for scroll reveal (replaces Framer Motion stagger)
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const children = grid.querySelectorAll('.scroll-reveal');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '-50px' }
        );

        children.forEach((child) => observer.observe(child));
        return () => observer.disconnect();
    }, []);

    return (
        <section className="py-24 w-full relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-16 md:text-center text-left">
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                        {displayTitle}
                    </h2>
                    <p className="text-xl text-white/50">{displayDesc}</p>
                </div>

                <div
                    ref={gridRef}
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[250px] md:auto-rows-[300px]"
                >
                    {/* Main Large Item */}
                    <div
                        className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl glass-card border border-white/10 scroll-reveal"
                        style={{ transitionDelay: '0ms' }}
                    >
                        <img
                            src={items[0].image || ''}
                            alt={items[0].title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
                            <div>
                                <p className="text-brand-accent font-medium mb-2 tracking-wide uppercase text-sm">
                                    Best Seller
                                </p>
                                <h3 className="text-3xl font-bold text-white mb-2">{items[0].title}</h3>
                                <p className="text-white/70">{items[0].desc}</p>
                            </div>
                            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-space-900 transition-colors">
                                <ArrowUpRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Vertical Item */}
                    <div
                        className="md:col-span-1 md:row-span-2 group relative overflow-hidden rounded-3xl glass-panel border border-white/10 scroll-reveal"
                        style={{ transitionDelay: '150ms' }}
                    >
                        <img
                            src={items[1].image || ''}
                            alt={items[1].title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = items[1].image || defaultImages[1];
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <h3 className="text-2xl font-bold text-white mb-2 relative z-10">{items[1].title}</h3>
                            <p className="text-white/60 text-sm mb-4 relative z-10">{items[1].desc}</p>
                            <span className="inline-flex items-center text-brand-primary text-sm font-semibold group-hover:translate-x-1 transition-transform relative z-10">
                                Shop Now <ArrowUpRight className="w-4 h-4 ml-1" />
                            </span>
                        </div>
                    </div>

                    {/* Standard Item 1 */}
                    <div
                        className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl bg-space-800 border border-white/5 scroll-reveal"
                        style={{ transitionDelay: '300ms' }}
                    >
                        <img
                            src={items[2].image || ''}
                            alt={items[2].title}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-space-900 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 relative z-10">
                            <h3 className="text-xl font-bold text-white mb-1">{items[2].title}</h3>
                            <p className="text-white/50 text-xs">{items[2].desc}</p>
                        </div>
                    </div>

                    {/* Standard Item 2 */}
                    <div
                        className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl bg-space-800 border border-white/10 flex items-center justify-center scroll-reveal"
                        style={{ transitionDelay: '450ms' }}
                    >
                        <img
                            src={items[3].image || ''}
                            alt={items[3].title}
                            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 group-hover:opacity-80 transition-all duration-700"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-space-900 to-transparent" />
                        <div className="relative z-10 p-6 text-center">
                            <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">{items[3].title}</h3>
                            <p className="text-white/80 text-sm drop-shadow-md">{items[3].desc}</p>
                            <button className="mt-4 px-6 py-2 rounded-full bg-white text-space-900 text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 btn-micro">
                                Explore
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
