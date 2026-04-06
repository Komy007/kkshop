'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard, Package, ShoppingCart, ChevronDown,
    LogOut, Menu, X, Store, Banknote, KeyRound,
} from 'lucide-react';

const NAV = [
    {
        key: 'dashboard', en: 'Dashboard', ko: '대시보드',
        icon: LayoutDashboard, href: '/seller',
    },
    {
        key: 'products', en: 'My Products', ko: '상품 관리',
        icon: Package,
        children: [
            { en: 'Product List',  ko: '상품 목록',    href: '/seller/products' },
            { en: 'New Product',   ko: '새 상품 등록',  href: '/seller/products/new' },
        ],
    },
    {
        key: 'orders', en: 'My Orders', ko: '주문 현황',
        icon: ShoppingCart, href: '/seller/orders',
    },
    {
        key: 'payouts', en: 'My Payouts', ko: '정산 내역',
        icon: Banknote, href: '/seller/payouts',
    },
    {
        key: 'password', en: 'Change Password', ko: '비밀번호 변경',
        icon: KeyRound, href: '/seller/change-password',
    },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [open, setOpen] = useState<string | null>('products');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [companyName, setCompanyName] = useState('');

    // Prevent the root layout's pt-24/pb-20 wrapper from making the window scrollable.
    // Without this, clicking buttons fires browser scrollIntoView on the window,
    // which shifts the seller layout out of the viewport.
    useEffect(() => {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        fetch('/api/seller/profile').then(r => r.json()).then(d => setCompanyName(d?.companyName || 'Seller'));
        for (const item of NAV) {
            if ('children' in item && item.children?.some(c => pathname.startsWith(c.href))) {
                setOpen(item.key); break;
            }
        }
    }, [pathname]);

    const isChildActive = (href: string) => pathname === href;
    const isLeafActive  = (href: string) =>
        pathname === href || (href !== '/seller' && pathname.startsWith(href + '/'));

    /* EN big / KO small */
    const NavLabel = ({ en, ko }: { en: string; ko: string }) => (
        <span className="flex-1 text-left">
            <span className="block text-sm font-semibold leading-tight">{en}</span>
            <span className="block text-[10px] opacity-40 leading-tight">{ko}</span>
        </span>
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow">
                    <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                    <div className="font-bold text-white text-sm leading-tight line-clamp-1">{companyName}</div>
                    <div className="text-[11px] text-teal-400 font-medium">Seller Portal · 셀러 포털</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV.map(item => {
                    const Icon = item.icon;

                    if ('href' in item && item.href) {
                        const active = isLeafActive(item.href);
                        return (
                            <Link key={item.key} href={item.href} onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel en={item.en} ko={item.ko} />
                            </Link>
                        );
                    }

                    const childList = 'children' in item ? item.children ?? [] : [];
                    const anyActive   = childList.some(c => isChildActive(c.href));
                    const isOpenGroup = open === item.key || anyActive;

                    return (
                        <div key={item.key}>
                            <button onClick={() => setOpen(p => p === item.key ? null : item.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${anyActive ? 'text-white bg-white/5' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel en={item.en} ko={item.ko} />
                                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpenGroup ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpenGroup && (
                                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                    {childList.map(child => (
                                        <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                                            className={`flex flex-col px-3 py-1.5 rounded-lg transition-all ${isChildActive(child.href) ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                            <span className="text-sm font-semibold leading-tight">{child.en}</span>
                                            <span className="text-[10px] opacity-40 leading-tight">{child.ko}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/10 p-4 space-y-1">
                <Link href="/" target="_blank"
                    className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <Store className="w-4 h-4 flex-shrink-0" />
                    <span>
                        <span className="block text-xs font-semibold leading-tight">View Store</span>
                        <span className="block text-[10px] opacity-40 leading-tight">쇼핑몰 보기</span>
                    </span>
                </Link>
                <button onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>
                        <span className="block text-xs font-semibold leading-tight">Logout</span>
                        <span className="block text-[10px] opacity-40 leading-tight">로그아웃</span>
                    </span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-800 flex-shrink-0 shadow-xl">
                <SidebarContent />
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-800 flex flex-col z-10 shadow-2xl">
                        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <div className="font-bold text-gray-900 text-sm leading-tight">Seller Portal</div>
                        <div className="text-[10px] text-gray-400">셀러 포털</div>
                    </div>
                    <div />
                </header>
                <main className="flex-1 overflow-y-auto overflow-x-auto min-w-0">{children}</main>
            </div>
        </div>
    );
}
