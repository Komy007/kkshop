'use client';

import { create } from 'zustand';

export interface CartItem {
    productId: string;
    name: string;
    priceUsd: number;
    imageUrl: string;
    qty: number;
}

interface CartState {
    items: CartItem[];
    isDrawerOpen: boolean;

    addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
    removeItem: (productId: string) => void;
    updateQty: (productId: string, qty: number) => void;
    clearCart: () => void;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isDrawerOpen: false,

    addItem: (item, qty = 1) => {
        set((state) => {
            const existing = state.items.find((i) => i.productId === item.productId);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.productId === item.productId
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

    removeItem: (productId) => {
        set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
        }));
    },

    updateQty: (productId, qty) => {
        if (qty <= 0) {
            get().removeItem(productId);
            return;
        }
        set((state) => ({
            items: state.items.map((i) =>
                i.productId === productId ? { ...i, qty } : i
            ),
        }));
    },

    clearCart: () => set({ items: [] }),

    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false }),
    toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
}));

// Selector helpers
export const selectTotalItems = (state: CartState) =>
    state.items.reduce((sum, item) => sum + item.qty, 0);

export const selectTotalPrice = (state: CartState) =>
    state.items.reduce((sum, item) => sum + item.priceUsd * item.qty, 0);
