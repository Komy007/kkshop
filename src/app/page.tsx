'use client';

import React, { useEffect, useState } from 'react';
import AntiGravityHero from '@/components/AntiGravityHero';
import BentoGrid from '@/components/BentoGrid';
import ZigzagShowcase from '@/components/ZigzagShowcase';
import TrustBadges from '@/components/TrustBadges';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import CategoryShortcuts from '@/components/CategoryShortcuts';
import CurationSection from '@/components/CurationSection';
import { useAppStore } from '@/store/useAppStore';
import { Star, ChevronRight } from 'lucide-react';
import { type TranslatedProduct } from '@/lib/api';
import { getSiteSetting } from '@/actions/settingActions';

const homeTranslations: Record<string, any> = {
    ko: {
        mdPick: 'MD 추천 특별전',
        mdDesc: '가장 신선한 한국의 맛, 지금 바로 프놈펜에서 만나보세요.',
        realtimeReview: '실시간 고객 리뷰',
        reviewSubtitle: '실제 프리미엄 고객님들의 생생한 후기',
        catBeauty: '💄 K-Beauty',
        catLiving: '🏠 생활/리빙',
        catPopular: '👑 인기 상품'
    },
    en: {
        mdPick: "Live Flash Deals",
        mdDesc: 'Exclusive limited-time offers. Premium products delivered to your door.',
        realtimeReview: 'Real-time Customer Reviews',
        reviewSubtitle: 'Genuine reviews from our premium customers',
        catBeauty: '💄 K-Beauty',
        catLiving: '🏠 Living/Lifestyle',
        catPopular: '👑 Bestsellers'
    },
    km: {
        mdPick: 'ការជ្រើសរើសពិសេសរបស់ MD',
        mdDesc: 'រសជាតិថ្មីស្រស់ពីប្រទេសកូរ៉េ ឥឡូវនេះមាននៅទីក្រុងភ្នំពេញ។',
        realtimeReview: 'មតិអតិថិជនជាក់ស្តែង',
        reviewSubtitle: 'មតិពិតប្រាកដពីអតិថិជនរបស់យើង',
        catBeauty: '💄 គ្រឿងសំអាងកូរ៉េ',
        catLiving: '🏠 របៀបរស់នៅ',
        catPopular: '👑 ការពេញនិយម'
    },
    zh: {
        mdPick: 'MD 专属推荐',
        mdDesc: '最新鲜的韩国风味，金边即刻体验。',
        realtimeReview: '实时买家秀',
        reviewSubtitle: '来自我们高端客户的真实评价',
        catBeauty: '💄 韩国美妆',
        catLiving: '🏠 居家生活',
        catPopular: '👑 热销商品'
    }
};

export default function Home() {
    const { language } = useAppStore();
    const t = homeTranslations[language] || homeTranslations.en;

    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Site Settings
    const [heroData, setHeroData] = useState<any>(null);
    const [bentoData, setBentoData] = useState<any>(null);

    // Hydration fix & Initial Load
    useEffect(() => {
        setMounted(true);

        async function loadSettings() {
            const hData = await getSiteSetting('landing_hero');
            const bData = await getSiteSetting('landing_bento');
            if (hData) setHeroData(hData);
            if (bData) setBentoData(bData);
        }
        loadSettings();
    }, []);

    // Fetch data when language changes or on mount
    useEffect(() => {
        async function loadProducts() {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/products?lang=${language}`);
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error("Error fetching products", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (mounted) {
            loadProducts();
        }
    }, [language, mounted]);

    if (!mounted) return null;

    return (
        <>
            <main className="flex-grow">
                {/* Hero Section */}
                <AntiGravityHero customData={heroData} />

                {/* Category Shortcuts — Hick's Law: max 9 */}
                <CategoryShortcuts />

                {/* Trust Badges — horizontal strip */}
                <section className="py-6 border-y border-white/5">
                    <div className="max-w-7xl mx-auto px-6 flex justify-center">
                        <TrustBadges variant="horizontal" />
                    </div>
                </section>

                {/* Bento Grid — Living items */}
                <BentoGrid customData={bentoData} />

                {/* AI Curation Sections */}
                <CurationSection products={products} />

                {/* Z-Pattern Zigzag Showcase — Why KKshop */}
                <ZigzagShowcase />

                {/* Marquee Review Section */}
                <section className="bg-white py-12 sm:py-16 overflow-hidden border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex justify-between items-end">
                        <div className="flex flex-col">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-1">{t.realtimeReview}</h2>
                            <p className="text-gray-500 text-sm font-normal">{t.reviewSubtitle}</p>
                        </div>
                        <button className="hidden sm:flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-800 transition-colors text-sm">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative flex overflow-x-hidden group">
                        <div className="flex animate-marquee space-x-4 px-4 whitespace-nowrap group-hover:[animation-play-state:paused]">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <article key={`review-1-${item}`} className="w-[280px] sm:w-[340px] bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex-shrink-0 whitespace-normal group/card">
                                    <div className="flex items-center mb-6">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full overflow-hidden mr-4 border border-gray-100 shadow-sm">
                                            <img src={`https://i.pravatar.cc/150?img=${item * 10}`} alt="avatar" className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">Premium Member K.</h4>
                                            <div className="flex text-amber-400 mt-1">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current text-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed">
                                        &quot;비주얼부터 압도적이네요. 상품 퀄리티는 물론이고, 쇼핑하는 과정 자체가 정말 프리미엄 서비스를 받는 느낌이 듭니다. 강력 추천해요!&quot;
                                    </p>
                                </article>
                            ))}
                        </div>
                        {/* Duplicate for infinite effect */}
                        <div className="flex animate-marquee2 space-x-6 px-6 whitespace-nowrap absolute top-0 group-hover:[animation-play-state:paused]">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <article key={`review-2-${item}`} className="w-[380px] bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex-shrink-0 whitespace-normal group/card">
                                    <div className="flex items-center mb-6">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full overflow-hidden mr-4 border border-gray-100 shadow-sm">
                                            <img src={`https://i.pravatar.cc/150?img=${item * 10 + 5}`} alt="avatar" className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">VIP User {item}</h4>
                                            <div className="flex text-amber-400 mt-1">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed">
                                        &quot;배송이 정말 빠르고 포장이 깔끔합니다! 프놈펜에서 이 정도 퀄리티를 누릴 수 있다니 감동이네요. 앱 디자인도 미쳤습니다.&quot;
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
