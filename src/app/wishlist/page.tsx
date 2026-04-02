'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';
import { useCartStore } from '@/store/useCartStore';
import Footer from '@/components/Footer';

const t: Record<string, any> = {
    en: {
        title: 'My Wishlist',
        empty: 'Your wishlist is empty',
        emptyDesc: 'Browse products and tap the heart icon to save favorites here.',
        browse: 'Browse Products',
        remove: 'Remove',
        addToCart: 'Add to Cart',
        added: 'Added!',
        soldOut: 'Sold Out',
        back: 'Back',
        items: 'items',
    },
    ko: {
        title: '찜 목록',
        empty: '찜한 상품이 없습니다',
        emptyDesc: '상품을 둘러보고 하트 아이콘을 눌러 찜 목록에 추가하세요.',
        browse: '상품 둘러보기',
        remove: '삭제',
        addToCart: '장바구니',
        added: '추가됨!',
        soldOut: '품절',
        back: '뒤로',
        items: '개',
    },
    km: {
        title: 'បញ្ជីចង់បាន',
        empty: 'បញ្ជីចង់បានរបស់អ្នកទទេ',
        emptyDesc: 'រកមើលផលិតផល ហើយចុចរូបបេះដូងដើម្បីរក្សាទុកទីនេះ។',
        browse: 'រកមើលផលិតផល',
        remove: 'លុបចេញ',
        addToCart: 'បន្ថែមទៅកន្រ្ត',
        added: 'បានបន្ថែម!',
        soldOut: 'អស់ពីស្តុក',
        back: 'ត្រឡប់ក្រោយ',
        items: 'ផលិតផល',
    },
    zh: {
        title: '收藏夹',
        empty: '收藏夹为空',
        emptyDesc: '浏览商品并点击心形图标收藏。',
        browse: '浏览商品',
        remove: '移除',
        addToCart: '加入购物车',
        added: '已加入！',
        soldOut: '售罄',
        back: '返回',
        items: '件商品',
    },
};

interface WishlistItem {
    wishlistId: string;
    productId: string;
    name: string;
    imageUrl: string | null;
    priceUsd: string;
    stockQty: number;
    isHotSale: boolean;
    hotSalePrice: string | null;
    addedAt: string;
}

export default function WishlistPage() {
    const store = useSafeAppStore();
    const lang = store?.language || 'en';
    const tx = t[lang] || t.en;
    const router = useRouter();
    const addToCart = useCartStore(s => s.addItem);

    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const fetchWishlist = useCallback(async () => {
        try {
            const res = await fetch('/api/user/wishlist');
            if (res.status === 401) { router.push('/login?callbackUrl=/wishlist'); return; }
            if (res.ok) setItems(await res.json());
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [router]);

    useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

    const handleRemove = async (productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
        await fetch('/api/user/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
        });
    };

    const handleAddToCart = (item: WishlistItem) => {
        const price = item.isHotSale && item.hotSalePrice ? Number(item.hotSalePrice) : Number(item.priceUsd);
        addToCart({
            productId: item.productId,
            name: item.name,
            priceUsd: price,
            imageUrl: item.imageUrl || '',
            qty: 1,
        });
        setAddedIds(prev => new Set(prev).add(item.productId));
        setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(item.productId); return s; }), 1500);
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
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                            {tx.title}
                        </h1>
                    </div>
                    {items.length > 0 && (
                        <span className="text-sm text-gray-500 font-medium">{items.length} {tx.items}</span>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
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
                            const isAdded = addedIds.has(item.productId);
                            const isSoldOut = item.stockQty <= 0;

                            return (
                                <div key={item.wishlistId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                                    <Link href={`/products/${item.productId}`} className="block relative aspect-square bg-gray-100 overflow-hidden">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Heart className="w-10 h-10" />
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
                                        <Link href={`/products/${item.productId}`}>
                                            <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight mb-2 hover:text-brand-primary transition-colors">{item.name}</p>
                                        </Link>
                                        <div className="flex items-baseline gap-1.5 mb-3">
                                            <span className="text-sm font-black text-gray-900">${price.toFixed(2)}</span>
                                            {originalPrice && (
                                                <span className="text-[11px] text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => !isSoldOut && handleAddToCart(item)}
                                                disabled={isSoldOut}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {isAdded ? tx.added : <><ShoppingCart className="w-3.5 h-3.5" /> {tx.addToCart}</>}
                                            </button>
                                            <button
                                                onClick={() => handleRemove(item.productId)}
                                                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                                title={tx.remove}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
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
