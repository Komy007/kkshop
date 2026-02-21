'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import TrustBanner from '@/components/TrustBanner';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { useAppStore } from '@/store/useAppStore';
import { Star, TrendingUp, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { getProductsByLanguage, type TranslatedProduct } from '@/lib/api';

const homeTranslations: Record<string, any> = {
    ko: {
        mdPick: 'MD 추천 특별전',
        mdDesc: '가장 신선한 한국의 맛, 지금 바로 프놈펜에서 만나보세요.',
        realtimeReview: '실시간 고객 리뷰',
        catBeauty: '💄 K-Beauty',
        catLiving: '🏠 생활/리빙',
        catPopular: '👑 인기 상품'
    },
    en: {
        mdPick: "Live Flash Deals",
        mdDesc: 'Exclusive limited-time offers. Premium products delivered to your door.',
        realtimeReview: 'Real-time Customer Reviews',
        catBeauty: '💄 K-Beauty',
        catLiving: '🏠 Living/Lifestyle',
        catPopular: '👑 Bestsellers'
    },
    km: {
        mdPick: 'ការជ្រើសរើសពិសេសរបស់ MD',
        mdDesc: 'រសជាតិថ្មីស្រស់ពីប្រទេសកូរ៉េ ឥឡូវនេះមាននៅទីក្រុងភ្នំពេញ។',
        realtimeReview: 'មតិអតិថិជនជាក់ស្តែង',
        catBeauty: '💄 គ្រឿងសំអាងកូរ៉េ',
        catLiving: '🏠 របៀបរស់នៅ',
        catPopular: '👑 ការពេញនិយម'
    },
    zh: {
        mdPick: 'MD 专属推荐',
        mdDesc: '最新鲜的韩国风味，金边即刻体验。',
        realtimeReview: '实时买家秀',
        catBeauty: '💄 韩国美妆',
        catLiving: '🏠 居家生活',
        catPopular: '👑 热销商品'
    }
};

export default function Home() {
    const { language } = useAppStore();
    const t = homeTranslations[language];

    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Hydration fix & Initial Load
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch data when language changes or on mount
    useEffect(() => {
        async function loadProducts() {
            setIsLoading(true);
            try {
                // Since getProductsByLanguage uses Prisma, it should ideally be called in a Server Component
                // However, for this client component demo with Zustand, we'll simulate an API call route
                // In a real Next.js App Router, we'd wrap this in a Server Action or Route Handler.
                // For now, assume it's exposed via a Route Handler (e.g. GET /api/products?lang=ko)

                const response = await fetch(`/api/products?lang=${language}`);
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                } else {
                    console.error("Failed to fetch products");
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
            <Header />
            <main className="flex-grow bg-white">
                <HeroBanner />
                <TrustBanner />

                {/* Live Deals Section - Premium Light/Shadcn UI */}
                <section className="relative w-full py-20 bg-gray-50/50 border-t border-gray-100 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

                            {/* Left/Top Content Focus */}
                            <div className="lg:w-1/3 flex flex-col justify-center">
                                <div className="inline-flex items-center gap-2 mb-6 bg-white shadow-sm border border-gray-100 px-3 py-1.5 rounded-full w-fit">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                                    </span>
                                    <span className="text-red-600 font-bold uppercase tracking-widest text-xs">On Air</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 leading-[1.15]">
                                    {t.mdPick}
                                </h2>
                                <p className="text-gray-500 text-lg mb-8 font-normal">
                                    {t.mdDesc}
                                </p>

                                {/* Promotional feature area */}
                                <div className="hidden lg:block relative rounded-[2rem] overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] aspect-[4/5] bg-white border border-gray-200 group">
                                    <img
                                        src="https://images.unsplash.com/photo-1547592180-85f17399056e?w=800&q=80"
                                        alt="MD Pick Promo"
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent flex items-end p-8">
                                        <div className="text-white w-full">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                                    Limited Offer
                                                </span>
                                                <div className="flex items-center gap-1.5 text-white bg-red-500/90 shadow-sm border border-red-500 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-bold">12:45:00 Left</span>
                                                </div>
                                            </div>
                                            <h3 className="text-3xl font-extrabold mb-2 drop-shadow-md">Premium Set</h3>
                                            <p className="text-white/80 text-sm font-medium">Secure yours before they run out.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right/Bottom Product Grid */}
                            <div className="lg:w-2/3">
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : products.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
                                        {products.map((product) => (
                                            // Transform TranslatedProduct to ProductCard expected shape
                                            <ProductCard key={product.id} product={{
                                                id: product.id,
                                                sku: product.sku,
                                                priceUsd: product.priceUsd,
                                                stockQty: product.stockQty,
                                                imageUrl: `https://ui-avatars.com/api/?name=${product.sku}&background=random&size=400`, // Placeholder image since we don't have real images yet
                                                name: product.name,
                                                shortDesc: product.shortDesc || '',
                                                isBestSeller: true, // Mocked for UI
                                                rating: 5.0,        // Mocked for UI
                                                reviewCount: 99     // Mocked for UI
                                            }} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] border border-gray-100 shadow-sm h-full">
                                        <Sparkles className="w-12 h-12 text-blue-400 mb-4" />
                                        <p className="text-gray-500 font-medium text-lg">새로운 라이브 딜을 준비 중입니다.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </section>

                {/* Marquee Review Section */}
                <section className="bg-white py-24 overflow-hidden border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 flex justify-between items-end">
                        <div className="flex flex-col">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-2">{t.realtimeReview}</h2>
                            <p className="text-gray-500 font-normal">실제 프리미엄 고객님들의 생생한 후기</p>
                        </div>
                        <button className="hidden sm:flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative flex overflow-x-hidden group">
                        <div className="flex animate-marquee space-x-6 px-6 whitespace-nowrap group-hover:[animation-play-state:paused]">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div key={`review-1-${item}`} className="w-[380px] bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex-shrink-0 whitespace-normal group/card">
                                    <div className="flex items-center mb-6">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full overflow-hidden mr-4 border border-gray-100 shadow-sm">
                                            <img src={`https://i.pravatar.cc/150?img=${item * 10}`} alt="avatar" className="w-full h-full object-cover" />
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
                                        "비주얼부터 압도적이네요. 상품 퀄리티는 물론이고, 쇼핑하는 과정 자체가 정말 프리미엄 서비스를 받는 느낌이 듭니다. 강력 추천해요!"
                                    </p>
                                </div>
                            ))}
                        </div>
                        {/* Duplicate for infinite effect */}
                        <div className="flex animate-marquee2 space-x-6 px-6 whitespace-nowrap absolute top-0 group-hover:[animation-play-state:paused]">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div key={`review-2-${item}`} className="w-[380px] bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex-shrink-0 whitespace-normal group/card">
                                    <div className="flex items-center mb-6">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full overflow-hidden mr-4 border border-gray-100 shadow-sm">
                                            <img src={`https://i.pravatar.cc/150?img=${item * 10 + 5}`} alt="avatar" className="w-full h-full object-cover" />
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
                                        "배송이 정말 빠르고 포장이 깔끔합니다! 프놈펜에서 이 정도 퀄리티를 누릴 수 있다니 감동이네요. 앱 디자인도 미쳤습니다."
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main >
            <Footer />
        </>
    );
}
