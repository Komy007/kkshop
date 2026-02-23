"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles, ArrowRight } from "lucide-react";

export const heroTranslations: Record<string, any> = {
    ko: {
        topText: "이제는 좋은 상품을 구할 수 있습니다.",
        badge: "100% 한국 정품 화장품관",
        title: "무중력처럼 가벼운\n완벽한 피부의 시작",
        desc: "캄보디아 기후에 완벽히 맞춘 텍스처. 한국 프리미엄 스킨케어를 프놈펜에서 가장 빠르게 경험하세요.",
        cta: "베스트셀러 보기",
    },
    en: {
        topText: "Now you can get great products.",
        badge: "100% Authentic Korean Cosmetics",
        title: "Weightless like Zero Gravity\nFlawless Skin Begins",
        desc: "Textures perfectly suited for Cambodia's climate. Experience premium K-skincare in Phnom Penh.",
        cta: "Shop Bestsellers",
    },
    km: {
        topText: "ឥឡូវនេះអ្នកអាចទទួលបានផលិតផលល្អៗ។",
        badge: "គ្រឿងសំអាងកូរ៉េសុទ្ធ 100%",
        title: "ស្រាលដូចគ្មានទំនាញផែនដី\nស្បែកឥតខ្ចោះចាប់ផ្តើមទីនេះ",
        desc: "សាច់ក្រែមស័ក្តិសមឥតខ្ចោះសម្រាប់អាកាសធាតុប្រកបដោយផាសុកភាព។ ទទួលបទពិសោធន៍នៅភ្នំពេញ។",
        cta: "មើលផលិតផលលក់ដាច់",
    },
    zh: {
        topText: "现在您可以获得优质的产品。",
        badge: "100% 韩国正品美妆馆",
        title: "如失重般轻盈\n开启无暇美肌",
        desc: "专为柬埔寨气候打造的质地。在金边即刻体验韩国顶级护肤品。",
        cta: "查看热销商品",
    },
};

export default function AntiGravityHero({ customData }: { customData?: any }) {
    const { language } = useAppStore();
    const t = heroTranslations[language] || heroTranslations.en;

    // Apply custom overrides
    const topTextContent = customData?.topTextParams?.text || t.topText;
    const topTextSize = customData?.topTextParams?.fontSize || "1.125rem"; // 18px equivalent default

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

    const safeImg0Title = img0?.title || defaultImages[0]!.title || '';
    const safeImg0Label = img0?.label || defaultImages[0]!.label || '';

    const floatingTransition: any = {
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
    };

    return (
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Aurora Background Effect */}
            <div className="absolute inset-0 bg-aurora opacity-30 pointer-events-none" />

            {/* Decorative Stars */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={`star-${i}`}
                        className="absolute bg-white rounded-full"
                        style={{
                            width: Math.random() * 3 + 1 + "px",
                            height: Math.random() * 3 + 1 + "px",
                            top: Math.random() * 100 + "%",
                            left: Math.random() * 100 + "%",
                            opacity: Math.random() * 0.5 + 0.2,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-start gap-6"
                >
                    {/* Top Text (New Area Above Badge) */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/80 font-medium tracking-wide drop-shadow-md"
                        style={{ fontSize: topTextSize }}
                    >
                        {topTextContent}
                    </motion.p>

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 border border-brand-secondary/30"
                    >
                        <Sparkles className="w-4 h-4 text-brand-secondary animate-pulse-glow" />
                        <span className="text-white/90 font-semibold tracking-wider" style={{ fontSize: badgeSize }}>
                            {badgeText}
                        </span>
                    </motion.div>

                    <h1 className="font-bold text-white leading-[1.15] tracking-tight" style={{ fontSize: titleSize }}>
                        {String(titleText || '').split('\n').map((line: string, i: number) => (
                            <span key={i} className="block last:text-transparent last:bg-clip-text last:bg-gradient-to-r last:from-white last:to-white/50">
                                {line}
                            </span>
                        ))}
                    </h1>

                    <p className="text-lg md:text-xl text-white/60 max-w-lg leading-relaxed font-light">
                        {t.desc}
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4 group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-space-900 rounded-full font-bold overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                        <span className="relative z-10">{t.cta}</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary/20 to-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                </motion.div>

                {/* Right Floating Visuals (Cosmetics) */}
                <div className="relative h-[600px] hidden lg:block perspective-1000">
                    {/* Main Hero Product */}
                    <motion.div
                        animate={{ y: [-15, 15, -15], rotate: [-2, 2, -2] }}
                        transition={{ ...floatingTransition, duration: 6 }}
                        className="absolute top-[15%] left-[10%] w-[320px] aspect-[3/4] rounded-3xl overflow-hidden glass-card shadow-[0_20px_50px_rgba(236,72,153,0.15)] z-20"
                    >
                        <img
                            src={img0?.url || defaultImages[0]!.url || ''}
                            alt="Premium Serum"
                            className="w-full h-full object-cover scale-110"
                        />
                        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <h3 className="text-white font-bold text-xl">{safeImg0Title}</h3>
                            <p className="text-brand-secondary font-medium">{safeImg0Label}</p>
                        </div>
                    </motion.div>

                    {/* Secondary Floating Item 1 */}
                    <motion.div
                        animate={{ y: [10, -15, 10], rotate: [5, -5, 5] }}
                        transition={{ ...floatingTransition, duration: 8, delay: 1 }}
                        className="absolute top-[5%] right-[5%] w-[200px] aspect-square rounded-full overflow-hidden glass-card shadow-[0_15px_40px_rgba(99,102,241,0.2)] z-10"
                    >
                        <img
                            src={img1?.url || defaultImages[1]!.url || ''}
                            alt="Hydration Cream"
                            className="w-full h-full object-cover"
                        />
                    </motion.div>

                    <motion.div
                        animate={{ y: [-10, 20, -10], x: [-5, 5, -5] }}
                        transition={{ ...floatingTransition, duration: 7, delay: 2 }}
                        className="absolute bottom-[10%] right-[20%] w-[240px] aspect-[4/3] rounded-2xl overflow-hidden glass-card shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-30 border-white/20"
                    >
                        <img
                            src={img2?.url || defaultImages[2]!.url || ''}
                            alt="Cushion Foundation"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = defaultImages[2]!.url
                            }}
                        />
                    </motion.div>

                    {/* Abstract Glow Orbs */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/20 rounded-full blur-[100px] z-0 pointer-events-none"
                    />
                </div>
            </div>
        </section>
    );
}
