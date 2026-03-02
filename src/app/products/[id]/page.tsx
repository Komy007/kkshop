'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Star, ShoppingCart, Heart, ChevronLeft, Check, Minus, Plus } from 'lucide-react';
import TrustBadges from '@/components/TrustBadges';
import Footer from '@/components/Footer';
import { useCartStore } from '@/store/useCartStore';

const pdpTranslations: Record<string, any> = {
    ko: {
        tabs: { desc: '상세 설명', ingredients: '성분 정보', reviews: '고객 리뷰' },
        addToCart: '장바구니 담기',
        added: '담기 완료!',
        buyNow: '바로 구매',
        inStock: '재고 있음',
        outOfStock: '품절',
        back: '뒤로 가기',
        qty: '수량',
        freeShipping: '$30 이상 무료 배송',
        sampleNotice: '테스트용 샘플 상품입니다',
        sampleDesc: '본 상품은 쇼핑몰 결제 및 UI 테스트를 위해 등록된 가상의 샘플 상품입니다. 실제 배송되지 않습니다.',
    },
    en: {
        tabs: { desc: 'Description', ingredients: 'Ingredients', reviews: 'Reviews' },
        addToCart: 'Add to Cart',
        added: 'Added!',
        buyNow: 'Buy Now',
        inStock: 'In Stock',
        outOfStock: 'Sold Out',
        back: 'Go Back',
        qty: 'Qty',
        freeShipping: 'Free shipping over $30',
        sampleNotice: 'Sample product for testing',
        sampleDesc: 'This is a virtual sample product registered for UI and payment testing. It will not be shipped.',
    },
    km: {
        tabs: { desc: 'ការពិពណ៌នា', ingredients: 'សមាសធាតុ', reviews: 'មតិអតិថិជន' },
        addToCart: 'បន្ថែមទៅរទេះ',
        added: 'បានបន្ថែម!',
        buyNow: 'ទិញឥឡូវ',
        inStock: 'មានស្តុក',
        outOfStock: 'អស់ស្តុក',
        back: 'ថយក្រោយ',
        qty: 'ចំនួន',
        freeShipping: 'ដឹកដោយឥតគិតថ្លៃលើសពី $30',
        sampleNotice: 'ផលិតផលគំរូសម្រាប់ការសាកល្បង',
        sampleDesc: 'នេះគឺជាផលិតផលគំរូនិម្មិតសម្រាប់ការសាកល្បង UI និងការទូទាត់។ វានឹងមិនត្រូវបានដឹកជញ្ជូនទេ។',
    },
    zh: {
        tabs: { desc: '详细描述', ingredients: '成分信息', reviews: '用户评价' },
        addToCart: '加入购物车',
        added: '已添加!',
        buyNow: '立即购买',
        inStock: '有库存',
        outOfStock: '已售罄',
        back: '返回',
        qty: '数量',
        freeShipping: '满$30免费配送',
        sampleNotice: '用于测试的样品',
        sampleDesc: '本商品是为测试UI和付款而注册的虚拟样品。不会进行实际发货。',
    },
};

interface ProductDetail {
    id: string;
    sku: string;
    priceUsd: number;
    stockQty: number;
    name: string;
    shortDesc: string | null;
    detailDesc: string | null;
    seoKeywords: string | null;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
}

export default function ProductDetailPage() {
    const params = useParams();
    const { language } = useAppStore();
    const t = pdpTranslations[language] || pdpTranslations.en;

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'reviews'>('desc');
    const [qty, setQty] = useState(1);
    const [cartAdded, setCartAdded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function loadProduct() {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/products?lang=${language}`);
                if (res.ok) {
                    const products = await res.json();
                    const found = products.find((p: any) => p.id === String(params.id));
                    if (found) setProduct(found);
                }
            } catch (err) {
                console.error('Error loading product:', err);
            } finally {
                setIsLoading(false);
            }
        }
        if (mounted) loadProduct();
    }, [params.id, language, mounted]);

    // Scroll reveal for content sections
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const items = el.querySelectorAll('.scroll-reveal');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );
        items.forEach((item) => observer.observe(item));
        return () => observer.disconnect();
    }, [product]);

    const addItem = useCartStore((s) => s.addItem);

    const handleAddToCart = () => {
        if (!product) return;
        const productImage = product.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800';
        addItem({
            productId: product.id,
            name: product.name,
            priceUsd: product.priceUsd,
            imageUrl: productImage,
        }, qty);
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
    };

    const formatUsd = (price: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    if (!mounted) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/20 border-t-brand-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
                <p className="text-xl">Product not found</p>
                <a href="/" className="text-brand-primary hover:underline">{t.back}</a>
            </div>
        );
    }

    const productImage = product.imageUrl || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800";

    return (
        <>
            {/* JSON-LD Product Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        "name": product.name,
                        "description": product.shortDesc || product.detailDesc || '',
                        "image": productImage,
                        "sku": product.sku,
                        "brand": {
                            "@type": "Brand",
                            "name": "KKshop"
                        },
                        "offers": {
                            "@type": "Offer",
                            "url": typeof window !== 'undefined' ? window.location.href : '',
                            "priceCurrency": "USD",
                            "price": product.priceUsd,
                            "availability": product.stockQty > 0
                                ? "https://schema.org/InStock"
                                : "https://schema.org/OutOfStock",
                            "seller": {
                                "@type": "Organization",
                                "name": "KKshop.cc"
                            }
                        },
                        ...(product.rating ? {
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": product.rating,
                                "reviewCount": product.reviewCount || 0
                            }
                        } : {})
                    })
                }}
            />

            <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={contentRef}>
                {/* Back link */}
                <a href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8 text-sm font-medium">
                    <ChevronLeft className="w-4 h-4" />
                    {t.back}
                </a>

                {/* F-Pattern Layout: Image Left, Info Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

                    {/* LEFT: Product Image */}
                    <div className="scroll-reveal">
                        <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-gray-50 group border border-gray-100 shadow-sm">
                            <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                loading="eager"
                            />
                            {product.stockQty <= 0 && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                    <span className="bg-gray-900 text-white font-bold py-2 px-6 rounded-full text-lg">{t.outOfStock}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Product Info (F-pattern: top-heavy reading) */}
                    <div className="flex flex-col gap-6 scroll-reveal" style={{ transitionDelay: '150ms' }}>

                        {/* Trust Badges — top of info for credibility */}
                        <TrustBadges variant="compact" />

                        {/* Sample Notice Badge */}
                        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm">
                            ⚠️ {t.sampleNotice}
                        </div>

                        {/* Product Name */}
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        {product.rating && (
                            <div className="flex items-center gap-2">
                                <div className="flex text-vivid-yellow">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-5 h-5 ${i < Math.round(product.rating!) ? 'fill-current' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-gray-700 font-bold">{product.rating.toFixed(1)}</span>
                                <span className="text-gray-400 text-sm">({product.reviewCount})</span>
                            </div>
                        )}

                        {/* Short Description */}
                        {product.shortDesc && (
                            <p className="text-gray-500 text-lg leading-relaxed">{product.shortDesc}</p>
                        )}

                        {/* Price */}
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-brand-secondary">{formatUsd(product.priceUsd)}</span>
                            <span className="text-gray-400 text-sm pb-1">USD</span>
                        </div>

                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${product.stockQty > 0 ? 'bg-vivid-green' : 'bg-vivid-coral'}`} />
                            <span className={`text-sm font-semibold ${product.stockQty > 0 ? 'text-vivid-green' : 'text-vivid-coral'}`}>
                                {product.stockQty > 0 ? t.inStock : t.outOfStock}
                            </span>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-gray-500">{t.qty}</span>
                            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="px-3 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                                >
                                    <Minus className="w-4 h-4 text-gray-700" />
                                </button>
                                <span className="px-4 py-2 text-gray-900 font-bold min-w-[3rem] text-center bg-white">{qty}</span>
                                <button
                                    onClick={() => setQty(qty + 1)}
                                    className="px-3 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                                >
                                    <Plus className="w-4 h-4 text-gray-700" />
                                </button>
                            </div>
                        </div>

                        {/* CTA Buttons — Coupang Style */}
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stockQty <= 0}
                                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 btn-micro ${cartAdded
                                    ? 'bg-vivid-green text-white border-none'
                                    : product.stockQty > 0
                                        ? 'bg-white border text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border-none'
                                    }`}
                            >
                                {cartAdded ? (
                                    <>
                                        <Check className="w-6 h-6" />
                                        {t.added}
                                    </>
                                ) : (
                                    <>
                                        {t.addToCart}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    handleAddToCart();
                                    setTimeout(() => {
                                        window.location.href = '/checkout';
                                    }, 500);
                                }}
                                disabled={product.stockQty <= 0}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${product.stockQty > 0
                                    ? 'bg-brand-primary border text-white hover:bg-brand-primary/90'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed hidden'
                                    }`}
                            >
                                {t.buyNow}
                            </button>
                        </div>

                        {/* Free shipping note */}
                        <p className="text-xs text-white/40 text-center sm:text-left">{t.freeShipping}</p>
                    </div>
                </div>

                {/* Tabs Section — scroll into view for detailed content */}
                <div className="mt-16 scroll-reveal" style={{ transitionDelay: '300ms' }}>
                    {/* Tab Header */}
                    <nav className="flex border-b border-gray-200 mb-8">
                        {(['desc', 'ingredients', 'reviews'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-6 text-sm font-bold transition-all border-b-2 ${activeTab === tab
                                    ? 'border-brand-primary text-gray-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                {t.tabs[tab]}
                            </button>
                        ))}
                    </nav>

                    {/* Tab Content */}
                    <div className="min-h-[200px] animate-fade-in text-gray-700">
                        {activeTab === 'desc' && (
                            <div className="prose max-w-none">
                                {/* Sample Description Warning Block */}
                                <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl mb-8">
                                    <h3 className="text-red-600 font-extrabold flex items-center gap-2 mt-0 mb-2">
                                        🚨 {t.sampleNotice}
                                    </h3>
                                    <p className="text-gray-700 font-bold m-0 leading-relaxed">
                                        {t.sampleDesc}
                                    </p>
                                </div>

                                {product.detailDesc ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.detailDesc }} />
                                ) : (
                                    <p className="text-gray-500">{product.shortDesc || 'No description available.'}</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'ingredients' && (
                            <p className="text-gray-500">Coming soon — product ingredient details will appear here.</p>
                        )}
                        {activeTab === 'reviews' && (
                            <p className="text-gray-500">Coming soon — customer reviews will appear here.</p>
                        )}
                    </div>
                </div>
            </article>

            {/* Sticky Bottom CTA — Mobile only */}
            <div className="fixed bottom-16 md:bottom-0 inset-x-0 z-30 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handleAddToCart}
                    disabled={product.stockQty <= 0}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold border transition-all active:scale-95 ${cartAdded
                        ? 'bg-vivid-green text-white border-none'
                        : product.stockQty > 0
                            ? 'bg-white text-brand-primary border-brand-primary'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-none'
                        }`}
                >
                    {cartAdded ? (
                        <>{t.added}</>
                    ) : (
                        <>{t.addToCart}</>
                    )}
                </button>
                <button
                    onClick={() => {
                        handleAddToCart();
                        setTimeout(() => {
                            window.location.href = '/checkout';
                        }, 500);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary/90 transition-all active:scale-95 border border-brand-primary"
                >
                    {t.buyNow}
                </button>
            </div>

            <Footer />
        </>
    );
}
