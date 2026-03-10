'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    productId: string;
    name: string;
    priceUsd: number;
    imageUrl: string;
    qty: number;
    variantId?: string;
    variantLabel?: string;
}

interface CartState {
    items: CartItem[];
    isDrawerOpen: boolean;

    addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
    removeItem: (productId: string, variantId?: string) => void;
    updateQty: (productId: string, qty: number, variantId?: string) => void;
    clearCart: () => void;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
}

function isSameItem(a: CartItem, productId: string, variantId?: string): boolean {
    if (variantId) {
        return a.productId === productId && a.variantId === variantId;
    }
    return a.productId === productId && !a.variantId;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isDrawerOpen: false,

            addItem: (item, qty = 1) => {
                set((state) => {
                    const existing = state.items.find((i) =>
                        item.variantId
                            ? i.productId === item.productId && i.variantId === item.variantId
                            : i.productId === item.productId && !i.variantId
                    );
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                isSameItem(i, item.productId, item.variantId)
                                    ? { ...i, qty: i.qty + qty }
                                    : i
                            ),
                        };
                    }
                    return {
                        items: [...state.items, { ...item, qty }],
                    };
                });
            },

            removeItem: (productId, variantId) => {
                set((state) => ({
                    items: state.items.filter((i) => !isSameItem(i, productId, variantId)),
                }));
            },

            updateQty: (productId, qty, variantId) => {
                if (qty <= 0) {
                    get().removeItem(productId, variantId);
                    return;
                }
                set((state) => ({
                    items: state.items.map((i) =>
                        isSameItem(i, productId, variantId) ? { ...i, qty } : i
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),

            openDrawer: () => set({ isDrawerOpen: true }),
            closeDrawer: () => set({ isDrawerOpen: false }),
            toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
        }),
        {
            name: 'kkshop-cart',
            // Only persist items, not drawer state
            partialize: (state) => ({ items: state.items }),
        }
    )
);

// Selector helpers
export const selectTotalItems = (state: CartState) =>
    state.items.reduce((sum, item) => sum + item.qty, 0);

export const selectTotalPrice = (state: CartState) =>
    state.items.reduce((sum, item) => sum + item.priceUsd * item.qty, 0);
