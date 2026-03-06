'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Star, ShoppingCart, Heart, ChevronLeft, Check, Minus, Plus, Loader2 } from 'lucide-react';
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
        specs: {
            title: '상품 필수 정보',
            volume: '용량/중량',
            skinType: '피부타입',
            origin: '제조국',
            expiry: '사용기한',
            certifications: '인증/특징',
        },
        supplier: {
            title: '판매자 정보',
            brand: '브랜드',
            company: '상호명',
        }
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
        specs: {
            title: 'Product Specifications',
            volume: 'Volume/Weight',
            skinType: 'Skin Type',
            origin: 'Origin',
            expiry: 'Expiry',
            certifications: 'Certifications',
        },
        supplier: {
            title: 'Seller Information',
            brand: 'Brand',
            company: 'Company',
        }
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
        specs: {
            title: 'បញ្ជាក់អំពីផលិតផល',
            volume: 'ទំហំ/ទម្ងន់',
            skinType: 'ប្រភេទស្បែក',
            origin: 'ប្រទេសដើម',
            expiry: 'ការបរិច្ឆេទផុតកំណត់',
            certifications: 'វិញ្ញាបនប័ត្រ',
        },
        supplier: {
            title: 'ព័ត៌មានអ្នកលក់',
            brand: 'ម៉ាក',
            company: 'ក្រុមហ៊ុន',
        }
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
        specs: {
            title: '产品规格',
            volume: '容量/重量',
            skinType: '适用肤质',
            origin: '产地',
            expiry: '保质期',
            certifications: '认证/特点',
        },
        supplier: {
            title: '卖家信息',
            brand: '品牌',
            company: '公司名称',
        }
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
    options?: any[];
    isHotSale?: boolean;
    hotSalePrice?: number | null;
    volume?: string | null;
    skinType?: string | null;
    origin?: string | null;
    expiryMonths?: number | null;
    certifications?: string | null;
    brandName?: string | null;
    supplier?: { companyName: string } | null;
}

export default function ProductDetailPage() {
    const params = useParams();
    const { language } = useAppStore();
    const t = pdpTranslations[language] || pdpTranslations.en;

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'reviews'>('desc');
    const [qty, setQty] = useState(1);
    const [selectedOptionId, setSelectedOptionId] = useState<string>('');
    const [cartAdded, setCartAdded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Reviews state
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', imageUrl: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });
    const [uploadingImage, setUploadingImage] = useState(false);

    // Update selectedOption automatically based on qty if options exist
    useEffect(() => {
        if (!product || !product.options || product.options.length === 0) return;

        let bestOption = product.options[0];
        for (const opt of product.options) {
            if (qty >= opt.minQty && (!opt.maxQty || qty <= opt.maxQty)) {
                bestOption = opt;
            }
        }
        if (bestOption && bestOption.id !== selectedOptionId) {
            setSelectedOptionId(bestOption.id);
        }
    }, [qty, product]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function loadProduct() {
            setIsLoading(true);
            try {
                // Use the dedicated single-product endpoint for reliability
                const res = await fetch(`/api/products/${params.id}?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!data.error) setProduct(data);
                }
            } catch (err) {
                console.error('Error loading product:', err);
            } finally {
                setIsLoading(false);
            }
        }
        if (mounted) loadProduct();
    }, [params.id, language, mounted]);

    // Fetch reviews when tab is active
    useEffect(() => {
        if (activeTab === 'reviews' && product && mounted) {
            const loadReviews = async () => {
                setReviewsLoading(true);
                try {
                    const res = await fetch(`/api/products/${product.id}/reviews?lang=${language}`);
                    if (res.ok) {
                        const data = await res.json();
                        setReviews(Array.isArray(data) ? data : []);
                    }
                } catch (e) {
                    console.error('Failed to load reviews', e);
                } finally {
                    setReviewsLoading(false);
                }
            };
            loadReviews();
        }
    }, [activeTab, product?.id, language, mounted]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setReviewForm(prev => ({ ...prev, imageUrl: data.url }));
            } else {
                alert('이미지 업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploadingImage(false);
            if (e.target) e.target.value = '';
        }
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        setIsSubmittingReview(true);
        setReviewMessage({ type: '', text: '' });

        try {
            const res = await fetch(`/api/products/${product.id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: reviewForm.rating,
                    content: reviewForm.content,
                    imageUrl: reviewForm.imageUrl
                })
            });

            const data = await res.json();

            if (res.ok) {
                setReviewMessage({ type: 'success', text: language === 'ko' ? '리뷰가 등록되었습니다. 관리자 승인 후 노출됩니다.' : 'Review submitted. It will appear after admin approval.' });
                setReviewForm({ rating: 5, content: '', imageUrl: '' });
            } else if (res.status === 401) {
                setReviewMessage({ type: 'error', text: language === 'ko' ? '로그인 후 작성 가능합니다.' : 'Please log in to write a review.' });
            } else {
                setReviewMessage({ type: 'error', text: data.error || '오류가 발생했습니다.' });
            }
        } catch (error) {
            console.error('Review submit error:', error);
            setReviewMessage({ type: 'error', text: '오류가 발생했습니다.' });
        } finally {
            setIsSubmittingReview(false);
        }
    };

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

        // Calculate applied price based on selected option
        let appliedPrice = product.priceUsd;
        if (product.options && product.options.length > 0) {
            const opt = product.options.find((o: any) => o.id === selectedOptionId);
            if (opt && opt.discountPct > 0) {
                appliedPrice = product.priceUsd * (1 - opt.discountPct / 100);
            }
        } else if (product.isHotSale && product.hotSalePrice) {
            appliedPrice = product.hotSalePrice;
        }

        addItem({
            productId: product.id,
            name: product.name,
            priceUsd: appliedPrice,
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
                    <div>
                        <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-gray-50 group border border-gray-100 shadow-sm">
                            <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                loading="eager"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800';
                                }}
                            />
                            {product.stockQty <= 0 && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                    <span className="bg-gray-900 text-white font-bold py-2 px-6 rounded-full text-lg">{t.outOfStock}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Product Info (F-pattern: top-heavy reading) */}
                    <div className="flex flex-col gap-6">

                        {/* Trust Badges — top of info for credibility */}
                        <TrustBadges variant="compact" />

                        {/* Product Name & Brand */}
                        <div>
                            {(product as any).brandName && (
                                <p className="text-sm font-bold text-gray-500 mb-1">{(product as any).brandName}</p>
                            )}
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight">
                                {product.name}
                            </h1>
                            {product.isHotSale && (
                                <span className="inline-block mt-3 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                                    🔥 HOT SALE
                                </span>
                            )}
                        </div>

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
                            {product.isHotSale && product.hotSalePrice ? (
                                <>
                                    <span className="text-4xl font-black text-red-500">{formatUsd(product.hotSalePrice)}</span>
                                    <span className="text-xl font-bold text-gray-400 line-through pb-1">{formatUsd(product.priceUsd)}</span>
                                </>
                            ) : (
                                <span className="text-4xl font-black text-brand-secondary">{formatUsd(product.priceUsd)}</span>
                            )}
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

                        {/* Product Options */}
                        {(product as any).options && (product as any).options.length > 0 && (
                            <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <span className="block text-sm font-bold text-gray-700 mb-2">🎈 수량별 할인 혜택</span>
                                <div className="space-y-2">
                                    {(product as any).options.map((opt: any) => (
                                        <label key={opt.id} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedOptionId === opt.id ? 'border-brand-primary bg-blue-50/50' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="product_option" value={opt.id} checked={selectedOptionId === opt.id} onChange={() => {
                                                    setSelectedOptionId(opt.id);
                                                    if (qty < opt.minQty) setQty(opt.minQty);
                                                }} className="w-4 h-4 text-brand-primary focus:ring-brand-primary" />
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">
                                                        {opt.label || `${opt.minQty}개 단위 구매`}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        최소 {opt.minQty}개 {opt.maxQty ? `~ 최대 ${opt.maxQty}개` : '이상'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {opt.discountPct > 0 && (
                                                    <span className="block text-red-500 font-bold text-sm">{opt.discountPct}% 할인</span>
                                                )}
                                                {opt.freeShipping && (
                                                    <span className="block text-brand-primary font-semibold text-xs mt-0.5">무료배송</span>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

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

                    {/* Specifications & Supplier Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {/* Specifications Table */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                                {t.specs.title}
                            </h3>
                            <dl className="space-y-3 text-sm">
                                {(product as any).volume && (
                                    <div className="flex border-b border-gray-200 pb-2 border-dashed">
                                        <dt className="w-1/3 text-gray-500 font-medium">{t.specs.volume}</dt>
                                        <dd className="w-2/3 text-gray-900">{(product as any).volume}</dd>
                                    </div>
                                )}
                                {(product as any).skinType && (
                                    <div className="flex border-b border-gray-200 pb-2 border-dashed">
                                        <dt className="w-1/3 text-gray-500 font-medium">{t.specs.skinType}</dt>
                                        <dd className="w-2/3 text-gray-900">{(product as any).skinType}</dd>
                                    </div>
                                )}
                                {(product as any).origin && (
                                    <div className="flex border-b border-gray-200 pb-2 border-dashed">
                                        <dt className="w-1/3 text-gray-500 font-medium">{t.specs.origin}</dt>
                                        <dd className="w-2/3 text-gray-900">{(product as any).origin}</dd>
                                    </div>
                                )}
                                {(product as any).expiryMonths && (
                                    <div className="flex border-b border-gray-200 pb-2 border-dashed">
                                        <dt className="w-1/3 text-gray-500 font-medium">{t.specs.expiry}</dt>
                                        <dd className="w-2/3 text-gray-900">{(product as any).expiryMonths} months</dd>
                                    </div>
                                )}
                                {(product as any).certifications && (
                                    <div className="flex">
                                        <dt className="w-1/3 text-gray-500 font-medium">{t.specs.certifications}</dt>
                                        <dd className="w-2/3 text-gray-900">{(product as any).certifications}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Supplier Info */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>
                                {t.supplier.title}
                            </h3>
                            <dl className="space-y-4 text-sm">
                                {(product as any).brandName && (
                                    <div className="flex items-center gap-4">
                                        <dt className="w-20 text-gray-500 font-medium bg-gray-50 py-1.5 px-3 rounded-md text-center">{t.supplier.brand}</dt>
                                        <dd className="flex-1 text-gray-900 font-bold text-lg">{(product as any).brandName}</dd>
                                    </div>
                                )}
                                {(product as any).supplier && (product as any).supplier.companyName && (
                                    <div className="flex items-center gap-4">
                                        <dt className="w-20 text-gray-500 font-medium bg-gray-50 py-1.5 px-3 rounded-md text-center">{t.supplier.company}</dt>
                                        <dd className="flex-1 text-gray-900">{(product as any).supplier.companyName}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

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
                                {product.detailDesc ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.detailDesc }} />
                                ) : (
                                    <p className="text-gray-500">{product.shortDesc || 'No description available.'}</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'ingredients' && (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                {product.ingredients ? (
                                    <p className="leading-relaxed whitespace-pre-wrap text-gray-700">{product.ingredients}</p>
                                ) : (
                                    <p className="text-gray-500 italic">{language === 'ko' ? '등록된 성분 정보가 없습니다.' : 'No ingredient information provided.'}</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'reviews' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Review Form */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4">{language === 'ko' ? '리뷰 작성하기' : 'Write a Review'}</h4>
                                    <form onSubmit={submitReview} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">{language === 'ko' ? '별점' : 'Rating'}</span>
                                            <div className="flex -ml-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={`star-${star}`}
                                                        type="button"
                                                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                        className="p-1 focus:outline-none"
                                                    >
                                                        <Star className={`w-6 h-6 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <textarea
                                                required
                                                value={reviewForm.content}
                                                onChange={e => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                                                placeholder={language === 'ko' ? '이 상품에 대한 솔직한 리뷰를 남겨주세요...' : 'Leave a review for this product...'}
                                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none resize-y min-h-[100px]"
                                            ></textarea>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer">
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                    {language === 'ko' ? '사진 첨부' : 'Add Photo'}
                                                </div>
                                            </label>
                                            {reviewForm.imageUrl && (
                                                <div className="relative">
                                                    <img src={reviewForm.imageUrl} alt="Preview" className="w-10 h-10 object-cover rounded-md border border-gray-200" />
                                                    <button type="button" onClick={() => setReviewForm(prev => ({ ...prev, imageUrl: '' }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                                                        <Plus className="w-3 h-3 rotate-45" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div>
                                                {reviewMessage.text && (
                                                    <span className={`text-sm ${reviewMessage.type === 'error' ? 'text-red-500' : 'text-brand-primary font-medium'}`}>
                                                        {reviewMessage.text}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmittingReview || !reviewForm.content.trim()}
                                                className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isSubmittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {language === 'ko' ? '등록하기' : 'Submit'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Review List */}
                                <div className="space-y-6">
                                    <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-3">
                                        {language === 'ko' ? `고객 리뷰 (${reviews.length})` : `Customer Reviews (${reviews.length})`}
                                    </h4>

                                    {reviewsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                                        </div>
                                    ) : reviews.length === 0 ? (
                                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100/50">
                                            <p className="text-gray-500 text-sm">{language === 'ko' ? '아직 등록된 리뷰가 없습니다. 첫 리뷰를 작성해보세요!' : 'No reviews yet. Be the first to review!'}</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {reviews.map((r, i) => (
                                                <div key={i} className="py-5 first:pt-2 last:pb-2">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                            {r.userImage ? <img src={r.userImage} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500 font-bold">{r.userName?.charAt(0) || 'U'}</span>}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-900">{r.userName}</span>
                                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                                <div className="flex">
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <Star key={star} className={`w-3 h-3 ${star <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                                    ))}
                                                                </div>
                                                                <span>•</span>
                                                                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed mb-3 mt-3">{r.content}</p>
                                                    {r.imageUrl && (
                                                        <img src={r.imageUrl} alt="Review attachment" className="rounded-lg object-cover max-h-32 border border-gray-100" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
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
