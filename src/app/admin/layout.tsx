'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    Settings, Store, ChevronDown, LogOut,
    Menu, X, Sparkles, ClipboardList, Globe, BarChart2, KeyRound, Shield,
} from 'lucide-react';
import { useAppStore, rehydrateLanguageStore } from '@/store/useAppStore';

// ─── Bilingual Nav Definition ──────────────────────────────────────────────
// labelKo: Korean label, labelEn: English subtitle
// roles: which roles can see this item
const ADMIN_NAV = [
    {
        key: 'dashboard', labelKo: '대시보드', labelEn: 'Dashboard',
        icon: LayoutDashboard, href: '/admin', roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
        key: 'products', labelKo: '상품 관리', labelEn: 'Products',
        icon: Package, roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            { labelKo: '상품 목록',  labelEn: 'Product List',   href: '/admin/products',        roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '상품 등록',  labelEn: 'New Product',    href: '/admin/products/new',    roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '상품 검수',  labelEn: 'Review Products',href: '/admin/products/review', roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '리뷰 관리',  labelEn: 'Reviews',        href: '/admin/reviews',         roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '카테고리',   labelEn: 'Categories',     href: '/admin/categories',      roles: ['SUPERADMIN', 'ADMIN'] },
        ],
    },
    {
        key: 'orders', labelKo: '주문 관리', labelEn: 'Orders',
        icon: ShoppingCart, href: '/admin/orders', roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
        key: 'inventory', labelKo: '재고 관리', labelEn: 'Inventory',
        icon: ClipboardList, href: '/admin/inventory', roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
        key: 'customers', labelKo: '고객 관리', labelEn: 'Customers',
        icon: Users, roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            { labelKo: '회원 목록',      labelEn: 'Customer List',    href: '/admin/customers',      roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '쿠폰',           labelEn: 'Coupons',          href: '/admin/coupons',        roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '역할 / 계정관리', labelEn: 'Roles & Accounts', href: '/admin/settings/roles', roles: ['SUPERADMIN'] },
        ],
    },
    {
        key: 'marketing', labelKo: '마케팅', labelEn: 'Marketing',
        icon: Sparkles, roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            { labelKo: '이메일 캠페인', labelEn: 'Email Campaign', href: '/admin/marketing/email',      roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '플래시 세일',   labelEn: 'Flash Sale',     href: '/admin/marketing/flash-sale', roles: ['SUPERADMIN', 'ADMIN'] },
        ],
    },
    {
        key: 'analytics', labelKo: '통계 / 분석', labelEn: 'Analytics',
        icon: BarChart2, href: '/admin/analytics', roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
        key: 'suppliers', labelKo: '공급자 관리', labelEn: 'Suppliers',
        icon: Store, href: '/admin/suppliers', roles: ['SUPERADMIN'],
    },
    {
        key: 'settings', labelKo: '시스템 설정', labelEn: 'Settings',
        icon: Settings, roles: ['SUPERADMIN'],
        children: [
            { labelKo: '랜딩 페이지', labelEn: 'Landing Page',  href: '/admin/landing-settings',  roles: ['SUPERADMIN'] },
            { labelKo: 'SMTP 이메일', labelEn: 'Email Config',  href: '/admin/settings/email',    roles: ['SUPERADMIN'] },
            { labelKo: '배송 설정',   labelEn: 'Shipping',      href: '/admin/settings/shipping', roles: ['SUPERADMIN'] },
            { labelKo: '보안 (2FA)', labelEn: 'Security / 2FA', href: '/admin/settings/security', roles: ['SUPERADMIN', 'ADMIN'] },
        ],
    },
    {
        key: 'audit', labelKo: '감사 로그', labelEn: 'Audit Logs',
        icon: Shield, href: '/admin/audit-logs', roles: ['SUPERADMIN'],
    },
    {
        key: 'password', labelKo: '비밀번호 변경', labelEn: 'Change Password',
        icon: KeyRound, href: '/admin/change-password', roles: ['SUPERADMIN', 'ADMIN'],
    },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { language, setLanguage } = useAppStore();

    const [open, setOpen] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        rehydrateLanguageStore();
        fetch('/api/auth/session').then(r => r.json()).then(s => {
            setUserEmail(s?.user?.email || '');
            setUserRole(s?.user?.role || '');
        });
    }, []);

    // Auto-expand active group
    useEffect(() => {
        for (const item of ADMIN_NAV) {
            if ('children' in item && item.children?.some((c: any) => pathname.startsWith(c.href))) {
                setOpen(item.key);
                break;
            }
        }
    }, [pathname]);

    if (pathname === '/admin/login') return <>{children}</>;

    const isActive = (href: string) =>
        pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'));

    const canSee = (roles: readonly string[]) =>
        roles.includes(userRole);

    const NavLabel = ({ labelKo, labelEn }: { labelKo: string; labelEn: string }) => {
        const primary = language === 'ko' ? labelKo : labelEn;
        const secondary = language === 'ko' ? labelEn : labelKo;
        return (
            <span className="flex-1 text-left">
                <span className="block text-sm font-medium leading-tight">{primary}</span>
                <span className="block text-[10px] opacity-40 leading-tight">{secondary}</span>
            </span>
        );
    };

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
                {ADMIN_NAV.filter(item => canSee(item.roles)).map(item => {
                    const Icon = item.icon;

                    // Leaf item (no children)
                    if ('href' in item && item.href) {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.key} href={item.href} onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel labelKo={item.labelKo} labelEn={item.labelEn} />
                            </Link>
                        );
                    }

                    // Group item with children
                    const visibleChildren = ('children' in item ? item.children ?? [] : [])
                        .filter((c: any) => canSee(c.roles));
                    if (visibleChildren.length === 0) return null;

                    const anyActive = visibleChildren.some((c: any) => pathname.startsWith(c.href));
                    const isOpenGroup = open === item.key || anyActive;

                    return (
                        <div key={item.key}>
                            <button
                                onClick={() => setOpen(prev => prev === item.key ? null : item.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${anyActive ? 'text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel labelKo={item.labelKo} labelEn={item.labelEn} />
                                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpenGroup ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpenGroup && (
                                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                    {visibleChildren.map((child: any) => (
                                        <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center px-3 py-1.5 rounded-lg transition-all ${isActive(child.href) ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                            <span className="flex-1">
                                                <span className="block text-sm leading-tight">{language === 'ko' ? child.labelKo : child.labelEn}</span>
                                                <span className="block text-[10px] opacity-40 leading-tight">{language === 'ko' ? child.labelEn : child.labelKo}</span>
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
            <div className="border-t border-white/10 p-4 space-y-2">
                {userEmail && (
                    <div className="text-[10px] text-slate-500 truncate px-1">
                        {userEmail}
                        {userRole && <span className="ml-1 px-1.5 py-0.5 bg-blue-900/40 text-blue-400 rounded text-[9px] font-bold">{userRole}</span>}
                    </div>
                )}

                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                    {(['ko', 'en'] as const).map(lang => (
                        <button key={lang} onClick={() => setLanguage(lang)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${language === lang ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            {lang === 'ko' ? '한국어' : 'English'}
                        </button>
                    ))}
                </div>

                <Link href="/" target="_blank"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs">{language === 'ko' ? '쇼핑몰 보기' : 'View Store'}</span>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: window.location.origin + '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs">{language === 'ko' ? '로그아웃' : 'Logout'}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 flex-shrink-0 shadow-xl">
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
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="font-bold text-gray-900 text-sm">KKShop Admin</div>
                    <Link href="/" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs">Store</Link>
                </header>
                <main className="flex-1 overflow-y-auto overflow-x-auto min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
