'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard, Package, ShoppingCart, ChevronDown,
    LogOut, Menu, X, Store, Banknote, KeyRound, Globe, Bell,
} from 'lucide-react';
import { useAppStore, rehydrateLanguageStore } from '@/store/useAppStore';

const NAV = [
    {
        key: 'dashboard', en: 'Dashboard', ko: '대시보드',
        icon: LayoutDashboard, href: '/seller',
    },
    {
        key: 'products', en: 'My Products', ko: '상품 관리',
        icon: Package,
        children: [
            { en: 'Product List',  ko: '상품 목록',   href: '/seller/products' },
            { en: 'New Product',   ko: '새 상품 등록', href: '/seller/products/new' },
        ],
    },
    {
        key: 'orders', en: 'My Orders', ko: '주문 현황',
        icon: ShoppingCart, href: '/seller/orders',
    },
    {
        key: 'notifications', en: 'Notifications', ko: '알림',
        icon: Bell, href: '/seller/notifications',
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

// 페이지 제목 맵
const PAGE_TITLES: Record<string, string> = {
    '/seller':                    'Dashboard',
    '/seller/products':           'My Products',
    '/seller/products/new':       'New Product',
    '/seller/orders':             'My Orders',
    '/seller/notifications':      'Notifications · 알림',
    '/seller/payouts':            'My Payouts',
    '/seller/change-password':    'Change Password',
};

function getPageTitle(pathname: string): string {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (/\/seller\/products\/.+/.test(pathname)) return 'Edit Product';
    return 'Seller Portal';
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { language, setLanguage } = useAppStore();

    const [open,        setOpen]        = useState<string | null>('products');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    // 루트 레이아웃 body 스크롤 잠금 — seller 전용 스크롤 컨테이너 사용
    useEffect(() => {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        rehydrateLanguageStore();
        fetch('/api/seller/profile').then(r => r.json()).then(d => setCompanyName(d?.companyName || 'Seller'));
        fetch('/api/seller/notifications').then(r => r.ok ? r.json() : { unreadCount: 0 }).then(d => setUnreadCount(d?.unreadCount ?? 0));
        for (const item of NAV) {
            if ('children' in item && item.children?.some(c => pathname.startsWith(c.href))) {
                setOpen(item.key); break;
            }
        }
    }, [pathname]);

    const isChildActive = (href: string) => pathname === href;
    const isLeafActive  = (href: string) =>
        pathname === href || (href !== '/seller' && pathname.startsWith(href + '/'));

    // 언어에 따라 주/보조 라벨 전환 — admin 레이아웃과 동일 방식
    const NavLabel = ({ en, ko }: { en: string; ko: string }) => {
        const primary   = language === 'ko' ? ko : en;
        const secondary = language === 'ko' ? en : ko;
        return (
            <span className="flex-1 text-left">
                <span className="block text-sm font-semibold leading-tight">{primary}</span>
                <span className="block text-[10px] opacity-40 leading-tight">{secondary}</span>
            </span>
        );
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* 로고 */}
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
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {NAV.map(item => {
                    const Icon = item.icon;

                    if ('href' in item && item.href) {
                        const active = isLeafActive(item.href);
                        return (
                            <Link key={item.key} href={item.href} onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                    active
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel en={item.en} ko={item.ko} />
                            </Link>
                        );
                    }

                    const childList   = 'children' in item ? item.children ?? [] : [];
                    const anyActive   = childList.some(c => isChildActive(c.href));
                    const isOpenGroup = open === item.key || anyActive;

                    return (
                        <div key={item.key}>
                            <button onClick={() => setOpen(p => p === item.key ? null : item.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                    anyActive
                                        ? 'text-white bg-white/5'
                                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel en={item.en} ko={item.ko} />
                                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpenGroup ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpenGroup && (
                                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                    {childList.map(child => {
                                        const childActive = isChildActive(child.href);
                                        const primary   = language === 'ko' ? child.ko : child.en;
                                        const secondary = language === 'ko' ? child.en : child.ko;
                                        return (
                                            <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                                                className={`flex flex-col px-3 py-1.5 rounded-lg transition-all ${
                                                    childActive
                                                        ? 'bg-teal-600 text-white shadow-sm'
                                                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                                }`}>
                                                <span className="text-sm font-semibold leading-tight">{primary}</span>
                                                <span className="text-[10px] opacity-40 leading-tight">{secondary}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* 푸터 */}
            <div className="border-t border-white/10 p-4 space-y-2">
                {/* 언어 전환 — admin 레이아웃과 동일 방식 */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                    {(['ko', 'en'] as const).map(lang => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                language === lang
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {lang === 'ko' ? '한국어' : 'English'}
                        </button>
                    ))}
                </div>

                <Link href="/" target="_blank"
                    className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span>
                        <span className="block text-xs font-semibold leading-tight">
                            {language === 'ko' ? '쇼핑몰 보기' : 'View Store'}
                        </span>
                        <span className="block text-[10px] opacity-40 leading-tight">
                            {language === 'ko' ? 'View Store' : '쇼핑몰 보기'}
                        </span>
                    </span>
                </Link>

                <button onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>
                        <span className="block text-xs font-semibold leading-tight">
                            {language === 'ko' ? '로그아웃' : 'Logout'}
                        </span>
                        <span className="block text-[10px] opacity-40 leading-tight">
                            {language === 'ko' ? 'Logout' : '로그아웃'}
                        </span>
                    </span>
                </button>
            </div>
        </div>
    );

    const pageTitle = getPageTitle(pathname);

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-slate-100 overflow-hidden">
            {/* 데스크탑 사이드바 */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-800 flex-shrink-0 shadow-xl">
                <SidebarContent />
            </aside>

            {/* 모바일 오버레이 */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-800 flex flex-col z-10 shadow-2xl">
                        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* 메인 콘텐츠 */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* 상단 헤더 바 */}
                <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-12 bg-white border-b border-slate-200 shadow-sm">
                    {/* 모바일: 사이드바 토글 */}
                    <button onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* 데스크탑: 브레드크럼 */}
                    <div className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
                        <span className="text-slate-400 font-medium flex-shrink-0">{companyName || 'Seller Portal'}</span>
                        <span className="text-slate-300 flex-shrink-0">/</span>
                        <span className="font-semibold text-slate-700 truncate">{pageTitle}</span>
                    </div>

                    {/* 모바일: 타이틀 */}
                    <span className="md:hidden font-bold text-gray-900 text-sm">Seller Portal</span>

                    {/* 우측: 알림 + 스토어 링크 */}
                    <div className="flex items-center gap-1">
                        <Link href="/seller/notifications"
                            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={() => setUnreadCount(0)}>
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-extrabold px-0.5 leading-none">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                        <a href="/" target="_blank"
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <Store className="w-3.5 h-3.5" />
                            View Store
                        </a>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-auto min-w-0">{children}</main>
            </div>
        </div>
    );
}
