'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartStore, selectTotalPrice, selectTotalItems } from '@/store/useCartStore';
import { useSafeAppStore } from '@/store/useAppStore';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ChevronLeft } from 'lucide-react';
import Footer from '@/components/Footer';

const cartT: Record<string, any> = {
    en: {
        title: 'Shopping Cart',
        empty: 'Your cart is empty.',
        emptyBtn: 'Start Shopping',
        qty: 'Qty',
        remove: 'Remove',
        subtotal: 'Subtotal',
        items: 'items',
        checkout: 'Proceed to Checkout',
        continueShopping: 'Continue Shopping',
        freeShippingNote: 'Free shipping on orders over $30',
        itemsCount: (n: number) => `${n} item${n !== 1 ? 's' : ''}`,
    },
    ko: {
        title: '장바구니',
        empty: '장바구니가 비어있습니다.',
        emptyBtn: '쇼핑 시작하기',
        qty: '수량',
        remove: '삭제',
        subtotal: '상품 합계',
        items: '개',
        checkout: '주문하기',
        continueShopping: '쇼핑 계속하기',
        freeShippingNote: '$30 이상 무료 배송',
        itemsCount: (n: number) => `${n}개`,
    },
    km: {
        title: 'រទេះទំនិញ',
        empty: 'រទេះទំនិញរបស់អ្នកទទេ។',
        emptyBtn: 'ចាប់ផ្តើមទិញ',
        qty: 'ចំនួន',
        remove: 'យកចេញ',
        subtotal: 'សរុបរង',
        items: 'ផ្undle',
        checkout: 'ដំណើរការទូទាត់',
        continueShopping: 'ទិញបន្ត',
        freeShippingNote: 'ដឹកជញ្ជូនឥតគិតថ្លៃ $30+',
        itemsCount: (n: number) => `${n} ចំណែក`,
    },
    zh: {
        title: '购物车',
        empty: '购物车是空的。',
        emptyBtn: '开始购物',
        qty: '数量',
        remove: '删除',
        subtotal: '商品小计',
        items: '件',
        checkout: '去结算',
        continueShopping: '继续购物',
        freeShippingNote: '$30以上免运费',
        itemsCount: (n: number) => `${n}件商品`,
    },
};

export default function CartPage() {
    const store = useSafeAppStore();
    const language = store?.language || 'en';
    const t = cartT[language] || cartT.en;

    const items = useCartStore(s => s.items);
    const subtotal = useCartStore(selectTotalPrice);
    const totalItems = useCartStore(selectTotalItems);
    const { removeItem, updateQty } = useCartStore();

    const [removingId, setRemovingId] = useState<string | null>(null);

    const handleRemove = (productId: string, variantId?: string) => {
        const key = variantId ? `${productId}-${variantId}` : productId;
        setRemovingId(key);
        setTimeout(() => {
            removeItem(productId, variantId);
            setRemovingId(null);
        }, 200);
    };

    const formatUsd = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    const freeShippingRemaining = Math.max(0, 30 - subtotal);
    const freeShippingProgress = Math.min(100, (subtotal / 30) * 100);

    return (
        <>
            <main className="min-h-screen bg-gray-50 pb-24 pt-4">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <Link href="/" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-brand-primary" />
                            {t.title}
                            {totalItems > 0 && (
                                <span className="text-sm font-bold text-gray-400">({t.itemsCount(totalItems)})</span>
                            )}
                        </h1>
                    </div>

                    {items.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
                            <p className="text-lg font-bold text-gray-400 mb-6">{t.empty}</p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-full font-bold hover:bg-brand-primary/90 transition-all"
                            >
                                {t.emptyBtn} <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* Free Shipping Progress Bar */}
                            {freeShippingRemaining > 0 ? (
                                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-gray-600">{t.freeShippingNote}</span>
                                        <span className="text-xs font-extrabold text-brand-primary">
                                            {formatUsd(freeShippingRemaining)} more
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-500"
                                            style={{ width: `${freeShippingProgress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm font-bold text-green-700 text-center">
                                    🚚 {language === 'ko' ? '무료 배송 조건 달성!' : language === 'zh' ? '已达到免费送货条件！' : 'You\'ve unlocked free shipping!'}
                                </div>
                            )}

                            {/* Cart Items */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                                {items.map((item) => {
                                    const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
                                    const isRemoving = removingId === key;
                                    return (
                                        <div
                                            key={key}
                                            className={`flex items-start gap-3 p-4 transition-all duration-200 ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100'}`}
                                        >
                                            {/* Image */}
                                            <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                                                <img
                                                    src={item.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200'}
                                                    alt={item.name}
                                                    className="w-20 h-20 rounded-xl object-cover border border-gray-100"
                                                />
                                            </Link>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/products/${item.productId}`}>
                                                    <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug hover:text-brand-primary transition-colors">
                                                        {item.name}
                                                    </p>
                                                </Link>
                                                {item.variantLabel && (
                                                    <p className="text-xs text-gray-400 mt-0.5">{item.variantLabel}</p>
                                                )}
                                                <p className="text-base font-black text-brand-secondary mt-1">
                                                    {formatUsd(item.priceUsd * item.qty)}
                                                </p>
                                                {item.qty > 1 && (
                                                    <p className="text-xs text-gray-400">{formatUsd(item.priceUsd)} each</p>
                                                )}

                                                {/* Qty Controls + Remove */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => updateQty(item.productId, item.qty - 1, item.variantId)}
                                                            className="px-2 py-1.5 hover:bg-gray-50 transition-colors active:scale-95"
                                                        >
                                                            <Minus className="w-3.5 h-3.5 text-gray-600" />
                                                        </button>
                                                        <span className="px-3 py-1.5 text-sm font-bold text-gray-900 min-w-[2rem] text-center bg-white">
                                                            {item.qty}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQty(item.productId, item.qty + 1, item.variantId)}
                                                            className="px-2 py-1.5 hover:bg-gray-50 transition-colors active:scale-95"
                                                        >
                                                            <Plus className="w-3.5 h-3.5 text-gray-600" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemove(item.productId, item.variantId)}
                                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        {t.remove}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Order Summary */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                <h3 className="font-extrabold text-gray-900 mb-4 text-sm">{t.subtotal}</h3>
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>{t.itemsCount(totalItems)}</span>
                                        <span className="font-semibold">{formatUsd(subtotal)}</span>
                                    </div>
                                    {freeShippingRemaining <= 0 && (
                                        <div className="flex justify-between text-sm text-green-600 font-semibold">
                                            <span>{language === 'ko' ? '배송비' : 'Shipping'}</span>
                                            <span>Free</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 border-t border-gray-100 mb-5">
                                    <span>{t.subtotal}</span>
                                    <span className="text-brand-secondary">{formatUsd(subtotal)}</span>
                                </div>

                                <Link
                                    href="/checkout"
                                    className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-4 rounded-xl font-extrabold text-base hover:bg-brand-primary/90 transition-all active:scale-[0.99] shadow-sm"
                                >
                                    {t.checkout}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/"
                                    className="mt-2 w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors py-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {t.continueShopping}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
