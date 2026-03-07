'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    Settings, Store, Tag, ChevronDown, LogOut,
    Menu, X, Sparkles
} from 'lucide-react';

const ADMIN_NAV = [
    { label: '대시보드', icon: LayoutDashboard, href: '/admin' },
    {
        label: '상품 관리', icon: Package,
        children: [
            { label: '전체 상품 목록', href: '/admin/products' },
            { label: '리뷰 관리', href: '/admin/reviews' },
            { label: '🟡 상품 검수', href: '/admin/products/review' },
            { label: '새 상품 등록', href: '/admin/products/new' },
            { label: '카테고리 관리', href: '/admin/categories' },
        ],
    },
    { label: '주문 관리', icon: ShoppingCart, href: '/admin/orders' },
    {
        label: '회원 관리', icon: Users,
        children: [
            { label: '전체 회원 목록', href: '/admin/customers' },
            { label: '관리자 권한 설정', href: '/admin/settings/roles' },
        ],
    },
    { label: '공급업체 관리', icon: Store, href: '/admin/suppliers' },
    {
        label: '설정', icon: Settings,
        children: [
            { label: '랜딩 페이지 설정', href: '/admin/landing-settings' },
            { label: '비밀번호 변경', href: '/admin/change-password' },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [open, setOpen] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Auto-expand active group
        for (const item of NAV) {
            if (item.children?.some(c => pathname.startsWith(c.href))) {
                setOpen(item.label);
                break;
            }
        }
        // Get user info
        fetch('/api/auth/session').then(r => r.json()).then(s => setUserEmail(s?.user?.email || ''));
    }, [pathname]);

    if (pathname === '/admin/login') return <>{children}</>;

    const isActive = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'));

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow">K</div>
                <div>
                    <div className="font-bold text-white text-sm">KKShop</div>
                    <div className="text-xs text-blue-400">Admin Panel</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {ADMIN_NAV.map(item => {
                    const Icon = item.icon;
                    if ('href' in item && item.href) {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {item.label}
                            </Link>
                        );
                    }
                    const anyActive = item.children?.some(c => pathname.startsWith(c.href));
                    const isOpenGroup = open === item.label || anyActive;
                    return (
                        <div key={item.label}>
                            <button onClick={() => setOpen(prev => prev === item.label ? null : item.label)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${anyActive ? 'text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1 text-left">{item.label}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpenGroup ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpenGroup && (
                                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                    {item.children?.map(child => (
                                        <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                                            className={`block px-3 py-2 rounded-lg text-sm transition-all ${isActive(child.href) ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                            {child.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="border-t border-white/10 p-4">
                {userEmail && (
                    <div className="text-xs text-slate-500 truncate px-1 mb-2">{userEmail}</div>
                )}
                <Link href="/" target="_blank"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all mb-1">
                    <Sparkles className="w-4 h-4" />쇼핑몰 보기
                </Link>
                <Link href="/api/auth/signout" onClick={e => { e.preventDefault(); fetch('/api/auth/signout', { method: 'POST' }).then(() => window.location.href = '/admin/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <LogOut className="w-4 h-4" />로그아웃
                </Link>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-60 bg-slate-900 flex-shrink-0 shadow-xl">
                <SidebarContent />
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 flex flex-col z-10 shadow-2xl">
                        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-20">
                            <X className="w-5 h-5" />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile TopBar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="font-bold text-gray-900 text-sm">KKShop Admin</div>
                    <Link href="/" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs">쇼핑몰</Link>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
