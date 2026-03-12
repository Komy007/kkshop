'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard, Package, ShoppingCart, ChevronDown,
    LogOut, Menu, X, Store,
} from 'lucide-react';

const NAV = [
    {
        key: 'dashboard', labelKo: '대시보드', labelEn: 'Dashboard',
        icon: LayoutDashboard, href: '/seller',
    },
    {
        key: 'products', labelKo: '상품 관리', labelEn: 'Products',
        icon: Package,
        children: [
            { labelKo: '내 상품 목록', labelEn: 'My Products', href: '/seller/products' },
            { labelKo: '새 상품 등록', labelEn: 'New Product',  href: '/seller/products/new' },
        ],
    },
    {
        key: 'orders', labelKo: '주문 현황', labelEn: 'Orders',
        icon: ShoppingCart, href: '/seller/orders',
    },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [open, setOpen] = useState<string | null>('products');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [companyName, setCompanyName] = useState('');

    useEffect(() => {
        fetch('/api/seller/profile').then(r => r.json()).then(d => setCompanyName(d?.companyName || 'Seller'));
        for (const item of NAV) {
            if ('children' in item && item.children?.some(c => pathname.startsWith(c.href))) {
                setOpen(item.key); break;
            }
        }
    }, [pathname]);

    const isActive = (href: string) =>
        pathname === href || (href !== '/seller' && pathname.startsWith(href + '/'));

    const NavLabel = ({ labelKo, labelEn }: { labelKo: string; labelEn: string }) => (
        <span className="flex-1 text-left">
            <span className="block text-sm font-medium leading-tight">{labelKo}</span>
            <span className="block text-[10px] opacity-50 leading-tight">{labelEn}</span>
        </span>
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow">
                    <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                    <div className="font-bold text-white text-sm line-clamp-1">{companyName}</div>
                    <div className="text-xs text-teal-400">Seller Portal</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV.map(item => {
                    const Icon = item.icon;

                    if ('href' in item && item.href) {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.key} href={item.href} onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${active ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel labelKo={item.labelKo} labelEn={item.labelEn} />
                            </Link>
                        );
                    }

                    const childList = 'children' in item ? item.children ?? [] : [];
                    const anyActive = childList.some(c => pathname.startsWith(c.href));
                    const isOpenGroup = open === item.key || anyActive;

                    return (
                        <div key={item.key}>
                            <button onClick={() => setOpen(p => p === item.key ? null : item.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${anyActive ? 'text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel labelKo={item.labelKo} labelEn={item.labelEn} />
                                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpenGroup ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpenGroup && (
                                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                    {childList.map(child => (
                                        <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center px-3 py-1.5 rounded-lg transition-all ${isActive(child.href) ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                            <span className="flex-1">
                                                <span className="block text-sm leading-tight">{child.labelKo}</span>
                                                <span className="block text-[10px] opacity-50 leading-tight">{child.labelEn}</span>
                                            </span>
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
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <Store className="w-4 h-4" />
                    <span className="text-xs">쇼핑몰 보기 / View Store</span>
                </Link>
                <button onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs">로그아웃 / Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            <aside className="hidden md:flex flex-col w-64 bg-slate-800 flex-shrink-0 shadow-xl">
                <SidebarContent />
            </aside>
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
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="font-bold text-gray-900 text-sm">Seller Portal</div>
                    <div />
                </header>
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
