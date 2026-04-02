'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ShoppingCart, Trash2, Loader2, ArrowLeft, Star } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';
import { useCartStore } from '@/store/useCartStore';
import Footer from '@/components/Footer';

const t: Record<string, any> = {
    en: {
        title: 'Recently Viewed',
        empty: 'No recently viewed products',
        emptyDesc: 'Products you view will appear here for easy access.',
        browse: 'Browse Products',
        addToCart: 'Add to Cart',
        added: 'Added!',
        soldOut: 'Sold Out',
        clear: 'Clear All',
        back: 'Back',
    },
    ko: {
        title: '최근 본 상품',
        empty: '최근 본 상품이 없습니다',
        emptyDesc: '조회한 상품이 여기에 표시됩니다.',
        browse: '상품 둘러보기',
        addToCart: '장바구니',
        added: '추가됨!',
        soldOut: '품절',
        clear: '전체 삭제',
        back: '뒤로',
    },
    km: {
        title: 'មើលថ្មីៗ',
        empty: 'មិនមានផលិតផលដែលបានមើលថ្មីៗ',
        emptyDesc: 'ផលិតផលដែលអ្នកមើលនឹងបង្ហាញនៅទីនេះ។',
        browse: 'រកមើលផលិតផល',
        addToCart: 'បន្ថែមទៅកន្រ្ត',
        added: 'បានបន្ថែម!',
        soldOut: 'អស់ពីស្តុក',
        clear: 'សម្អាតទាំងអស់',
        back: 'ត្រឡប់ក្រោយ',
    },
    zh: {
        title: '最近浏览',
        empty: '没有最近浏览的商品',
        emptyDesc: '您浏览过的商品将显示在这里。',
        browse: '浏览商品',
        addToCart: '加入购物车',
        added: '已加入！',
        soldOut: '售罄',
        clear: '清空全部',
        back: '返回',
    },
};

interface RecentProduct {
    id: string;
    name: string;
    imageUrl: string | null;
    priceUsd: string;
    stockQty: number;
    isHotSale: boolean;
    hotSalePrice: string | null;
    reviewAvg: string;
    reviewCount: number;
}

const STORAGE_KEY = 'kkshop_recently_viewed';

export default function RecentlyViewedPage() {
    const store = useSafeAppStore();
    const lang = store?.language || 'en';
    const tx = t[lang] || t.en;
    const router = useRouter();
    const addToCart = useCartStore(s => s.addItem);

    const [items, setItems] = useState<RecentProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const ids: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (ids.length === 0) { setLoading(false); return; }
        fetch(`/api/user/recently-viewed?ids=${ids.join(',')}`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setItems(data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleClear = () => {
        localStorage.removeItem(STORAGE_KEY);
        setItems([]);
    };

    const handleAddToCart = (item: RecentProduct) => {
        const price = item.isHotSale && item.hotSalePrice ? Number(item.hotSalePrice) : Number(item.priceUsd);
        addToCart({
            productId: item.id,
            name: item.name,
            priceUsd: price,
            imageUrl: item.imageUrl || '',
            qty: 1,
        });
        setAddedIds(prev => new Set(prev).add(item.id));
        setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(item.id); return s; }), 1500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-24 pt-4">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-blue-500" />
                            {tx.title}
                        </h1>
                    </div>
                    {items.length > 0 && (
                        <button onClick={handleClear} className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> {tx.clear}
                        </button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-lg font-bold text-gray-700 mb-2">{tx.empty}</p>
                        <p className="text-sm text-gray-400 mb-6">{tx.emptyDesc}</p>
                        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors">
                            {tx.browse}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {items.map(item => {
                            const price = item.isHotSale && item.hotSalePrice ? Number(item.hotSalePrice) : Number(item.priceUsd);
                            const originalPrice = item.isHotSale && item.hotSalePrice ? Number(item.priceUsd) : null;
                            const isAdded = addedIds.has(item.id);
                            const isSoldOut = item.stockQty <= 0;
                            const rating = Number(item.reviewAvg) || 0;

                            return (
                                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                                    <Link href={`/products/${item.id}`} className="block relative aspect-square bg-gray-100 overflow-hidden">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Clock className="w-10 h-10" />
                                            </div>
                                        )}
                                        {item.isHotSale && (
                                            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</span>
                                        )}
                                        {isSoldOut && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="bg-white text-gray-900 font-bold text-xs px-3 py-1 rounded-full">{tx.soldOut}</span>
                                            </div>
                                        )}
                                    </Link>
                                    <div className="p-3">
                                        <Link href={`/products/${item.id}`}>
                                            <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight mb-1.5 hover:text-brand-primary transition-colors">{item.name}</p>
                                        </Link>
                                        {rating > 0 && (
                                            <div className="flex items-center gap-1 mb-1.5">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                <span className="text-[10px] text-gray-500 font-medium">{rating.toFixed(1)} ({item.reviewCount})</span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-1.5 mb-3">
                                            <span className="text-sm font-black text-gray-900">${price.toFixed(2)}</span>
                                            {originalPrice && (
                                                <span className="text-[11px] text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => !isSoldOut && handleAddToCart(item)}
                                            disabled={isSoldOut}
                                            className="w-full flex items-center justify-center gap-1 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {isAdded ? tx.added : <><ShoppingCart className="w-3.5 h-3.5" /> {tx.addToCart}</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <Footer />
        </main>
    );
}
