'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { type TranslatedProduct } from '@/lib/api';

const translations: Record<string, any> = {
    ko: { title: '모든 상품', empty: '등록된 상품이 없습니다.' },
    en: { title: 'All Products', empty: 'No products found.' },
    km: { title: 'ផលិតផលទាំងអស់', empty: 'រកមិនឃើញផលិតផលទេ។' },
    zh: { title: '所有商品', empty: '未找商品。' }
};

export default function CategoryIndexPage() {
    const { language } = useAppStore();
    const t = translations[language] || translations.en;

    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                // Fetch ALL products without specific category slug
                const res = await fetch(`/api/products?lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error('Failed to load products', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, [language]);

    return (
        <main className="min-h-screen bg-space-900 text-white pb-24">
            {/* Header Area */}
            <div className="sticky top-0 z-40 bg-space-900/80 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-4">
                <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold">{t.title}</h1>
            </div>

            {/* Product Grid */}
            <div className="px-4 pt-6">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-white/50">{t.empty}</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {products.map((product) => (
                            <Link key={product.id} href={`/products/${product.id}`} className="group block bg-space-800 rounded-2xl overflow-hidden hover:ring-2 hover:ring-brand-primary/50 transition-all">
                                <div className="aspect-square relative bg-white/5">
                                    {/* Placeholder Image for Samples */}
                                    <div className="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                                        🛍️
                                    </div>
                                    <div className="absolute top-2 left-2 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                                        Free Ship
                                    </div>
                                </div>

                                <div className="p-3">
                                    <p className="text-xs sm:text-sm text-white/90 leading-tight line-clamp-2 min-h-[32px] font-medium mb-2 group-hover:text-brand-primary transition-colors">
                                        {product.name}
                                    </p>

                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm sm:text-base font-extrabold text-white">
                                                $ {product.priceUsd.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            <span className="text-[10px] text-white/60">5.0</span>
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
