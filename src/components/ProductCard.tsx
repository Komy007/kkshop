'use client';

import React from 'react';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface ProductData {
    id: string;
    sku: string;
    priceUsd: number; // Encapsulated to USD
    stockQty: number;
    imageUrl: string;

    // Translation fields mapped based on language
    name: string;
    shortDesc?: string;

    // Metadata for badges
    rating?: number;
    reviewCount?: number;
    isBestSeller?: boolean;
}

const uiTranslations = {
    ko: { addCart: '장바구니 담기', bestBadge: '한국 누적 100만개' },
    en: { addCart: 'Add to Cart', bestBadge: '1M+ Sold in KR' },
    km: { addCart: 'បន្ថែមទៅរទេះ', bestBadge: 'លក់បានច្រើនបំផុត' }, // Proxy text
    zh: { addCart: '加入购物车', bestBadge: '韩国累计销量突破百万' }
};

interface ProductCardProps {
    product: ProductData;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { language } = useAppStore();

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const formatUsd = (price: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    };

    if (!mounted) return null;
    const t = uiTranslations[language];

    return (
        <div className="group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 relative h-full hover:-translate-y-1">

            {/* Badges */}
            <div className="absolute top-4 w-full px-4 flex justify-between items-start z-10 pointer-events-none">
                <div className="flex flex-col gap-2">
                    {product.isBestSeller && (
                        <span className="bg-white/90 backdrop-blur-md text-red-600 border border-gray-200 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm inline-flex items-center uppercase tracking-wider">
                            <Star className="w-3.5 h-3.5 mr-1.5 fill-red-600" />
                            {'HOT DEAL'}
                        </span>
                    )}
                </div>
            </div>

            {/* Product Image Region */}
            <div className="relative aspect-[4/5] w-full bg-gray-50 overflow-hidden cursor-pointer">
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                    loading="lazy"
                />
                {/* Out of stock overlay */}
                {product.stockQty <= 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-gray-900 text-white font-bold py-1.5 px-4 rounded-full text-sm tracking-widest uppercase shadow-md">
                            Sold Out
                        </span>
                    </div>
                )}
            </div>

            {/* Product Info Region */}
            <div className="p-6 flex flex-col flex-1 relative bg-white">

                {/* Add to Cart Overlay Button (Hovers up) */}
                <div className="absolute -top-6 right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20">
                    <button
                        disabled={product.stockQty <= 0}
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border border-gray-100 ${product.stockQty > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        aria-label={t.addCart}
                        title={t.addCart}
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                </div>

                {/* Rating */}
                {(product.rating && product.reviewCount) ? (
                    <div className="flex items-center space-x-1.5 mb-3">
                        <div className="flex text-amber-500">
                            <Star className="w-4 h-4 fill-current drop-shadow-sm" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{product.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({product.reviewCount})</span>
                    </div>
                ) : (
                    <div className="h-5 mb-3"></div>
                )}

                {/* Title */}
                <h3 className="font-extrabold text-gray-900 text-lg leading-[1.3] line-clamp-2 mb-2 cursor-pointer group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>

                {/* Subtitle */}
                {product.shortDesc && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 font-normal leading-relaxed">
                        {product.shortDesc}
                    </p>
                )}

                <div className="flex-1"></div>

                {/* Price */}
                <div className="flex items-end justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">USD Price</span>
                        <span className="font-extrabold text-2xl text-rose-600 tracking-tight">
                            {formatUsd(product.priceUsd)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
