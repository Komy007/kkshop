'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { type TranslatedProduct } from '@/lib/api';

const categoryTitles: Record<string, Record<string, string>> = {
    ko: { skincare: '스킨케어', makeup: '메이크업', 'hair-body': '헤어/바디', living: '생활용품', health: '건강식품', new: '신상품', best: '베스트 상품', sale: '할인 상품' },
    en: { skincare: 'Skincare', makeup: 'Makeup', 'hair-body': 'Hair/Body', living: 'Living', health: 'Health', new: 'New Arrivals', best: 'Bestseller', sale: 'Sale' },
    km: { skincare: 'ថែស្បែក', makeup: 'គ្រឿងសំអាង', 'hair-body': 'សក់/រាងកាយ', living: 'គ្រឿងប្រើប្រាស់', health: 'សុខភាព', new: 'ផលិតផលថ្មី', best: 'ពេញនិយម', sale: 'បញ្ចុះតម្លៃ' },
    zh: { skincare: '护肤', makeup: '彩妆', 'hair-body': '洗护', living: '生活用品', health: '保健品', new: '新品', best: '热销', sale: '折扣' }
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

    const { language } = useAppStore();

    // Find matching title based on current language or fallback to uppercase slug
    const currentTitle = categoryTitles[language]?.[slug] || slug.toUpperCase();
    const uiText = commonUi[language]?.empty || commonUi['en']?.empty || 'No products found.';

    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;

        async function fetchCategoryProducts() {
            try {
                // If the slug is 'hair-body', 'hairbody' is the prefix matching the backend SKU seed logic
                const apiSlug = slug.replace('-', '');

                // Fetch filtered products
                const res = await fetch(`/api/products?lang=${language}&category=${apiSlug}`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
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
        <main className="min-h-screen bg-space-950 text-white pb-24">
            {/* Header Area */}
            <div className="sticky top-0 z-40 bg-space-950/80 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-4">
                <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-brand-primary" />
                </Link>
                <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                    {currentTitle}
                </h1>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 pt-6">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-24 px-4">
                        <div className="text-6xl mb-4 opacity-50">📦</div>
                        <p className="text-white/60 font-medium">{uiText}</p>
                        <Link href="/" className="inline-block mt-6 px-6 py-2.5 bg-brand-primary rounded-full text-white font-bold text-sm hover:brightness-110 transition-all">
                            쇼핑 홈으로 가기
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {products.map((product) => (
                            <Link key={product.id} href={`/products/${product.id}`} className="group block bg-space-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-brand-primary/50 transition-all border border-white/5 shadow-xl">
                                <div className="aspect-square relative flex bg-gradient-to-br from-white/10 to-transparent items-center justify-center p-8">
                                    <div className="text-6xl group-hover:scale-125 transition-transform duration-500 will-change-transform">
                                        ✨
                                    </div>
                                    <div className="absolute top-2 left-2 flex gap-1 z-10">
                                        {slug === 'new' && (
                                            <span className="bg-brand-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full">NEW</span>
                                        )}
                                        <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">특가</span>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <p className="text-xs sm:text-sm text-white/90 leading-snug line-clamp-2 min-h-[36px] font-medium mb-3 group-hover:text-brand-primary transition-colors">
                                        {product.name}
                                    </p>

                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white/40 line-through mb-0.5">
                                                $ {(product.priceUsd * 1.5).toFixed(2)}
                                            </span>
                                            <span className="text-sm sm:text-lg font-black text-white leading-none">
                                                $ {product.priceUsd.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-0.5">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                <span className="text-[10px] text-white/50">4.9</span>
                                            </div>
                                        </div>
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
