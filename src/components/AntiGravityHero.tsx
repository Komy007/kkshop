"use client";

import { useAppStore } from "@/store/useAppStore";
import { Sparkles, ArrowRight } from "lucide-react";

export const heroTranslations: Record<string, any> = {
    ko: {
        topText: "오랫동안 기다리셨습니다. 품질을 자부합니다.",
        badge: "100% 한국 정품 화장품관",
        title: "새로운, 완벽한 피부의 시작!\n당신이 선택하세요.",
        desc: "캄보디아 기후에 완벽히 맞춘 텍스처. 한국 프리미엄 스킨케어를 프놈펜에서 가장 빠르게 경험하세요.",
        cta: "베스트셀러 보기",
    },
    en: {
        topText: "Premium Korean products, now in Phnom Penh.",
        badge: "100% Authentic Korean Cosmetics",
        title: "Weightless Skin Care\nFlawless Results Begin Here.",
        desc: "Textures perfectly suited for Cambodia's climate. Experience premium K-skincare in Phnom Penh.",
        cta: "Shop Bestsellers",
    },
    km: {
        topText: "ឥឡូវនេះអ្នកអាចទទួលបានផលិតផលល្អៗ នៅភ្នំពេញ។",
        badge: "គ្រឿងសំអាងកូរ៉េសុទ្ធ 100%",
        title: "ស្រាលដូចគ្មានទំនាញ\nស្បែកឥតខ្ចោះចាប់ផ្តើម",
        desc: "សាច់ក្រែមស័ក្តិសមឥតខ្ចោះ។ ទទួលបទពិសោធន៍ K-Beauty នៅភ្នំពេញ។",
        cta: "មើលផលិតផលលក់ដាច់",
    },
    zh: {
        topText: "现在您可以在金边获得优质的韩国产品。",
        badge: "100% 韩国正品美妆馆",
        title: "轻盈如失重\n无暇美肌从此开始",
        desc: "专为柬埔寨气候打造的质地。在金边即刻体验韩国顶级护肤品。",
        cta: "查看热销商品",
    },
};

export default function AntiGravityHero({ customData }: { customData?: any }) {
    const { language } = useAppStore();
    const t = heroTranslations[language] || heroTranslations['en']!;

    const topTextContent = customData?.topTextParams?.text || t.topText;
    const topTextSize = customData?.topTextParams?.fontSize || "1.125rem";
    const badgeText = customData?.badgeParams?.text || t.badge;
    const badgeSize = customData?.badgeParams?.fontSize || "0.875rem";
    const titleText = customData?.titleParams?.text || t.title;
    const titleSize = customData?.titleParams?.fontSize || "3.75rem";

    const defaultImages = [
        { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600", title: "Luminous Serum", label: "K-Premium" },
        { url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=400" },
        { url: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=500" }
    ];
    const imgs = customData?.images || defaultImages;
    const img0 = imgs[0] || defaultImages[0]!;
    const img1 = imgs[1] || defaultImages[1]!;
    const img2 = imgs[2] || defaultImages[2]!;

    // Generate deterministic star positions
    const stars = Array.from({ length: 12 }, (_, i) => ({
        width: (((i * 7 + 3) % 5) + 1) + "px",
        top: (((i * 23 + 11) % 100)) + "%",
        left: (((i * 37 + 5) % 100)) + "%",
        opacity: ((i * 13 % 5) + 2) / 10,
        duration: ((i * 11 % 3) + 2) + "s",
        delay: ((i * 7 % 5) * 0.4) + "s",
    }));

    return (
        <section className="relative w-full min-h-[100svh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">

            {/* Aurora Background */}
            <div className="absolute inset-0 bg-aurora opacity-30 pointer-events-none" />

            {/* Decorative Stars — CSS-only twinkle */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {stars.map((star, i) => (
                    <div
                        key={`star-${i}`}
                        className="absolute bg-white rounded-full animate-star"
                        style={{
                            width: star.width,
                            height: star.width,
                            top: star.top,
                            left: star.left,
                            opacity: star.opacity,
                            '--star-duration': star.duration,
                            '--star-delay': star.delay,
                        } as React.CSSProperties}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 pt-8 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* ── Left Text Content ── */}
                <div className="flex flex-col items-start gap-5 animate-fade-in-left">

                    <p
                        className="text-white/80 font-medium tracking-wide drop-shadow-md text-base sm:text-lg animate-fade-in-up delay-100"
                        style={{ fontSize: topTextSize }}
                    >
                        {topTextContent}
                    </p>

                    <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 border border-brand-secondary/30 animate-fade-in-up delay-200">
                        <Sparkles className="w-4 h-4 text-brand-secondary animate-pulse-glow flex-shrink-0" />
                        <span className="text-white/90 font-semibold tracking-wider text-sm" style={{ fontSize: badgeSize }}>
                            {badgeText}
                        </span>
                    </div>

                    <h1 className="font-bold text-white leading-[1.15] tracking-tight text-4xl sm:text-5xl lg:text-6xl" style={{ fontSize: titleSize }}>
                        {String(titleText || '').split('\n').map((line: string, i: number) => (
                            <span key={i} className="block last:text-transparent last:bg-clip-text last:bg-gradient-to-r last:from-white last:to-white/50">
                                {line}
                            </span>
                        ))}
                    </h1>

                    <p className="text-base sm:text-lg text-white/60 max-w-lg leading-relaxed font-light animate-fade-in-up delay-300">
                        {t.desc}
                    </p>

                    <button
                        className="mt-2 group relative inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-white text-space-900 rounded-full font-bold overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 animate-fade-in-up delay-400 btn-micro"
                    >
                        <span className="relative z-10">{t.cta}</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary/20 to-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* ── Right Floating Visuals ── */}
                {/* Mobile: horizontal scrollable strip with floating cards */}
                <div className="block lg:hidden w-full">
                    <div className="flex items-end gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
                        {/* Card 1 – Main */}
                        <div className="snap-center flex-shrink-0 w-[180px] aspect-[3/4] rounded-3xl overflow-hidden glass-card shadow-[0_15px_40px_rgba(236,72,153,0.2)] animate-float-slow relative">
                            <img src={img0?.url || defaultImages[0]!.url} alt="Serum" className="w-full h-full object-cover scale-110" loading="lazy" />
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-white font-bold text-sm">{img0?.title || 'Luminous Serum'}</h3>
                                <p className="text-brand-secondary font-medium text-xs">{img0?.label || 'K-Premium'}</p>
                            </div>
                        </div>

                        {/* Card 2 – Secondary */}
                        <div className="snap-center flex-shrink-0 w-[140px] aspect-square rounded-full overflow-hidden glass-card shadow-[0_10px_30px_rgba(99,102,241,0.25)] animate-float-medium">
                            <img src={img1?.url || defaultImages[1]!.url} alt="Cream" className="w-full h-full object-cover" loading="lazy" />
                        </div>

                        {/* Card 3 – Accent */}
                        <div className="snap-center flex-shrink-0 w-[160px] aspect-[4/3] rounded-2xl overflow-hidden glass-card shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-float-fast">
                            <img src={img2?.url || defaultImages[2]!.url} alt="Foundation" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                    </div>
                </div>

                {/* Desktop: floating layout with CSS animations */}
                <div className="relative h-[600px] hidden lg:block" style={{ perspective: '1000px' }}>
                    {/* Main card */}
                    <div className="absolute top-[15%] left-[10%] w-[320px] aspect-[3/4] rounded-3xl overflow-hidden glass-card shadow-[0_20px_50px_rgba(236,72,153,0.15)] z-20 animate-float-slow">
                        <img src={img0?.url || defaultImages[0]!.url} alt="Premium Serum" className="w-full h-full object-cover scale-110" loading="lazy" />
                        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <h3 className="text-white font-bold text-xl">{img0?.title || 'Luminous Serum'}</h3>
                            <p className="text-brand-secondary font-medium">{img0?.label || 'K-Premium'}</p>
                        </div>
                    </div>

                    {/* Circle card */}
                    <div className="absolute top-[5%] right-[5%] w-[200px] aspect-square rounded-full overflow-hidden glass-card shadow-[0_15px_40px_rgba(99,102,241,0.2)] z-10 animate-float-medium">
                        <img src={img1?.url || defaultImages[1]!.url} alt="Cream" className="w-full h-full object-cover" loading="lazy" />
                    </div>

                    {/* Accent card */}
                    <div className="absolute bottom-[10%] right-[20%] w-[240px] aspect-[4/3] rounded-2xl overflow-hidden glass-card shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-30 border-white/20 animate-float-fast">
                        <img src={img2?.url || defaultImages[2]!.url} alt="Foundation" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                    </div>

                    {/* Glow orb */}
                    <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brand-primary/20 rounded-full blur-[100px] z-0 pointer-events-none animate-breathe" />
                </div>

            </div>
        </section>
    );
}
