"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ArrowRight, Sparkles, Shield, Truck } from "lucide-react";

const zigzagTranslations: Record<string, any> = {
    ko: {
        sectionTitle: "왜 KKshop인가?",
        items: [
            {
                tag: "K-Beauty 정품",
                title: "한국에서 직접 공수한\n프리미엄 화장품",
                desc: "보건부(MoH) 인증을 받은 100% 한국 정품만을 취급합니다. 캄보디아 기후에 최적화된 텍스처로 완벽한 피부를 경험하세요.",
                cta: "베스트셀러 보기",
            },
            {
                tag: "스마트 리빙",
                title: "프놈펜 라이프를\n업그레이드하다",
                desc: "공기청정기부터 인체공학 베개까지. 한국인이 직접 사용하고 추천하는 프리미엄 생활용품으로 일상을 바꿔보세요.",
                cta: "리빙 컬렉션",
            },
            {
                tag: "빠른 배송",
                title: "프놈펜 전역\n당일·익일 배송",
                desc: "주문 후 24시간 이내 배송. ABA Pay, Wing 등 캄보디아 로컬 결제를 지원하며, 배송 추적이 실시간으로 가능합니다.",
                cta: "배송 안내",
            },
        ],
    },
    en: {
        sectionTitle: "Why KKshop?",
        items: [
            {
                tag: "K-Beauty Authentic",
                title: "Premium Cosmetics\nDirect from Korea",
                desc: "We only carry MoH-certified 100% authentic Korean products. Experience flawless skin with textures optimized for Cambodia's climate.",
                cta: "Shop Bestsellers",
            },
            {
                tag: "Smart Living",
                title: "Upgrade Your\nPhnom Penh Life",
                desc: "From air purifiers to ergonomic pillows. Premium Korean lifestyle goods personally tested and recommended by Korean residents.",
                cta: "Living Collection",
            },
            {
                tag: "Fast Delivery",
                title: "Same-Day Delivery\nAcross Phnom Penh",
                desc: "Delivered within 24 hours. We support local payment methods like ABA Pay and Wing, with real-time delivery tracking.",
                cta: "Delivery Info",
            },
        ],
    },
    km: {
        sectionTitle: "ហេតុអ្វីជ្រើសរើស KKshop?",
        items: [
            {
                tag: "K-Beauty ពិតប្រាកដ",
                title: "គ្រឿងសំអាងប្រណីត\nដោយផ្ទាល់ពីកូរ៉េ",
                desc: "យើងលក់តែផលិតផលកូរ៉េពិតប្រាកដ 100% ដែលមានវិញ្ញាបនបត្រ MoH។ សាកល្បងស្បែកឥតខ្ចោះជាមួយផលិតផលសម្រាប់អាកាសធាតុកម្ពុជា។",
                cta: "មើលផលិតផលល្អបំផុត",
            },
            {
                tag: "ជីវិតឆ្លាតវៃ",
                title: "ធ្វើឱ្យជីវិតនៅភ្នំពេញ\nប្រសើរឡើង",
                desc: "ពីម៉ាស៊ីនបន្សុទ្ធខ្យល់ដល់ខ្នើយស្រួល។ របស់ប្រើប្រាស់ប្រណីតពីកូរ៉េដែលអ្នកកូរ៉េណែនាំ។",
                cta: "ផលិតផលរស់នៅ",
            },
            {
                tag: "ដឹកជញ្ជូនរហ័ស",
                title: "ដឹកជញ្ជូនក្នុងថ្ងៃ\nពេញទីក្រុងភ្នំពេញ",
                desc: "ដឹកជញ្ជូនក្នុង 24 ម៉ោង។ ទូទាត់តាម ABA Pay និង Wing ជាមួយការតាមដានដឹកជញ្ជូន។",
                cta: "ព័ត៌មានដឹកជញ្ជូន",
            },
        ],
    },
    zh: {
        sectionTitle: "为什么选择 KKshop？",
        items: [
            {
                tag: "K-Beauty 正品",
                title: "韩国直邮\n高端化妆品",
                desc: "仅销售经柬埔寨卫生部(MoH)认证的100%韩国正品。体验专为柬埔寨气候优化的质地。",
                cta: "查看热销商品",
            },
            {
                tag: "智慧生活",
                title: "全面升级\n金边生活品质",
                desc: "从空气净化器到人体工学枕。由韩国居民亲自使用并推荐的高品质生活用品。",
                cta: "居家系列",
            },
            {
                tag: "极速配送",
                title: "金边全域\n当日达",
                desc: "下单后24小时内送达。支持ABA Pay、Wing等本地支付，实时追踪配送状态。",
                cta: "配送详情",
            },
        ],
    },
};

const sectionImages = [
    "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=800",
];

const sectionGradients = [
    "from-vivid-pink/10 via-transparent to-brand-secondary/5",
    "from-vivid-cyan/10 via-transparent to-brand-accent/5",
    "from-vivid-yellow/10 via-transparent to-vivid-green/5",
];

const sectionIcons = [Sparkles, Shield, Truck];

export default function ZigzagShowcase() {
    const { language } = useAppStore();
    const t = zigzagTranslations[language] || zigzagTranslations.en;
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const items = section.querySelectorAll('.scroll-reveal');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '-30px' }
        );

        items.forEach((item) => observer.observe(item));
        return () => observer.disconnect();
    }, []);

    return (
        <section className="py-24 w-full relative" ref={sectionRef}>
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-4">
                        {t.sectionTitle}
                    </h2>
                    <div className="w-24 h-1.5 bg-gradient-to-r from-vivid-pink to-vivid-cyan mx-auto rounded-full" />
                </div>

                {/* Zigzag Items — Z-Pattern Layout */}
                <div className="flex flex-col gap-32">
                    {t.items.map((item: any, idx: number) => {
                        const isReversed = idx % 2 !== 0;
                        const Icon = sectionIcons[idx] || Sparkles;

                        return (
                            <article
                                key={idx}
                                className={`scroll-reveal flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}
                                style={{ transitionDelay: `${idx * 150}ms` }}
                            >
                                {/* Image Side */}
                                <div className={`w-full lg:w-1/2 relative group`}>
                                    <div className={`absolute -inset-4 bg-gradient-to-br ${sectionGradients[idx] || sectionGradients[0]} rounded-[2rem] blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                                    <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                                        <img
                                            src={sectionImages[idx]}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-space-900/60 to-transparent" />
                                    </div>
                                </div>

                                {/* Text Side */}
                                <div className="w-full lg:w-1/2 flex flex-col gap-6">
                                    {/* Tag */}
                                    <div className="inline-flex items-center gap-2 self-start">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-vivid-pink to-vivid-cyan flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-widest text-vivid-cyan">
                                            {item.tag}
                                        </span>
                                    </div>

                                    {/* Title — Massive Typography */}
                                    <h3 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                                        {String(item.title || '').split('\n').map((line: string, i: number) => (
                                            <span key={i} className="block">{line}</span>
                                        ))}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-lg text-white/60 leading-relaxed max-w-md">
                                        {item.desc}
                                    </p>

                                    {/* CTA */}
                                    <button className="group/btn inline-flex items-center gap-3 self-start px-8 py-4 rounded-full bg-white text-space-900 font-bold text-lg hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all btn-micro">
                                        <span>{item.cta}</span>
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
