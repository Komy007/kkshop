'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Clock, ShoppingCart, ArrowLeft, Package } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useCartStore } from '@/store/useCartStore';

type LangKey = 'ko' | 'en' | 'km' | 'zh';

const flashT: Record<LangKey, Record<string, string>> = {
    ko: {
        back: '홈으로',
        title: '⚡ 타임세일',
        subtitle: '한정 시간 특가 — 놓치지 마세요!',
        endsIn: '종료까지:',
        ended: '종료됨',
        items: '개 상품 타임세일 진행 중',
        addCart: '장바구니 담기',
        added: '담겼어요! ✓',
        noSale: '진행 중인 타임세일이 없습니다',
        noSaleDesc: '곧 새로운 타임세일이 시작됩니다. 자주 확인해 주세요!',
        browse: '전체 상품 보기',
    },
    en: {
        back: 'Back to Home',
        title: '⚡ Flash Sale',
        subtitle: 'Limited time offers — don\'t miss out!',
        endsIn: 'Sale ends in:',
        ended: 'Ended',
        items: 'items on flash sale',
        addCart: 'Add to Cart',
        added: 'Added! ✓',
        noSale: 'No Active Flash Sales',
        noSaleDesc: 'Check back soon! New flash sales are added regularly.',
        browse: 'Browse All Products',
    },
    km: {
        back: 'ត្រឡប់ទៅទំព័រដើម',
        title: '⚡ ការលក់ Flash',
        subtitle: 'ការផ្តល់ជូនមានកំណត់ — កុំឱ្យខកខាន!',
        endsIn: 'បញ្ចប់ក្នុង:',
        ended: 'បានបញ្ចប់',
        items: 'ផលិតផលកំពុងលក់',
        addCart: 'បន្ថែមទៅរទេះ',
        added: 'បានបន្ថែម! ✓',
        noSale: 'គ្មានការលក់ Flash សកម្ម',
        noSaleDesc: 'សូមពិនិត្យមើលឡើងវិញ! ការលក់ Flash ថ្មីត្រូវបានបន្ថែមជាទៀងទាត់។',
        browse: 'រកមើលផលិតផលទាំងអស់',
    },
    zh: {
        back: '返回首页',
        title: '⚡ 限时闪购',
        subtitle: '限时优惠 — 不容错过！',
        endsIn: '距离结束:',
        ended: '已结束',
        items: '件商品正在限时闪购',
        addCart: '加入购物车',
        added: '已添加! ✓',
        noSale: '暂无限时闪购',
        noSaleDesc: '请稍后再来！新的限时闪购会定期更新。',
        browse: '浏览所有商品',
    },
};

interface FlashSaleItem {
    id: string;
    name: string;
    imageUrl: string | null;
    priceUsd: number;
    salePriceUsd: number;
    discountPct: number;
    endAt: string;
    maxQtyPerUser: number | null;
    labelEn: string | null;
    stockQty: number;
}

function useCountdown(endAt: string) {
    const calcRemaining = useCallback(() => {
        const diff = new Date(endAt).getTime() - Date.now();
        if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1_000);
        return { h, m, s, expired: false };
    }, [endAt]);

    const [time, setTime] = useState(calcRemaining());

    useEffect(() => {
        setTime(calcRemaining());
        const timer = setInterval(() => setTime(calcRemaining()), 1_000);
        return () => clearInterval(timer);
    }, [calcRemaining]);

    return time;
}

function CountdownBadge({ endAt }: { endAt: string }) {
    const { h, m, s, expired } = useCountdown(endAt);
    if (expired) return <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Ended</span>;
    return (
        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 font-mono font-bold px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </span>
    );
}

function FlashSaleCard({ item, onAddToCart, t }: { item: FlashSaleItem; onAddToCart: (item: FlashSaleItem) => void; t: Record<string, string> }) {
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        onAddToCart(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
            <Link href={`/products/${item.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-300" />
                    </div>
                )}
                {/* 할인율 배지 */}
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg">
                    -{item.discountPct}%
                </div>
            </Link>

            <div className="p-3">
                {/* 타이머 */}
                <div className="mb-1.5">
                    <CountdownBadge endAt={item.endAt} />
                </div>

                {/* 상품명 */}
                <Link href={`/products/${item.id}`}>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2 hover:text-pink-600 transition-colors">
                        {item.name}
                    </p>
                </Link>

                {/* 가격 */}
                <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-lg font-black text-red-500">${item.salePriceUsd.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 line-through">${item.priceUsd.toFixed(2)}</span>
                </div>

                {/* 카트 추가 */}
                <button
                    onClick={handleAdd}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
                        added
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 active:scale-95'
                    }`}
                >
                    <ShoppingCart className="w-4 h-4" />
                    {added ? t.added : t.addCart}
                </button>
            </div>
        </div>
    );
}

export default function FlashSalePage() {
    const [items, setItems] = useState<FlashSaleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { language } = useAppStore();
    const { addItem } = useCartStore();
    const lang = (language as LangKey) in flashT ? (language as LangKey) : 'en';
    const t = flashT[lang];

    useEffect(() => {
        fetch(`/api/products/flash-sale?lang=${language}`)
            .then(r => r.json())
            .then((data: FlashSaleItem[]) => {
                setItems(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [language]);

    const handleAddToCart = (item: FlashSaleItem) => {
        addItem({
            productId: item.id,
            name:      item.name,
            priceUsd:  item.salePriceUsd,
            imageUrl:  item.imageUrl ?? '',
            qty:       1,
        });
    };

    // 가장 빨리 끝나는 세일 기준 전체 카운트다운
    const soonestEnd = items.length > 0
        ? items.reduce((earliest, cur) =>
            new Date(cur.endAt) < new Date(earliest.endAt) ? cur : earliest
          ).endAt
        : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white">
                <div className="max-w-screen-xl mx-auto px-4 py-6">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        {t.back}
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl">
                            <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
                            <p className="text-white/80 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    {soonestEnd && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                            <Clock className="w-4 h-4 text-yellow-300" />
                            <span className="text-sm font-semibold">{t.endsIn}</span>
                            <CountdownBadge endAt={soonestEnd} />
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 py-6">
                {loading ? (
                    // 스켈레톤
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-square bg-gray-200" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="h-4 bg-gray-200 rounded" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                    <div className="h-8 bg-gray-200 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    // 빈 상태
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="text-6xl mb-4">⚡</div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">{t.noSale}</h2>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            {t.noSaleDesc}
                        </p>
                        <Link
                            href="/"
                            className="px-6 py-2.5 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors"
                        >
                            {t.browse}
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-4">
                            <span className="font-bold text-gray-800">{items.length}</span> {t.items}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {items.map(item => (
                                <FlashSaleCard key={item.id} item={item} onAddToCart={handleAddToCart} t={t} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
