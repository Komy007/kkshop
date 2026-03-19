'use client';

import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore, selectTotalItems, selectTotalPrice } from '@/store/useCartStore';
import { useAppStore, useSafeAppStore } from '@/store/useAppStore';

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
    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
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
                className={`fixed top-0 right-0 z-[75] h-full w-full max-w-md bg-white border-l border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label={t.title}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-6 h-6 text-black" />
                        <h2 className="text-xl font-extrabold text-black">{t.title}</h2>
                        {totalItems > 0 && (
                            <span className="bg-brand-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeDrawer}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                            <div className="w-24 h-24 rounded-2xl icon-3d icon-float bg-gradient-to-br from-gray-100 to-gray-200 mb-2">
                                <ShoppingBag className="w-12 h-12 text-gray-400 drop-shadow-sm" />
                            </div>
                            <p className="text-gray-900 font-extrabold text-lg">{t.empty}</p>
                            <p className="text-gray-500 font-medium">{t.emptyDesc}</p>
                            <button
                                onClick={closeDrawer}
                                className="mt-6 px-8 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-900 font-bold hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                {t.continueShopping}
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {items.map((item) => (
                                <li
                                    key={item.variantId ? `${item.productId}-${item.variantId}` : item.productId}
                                    className="flex gap-4 p-4 rounded-2xl border border-gray-200 hover:border-brand-primary/30 transition-colors bg-white shadow-sm"
                                >
                                    {/* Image */}
                                    <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="text-[15px] font-extrabold text-black leading-snug line-clamp-2">{item.name}</h3>
                                            {item.variantLabel && (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                                                    {item.variantLabel}
                                                </span>
                                            )}
                                            <p className="font-extrabold text-[#E52528] text-lg mt-1 tracking-tight">
                                                {formatUsd(item.priceUsd)}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            {/* Quantity controls */}
                                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                                                <button
                                                    onClick={() => updateQty(item.productId, item.qty - 1, item.variantId)}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="w-3.5 h-3.5 flex-shrink-0" />
                                                </button>
                                                <span className="w-8 h-8 flex items-center justify-center text-black text-sm font-bold border-x border-gray-200">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(item.productId, item.qty + 1, item.variantId)}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                                                </button>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(t.confirmRemove)) {
                                                        removeItem(item.productId, item.variantId);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                aria-label={t.remove}
                                            >
                                                <Trash2 className="w-5 h-5 flex-shrink-0" />
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
                    <div className="border-t border-gray-200 bg-white px-6 py-5 space-y-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <div className="flex items-end justify-between">
                            <span className="text-gray-600 font-bold mb-1">{t.subtotal}</span>
                            <span className="text-2xl font-black text-[#E52528]">{formatUsd(totalPrice)}</span>
                        </div>

                        <button
                            className="w-full py-4 rounded-xl bg-brand-primary text-white font-extrabold text-lg hover:bg-brand-primary/90 transition-all active:scale-[0.98] shadow-md flex justify-center items-center gap-2"
                            onClick={() => {
                                closeDrawer();
                                window.location.href = '/checkout';
                            }}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {t.checkout}
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
