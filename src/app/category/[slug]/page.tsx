'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import { useAppStore, useSafeAppStore } from '@/store/useAppStore';
import { type TranslatedProduct } from '@/lib/api';

const categoryTitles: Record<string, Record<string, string>> = {
    ko: { all: '전체 상품', skincare: '스킨케어', makeup: '메이크업', 'hair-body': '헤어/바디', living: '생활용품', health: '건강식품', new: '신상품', best: '베스트 상품', sale: '할인 상품' },
    en: { all: 'All Products', skincare: 'Skincare', makeup: 'Makeup', 'hair-body': 'Hair/Body', living: 'Living', health: 'Health', new: 'New Arrivals', best: 'Bestseller', sale: 'Sale' },
    km: { all: 'ផលិតផលទាំងអស់', skincare: 'ថែស្បែក', makeup: 'គ្រឿងសំអាង', 'hair-body': 'សក់/រាងកាយ', living: 'គ្រឿងប្រើប្រាស់', health: 'សុខភាព', new: 'ផលិតផលថ្មី', best: 'ពេញនិយម', sale: 'បញ្ចុះតម្លៃ' },
    zh: { all: '全部商品', skincare: '护肤', makeup: '彩妆', 'hair-body': '洗护', living: '生活用品', health: '保健品', new: '新品', best: '热销', sale: '折扣' }
};

const commonUi: Record<string, Record<string, string>> = {
    ko: { empty: '해당 카테고리에 상품이 없습니다.' },
    en: { empty: 'No products in this category.' },
    km: { empty: 'គ្មានផលិតផលក្នុងប្រភេទនេះទេ។' },
    zh: { empty: '该类别下没有商品。' }
};

export default function CategoryDetailPage() {
    const params = useParams();
    // Use type assertion carefully; Next.js params can be string or string[]
    const slug = (params?.slug as string) || '';

    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };

    // Find matching title based on current language or fallback to uppercase slug
    const currentTitle = categoryTitles[language]?.[slug] || slug.toUpperCase();
    const uiText = commonUi[language]?.empty || commonUi['en']?.empty || 'No products found.';

    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        setIsLoading(true);
        async function fetchCategoryProducts() {
            try {
                const res = await fetch(`/api/products?lang=${language}&category=${slug}&limit=100`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(Array.isArray(data) ? data : (data.products ?? []));
                }
            } catch (error) {
                console.error('Failed to load category products', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCategoryProducts();
    }, [slug, language]);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 pb-24">
            {/* Header Area */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-center relative shadow-sm">
                <Link href="/" className="absolute left-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-900" />
                </Link>
                <h1 className="text-lg font-extrabold text-gray-900">
                    {currentTitle}
                </h1>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 pt-6">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-24 px-4">
                        <div className="text-6xl mb-4 opacity-30 grayscale">📦</div>
                        <p className="text-gray-500 font-medium">{uiText}</p>
                        <Link href="/" className="inline-block mt-6 px-8 py-3 bg-white border border-gray-300 rounded-full text-gray-700 font-bold text-sm hover:bg-gray-50 hover:text-brand-primary transition-all shadow-sm">
                            {language === 'ko' ? '쇼핑 홈으로 가기' : 'Back to Home'}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {products.map((product) => (
                            <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all border border-gray-200">
                                {/* Image Container */}
                                <div className="aspect-[4/5] relative w-full bg-gray-100 overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">✨</div>
                                    )}

                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                                        {slug === 'new' && (
                                            <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">NEW</span>
                                        )}
                                        <span className="bg-[#E52528] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">특가</span>
                                    </div>
                                </div>

                                {/* Content Container */}
                                <div className="p-4 flex flex-col flex-1">
                                    <p className="text-sm text-gray-800 leading-snug line-clamp-2 min-h-[40px] font-medium mb-3 group-hover:text-brand-primary transition-colors">
                                        {product.name}
                                    </p>

                                    <div className="mt-auto">
                                        {/* Price */}
                                        <div className="flex flex-col">
                                            {product.isHotSale && product.hotSalePrice && product.hotSalePrice < product.priceUsd ? (
                                                <>
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-xs text-gray-400 line-through">
                                                            $ {product.priceUsd.toFixed(2)}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1 rounded">
                                                            -{Math.round((1 - product.hotSalePrice / product.priceUsd) * 100)}%
                                                        </span>
                                                    </div>
                                                    <span className="text-lg font-extrabold text-[#E52528] leading-none">
                                                        $ {(product.hotSalePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-lg font-extrabold text-[#E52528] leading-none">
                                                    $ {product.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>
                                        {/* Rating */}
                                        {product.reviewCount > 0 && (
                                            <div className="flex items-center gap-1 mt-3">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                <span className="text-xs font-bold text-gray-700">{product.reviewAvg.toFixed(1)}</span>
                                                <span className="text-xs text-gray-400">({product.reviewCount})</span>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
