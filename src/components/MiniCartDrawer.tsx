'use client';

import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore, selectTotalItems, selectTotalPrice } from '@/store/useCartStore';
import { useAppStore } from '@/store/useAppStore';

const drawerTranslations: Record<string, any> = {
    ko: {
        title: '장바구니',
        empty: '장바구니가 비어있습니다',
        emptyDesc: '마음에 드는 상품을 담아보세요!',
        subtotal: '소계',
        checkout: '주문하기',
        continueShopping: '쇼핑 계속하기',
        crossSellTitle: '이 상품도 함께 구매하세요',
        remove: '삭제',
        confirmRemove: '정말 삭제하시겠습니까?',
    },
    en: {
        title: 'Cart',
        empty: 'Your cart is empty',
        emptyDesc: 'Add some products you love!',
        subtotal: 'Subtotal',
        checkout: 'Checkout',
        continueShopping: 'Continue Shopping',
        crossSellTitle: 'You might also like',
        remove: 'Remove',
        confirmRemove: 'Are you sure you want to remove this item?',
    },
    km: {
        title: 'រទេះ',
        empty: 'រទេះរបស់អ្នកទទេ',
        emptyDesc: 'បន្ថែមផលិតផលដែលអ្នកចូលចិត្ត!',
        subtotal: 'សរុប',
        checkout: 'បញ្ជាទិញ',
        continueShopping: 'បន្តទិញទំនិញ',
        crossSellTitle: 'អ្នកក៏អាចចូលចិត្ត',
        remove: 'លុប',
        confirmRemove: 'តើអ្នកពិតជាចង់លុបមុខទំនិញនេះមែនទេ?',
    },
    zh: {
        title: '购物车',
        empty: '购物车是空的',
        emptyDesc: '添加你喜欢的商品吧！',
        subtotal: '小计',
        checkout: '去结算',
        continueShopping: '继续购物',
        crossSellTitle: '猜你喜欢',
        remove: '删除',
        confirmRemove: '您确定要删除此商品吗？',
    },
};

export default function MiniCartDrawer() {
    const { language } = useAppStore();
    const t = drawerTranslations[language] || drawerTranslations.en;

    const items = useCartStore((s) => s.items);
    const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
    const closeDrawer = useCartStore((s) => s.closeDrawer);
    const removeItem = useCartStore((s) => s.removeItem);
    const updateQty = useCartStore((s) => s.updateQty);
    const totalItems = useCartStore(selectTotalItems);
    const totalPrice = useCartStore(selectTotalPrice);

    const formatUsd = (price: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={closeDrawer}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <aside
                className={`fixed top-0 right-0 z-[75] h-full w-full max-w-md bg-space-900 border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label={t.title}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-brand-primary" />
                        <h2 className="text-lg font-bold text-white">{t.title}</h2>
                        {totalItems > 0 && (
                            <span className="bg-brand-primary/20 text-brand-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeDrawer}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                <ShoppingBag className="w-10 h-10 text-white/20" />
                            </div>
                            <p className="text-white/60 font-medium">{t.empty}</p>
                            <p className="text-white/30 text-sm">{t.emptyDesc}</p>
                            <button
                                onClick={closeDrawer}
                                className="mt-4 px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-primary/90 transition-colors text-sm"
                            >
                                {t.continueShopping}
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {items.map((item) => (
                                <li
                                    key={item.productId}
                                    className="flex gap-4 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors bg-white/[0.02]"
                                >
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-xl bg-space-800 overflow-hidden flex-shrink-0">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                                            <p className="text-brand-primary font-bold text-sm mt-0.5">
                                                {formatUsd(item.priceUsd)}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            {/* Quantity controls */}
                                            <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => updateQty(item.productId, item.qty - 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(item.productId, item.qty + 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(t.confirmRemove)) {
                                                        removeItem(item.productId);
                                                    }
                                                }}
                                                className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-vivid-coral transition-colors rounded-lg hover:bg-vivid-coral/10"
                                                aria-label={t.remove}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer — Subtotal + Checkout */}
                {items.length > 0 && (
                    <div className="border-t border-white/10 px-6 py-5 space-y-4">
                        {/* Cross-sell block placeholder */}
                        <div className="p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
                            <p className="text-xs font-semibold text-brand-primary mb-1">{t.crossSellTitle}</p>
                            <p className="text-[11px] text-white/40">Coming soon...</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-white/60 font-medium">{t.subtotal}</span>
                            <span className="text-xl font-black text-white">{formatUsd(totalPrice)}</span>
                        </div>

                        <button
                            className="w-full py-4 rounded-2xl bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary/90 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
                            onClick={() => {
                                closeDrawer();
                                window.location.href = '/checkout';
                            }}
                        >
                            {t.checkout}
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
