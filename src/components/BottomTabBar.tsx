'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, Search, ShoppingCart, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useCartStore, selectTotalItems } from '@/store/useCartStore';

type TabKey = 'home' | 'category' | 'search' | 'cart' | 'mypage';

const tabTranslations: Record<string, Record<TabKey, string>> = {
    ko: { home: '홈', category: '카테고리', search: '검색', cart: '장바구니', mypage: '마이' },
    en: { home: 'Home', category: 'Category', search: 'Search', cart: 'Cart', mypage: 'My' },
    km: { home: 'ទំព័រដើម', category: 'ប្រភេទ', search: 'ស្វែងរក', cart: 'រទេះ', mypage: 'របស់ខ្ញុំ' },
    zh: { home: '首页', category: '分类', search: '搜索', cart: '购物车', mypage: '我的' },
};

interface TabItem {
    key: TabKey;
    href: string;
    icon: React.ElementType;
}

const tabs: TabItem[] = [
    { key: 'home', href: '/', icon: Home },
    { key: 'category', href: '/category', icon: Grid3X3 },
    { key: 'search', href: '/search', icon: Search },
    { key: 'cart', href: '#cart', icon: ShoppingCart },
    { key: 'mypage', href: '/mypage', icon: User },
];

export default function BottomTabBar() {
    const pathname = usePathname();
    const { language } = useAppStore();
    const totalItems = useCartStore(selectTotalItems);
    const openDrawer = useCartStore((s) => s.openDrawer);
    const t = tabTranslations[language] ?? tabTranslations.en;

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        if (href === '#cart') return false;
        return pathname.startsWith(href);
    };

    return (
        <nav
            className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            role="navigation"
            aria-label="Bottom navigation"
        >
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                {tabs.map((tab) => {
                    const active = isActive(tab.href);
                    const Icon = tab.icon;
                    const label = t?.[tab.key] ?? tab.key;
                    const isCart = tab.key === 'cart';

                    const content = (
                        <div
                            className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors duration-200 ${active ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-800'
                                }`}
                        >
                            <div className="relative">
                                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                                {isCart && totalItems > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-secondary text-[9px] font-bold text-white flex items-center justify-center animate-scale-in">
                                        {totalItems > 99 ? '99+' : totalItems}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium leading-tight">{label}</span>
                        </div>
                    );

                    if (isCart) {
                        return (
                            <button
                                key={tab.key}
                                onClick={openDrawer}
                                className="focus:outline-none"
                                aria-label={label}
                            >
                                {content}
                            </button>
                        );
                    }

                    return (
                        <Link key={tab.key} href={tab.href} aria-label={label}>
                            {content}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
