'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    Settings, Store, ChevronDown, LogOut,
    Menu, X, Sparkles, ClipboardList, Globe, BarChart2,
    KeyRound, Shield, MessageSquare, RefreshCcw, Banknote,
    Bell, Search,
} from 'lucide-react';
import { useAppStore, rehydrateLanguageStore } from '@/store/useAppStore';

// ─── Role types ────────────────────────────────────────────────────────────────
type Role = 'SUPERADMIN' | 'ADMIN' | 'SUPPLIER';

interface NavChild {
    labelKo: string;
    labelEn: string;
    href: string;
    roles: readonly Role[];
}

interface NavGroup {
    key: string;
    labelKo: string;
    labelEn: string;
    icon: React.ElementType;
    roles: readonly Role[];
    children: readonly NavChild[];
    href?: never;
}

interface NavLeaf {
    key: string;
    labelKo: string;
    labelEn: string;
    icon: React.ElementType;
    roles: readonly Role[];
    href: string;
    children?: never;
}

type NavItem = NavGroup | NavLeaf;

// ─── Navigation Definition ─────────────────────────────────────────────────────
const ADMIN_NAV: readonly NavItem[] = [
    {
        key: 'dashboard',
        labelKo: '대시보드', labelEn: 'Dashboard',
        icon: LayoutDashboard,
        href: '/admin',
        roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
        key: 'products',
        labelKo: '상품 관리', labelEn: 'Products',
        icon: Package,
        roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            { labelKo: '상품 목록',  labelEn: 'Product List',    href: '/admin/products',              roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '상품 등록',  labelEn: 'New Product',     href: '/admin/products/new',          roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '대량 등록',  labelEn: 'Bulk Import',     href: '/admin/products/bulk-import',  roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '상품 검수',  labelEn: 'Review Products', href: '/admin/products/review',       roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '리뷰 관리',  labelEn: 'Reviews',         href: '/admin/reviews',               roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '카테고리',   labelEn: 'Categories',      href: '/admin/categories',            roles: ['SUPERADMIN', 'ADMIN'] },
        ],
    },
    {
        key: 'orders',
        labelKo: '주문 관리', labelEn: 'Orders',
        icon: ShoppingCart,
        roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            { labelKo: '전체 주문',   labelEn: 'All Orders',      href: '/admin/orders',         roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '반품 / 환불', labelEn: 'Returns & Refunds', href: '/admin/orders/returns', roles: ['SUPERADMIN', 'ADMIN'] },
        ],
    },
    {
        key: 'inventory',
        labelKo: '재고 관리', labelEn: 'Inventory',
        icon: ClipboardList,
        href: '/admin/inventory',
        roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
        key: 'customers',
        labelKo: '고객 관리', labelEn: 'Customers',
        icon: Users,
        roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            { labelKo: '회원 목록',       labelEn: 'Customer List',   href: '/admin/customers',      roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '쿠폰',            labelEn: 'Coupons',         href: '/admin/coupons',        roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '포인트 설정',     labelEn: 'Points Settings', href: '/admin/settings/points', roles: ['SUPERADMIN'] },
            { labelKo: '역할 / 계정관리', labelEn: 'Roles & Accounts', href: '/admin/settings/roles', roles: ['SUPERADMIN'] },
        ],
    },
    {
        key: 'marketing',
        labelKo: '마케팅', labelEn: 'Marketing',
        icon: Sparkles,
        roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            { labelKo: '배너 / 광고',    labelEn: 'Banners & Ads',   href: '/admin/marketing/banners',       roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '이메일 캠페인',  labelEn: 'Email Campaign',  href: '/admin/marketing/email',         roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '플래시 세일',    labelEn: 'Flash Sale',      href: '/admin/marketing/flash-sale',    roles: ['SUPERADMIN', 'ADMIN'] },
            { labelKo: '알림 관리',      labelEn: 'Notifications',   href: '/admin/marketing/notifications', roles: ['SUPERADMIN', 'ADMIN'] },
        ],
    },
    {
        key: 'analytics',
        labelKo: '통계 / 분석', labelEn: 'Analytics',
        icon: BarChart2,
        href: '/admin/analytics',
        roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
        key: 'support',
        labelKo: '고객 지원 (CS)', labelEn: 'CS Support',
        icon: MessageSquare,
        href: '/admin/support',
        roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
        key: 'suppliers',
        labelKo: '셀러 관리', labelEn: 'Sellers',
        icon: Store,
        roles: ['SUPERADMIN'],
        children: [
            { labelKo: '셀러 목록',   labelEn: 'Seller List',        href: '/admin/suppliers',            roles: ['SUPERADMIN'] },
            { labelKo: '수수료 설정',   labelEn: 'Commission Settings',  href: '/admin/suppliers/commission', roles: ['SUPERADMIN'] },
            { labelKo: '정산 / 페이아웃', labelEn: 'Payouts',            href: '/admin/suppliers/payouts',    roles: ['SUPERADMIN'] },
        ],
    },
    {
        key: 'settings',
        labelKo: '시스템 설정', labelEn: 'Settings',
        icon: Settings,
        roles: ['SUPERADMIN'],
        children: [
            { labelKo: '랜딩 페이지', labelEn: 'Landing Page',    href: '/admin/landing-settings',  roles: ['SUPERADMIN'] },
            { labelKo: '결제 설정',   labelEn: 'Payment Gateway', href: '/admin/settings/payment',  roles: ['SUPERADMIN'] },
            { labelKo: 'SMTP 이메일', labelEn: 'Email Config',    href: '/admin/settings/email',    roles: ['SUPERADMIN'] },
            { labelKo: '배송 / 구역', labelEn: 'Shipping & Zones', href: '/admin/settings/shipping', roles: ['SUPERADMIN'] },
            { labelKo: 'SEO 설정',    labelEn: 'SEO Settings',    href: '/admin/settings/seo',      roles: ['SUPERADMIN'] },
            { labelKo: '보안 (2FA)',  labelEn: 'Security / 2FA',  href: '/admin/settings/security', roles: ['SUPERADMIN', 'ADMIN'] },
        ],
    },
    {
        key: 'audit',
        labelKo: '감사 로그', labelEn: 'Audit Logs',
        icon: Shield,
        href: '/admin/audit-logs',
        roles: ['SUPERADMIN'],
    },
    {
        key: 'password',
        labelKo: '비밀번호 변경', labelEn: 'Change Password',
        icon: KeyRound,
        href: '/admin/change-password',
        roles: ['SUPERADMIN', 'ADMIN'],
    },
] as const;

// ─── Supplier (Seller) Nav ─────────────────────────────────────────────────────
const SELLER_NAV: readonly NavItem[] = [
    {
        key: 'seller-dashboard',
        labelKo: '내 대시보드', labelEn: 'My Dashboard',
        icon: LayoutDashboard,
        href: '/seller',
        roles: ['SUPPLIER'],
    },
    {
        key: 'seller-products',
        labelKo: '내 상품', labelEn: 'My Products',
        icon: Package,
        roles: ['SUPPLIER'],
        children: [
            { labelKo: '상품 목록', labelEn: 'Product List', href: '/seller/products',     roles: ['SUPPLIER'] },
            { labelKo: '상품 등록', labelEn: 'New Product',  href: '/seller/products/new', roles: ['SUPPLIER'] },
        ],
    },
    {
        key: 'seller-orders',
        labelKo: '주문 확인', labelEn: 'My Orders',
        icon: ShoppingCart,
        href: '/seller/orders',
        roles: ['SUPPLIER'],
    },
    {
        key: 'seller-payouts',
        labelKo: '정산 내역', labelEn: 'My Payouts',
        icon: Banknote,
        href: '/seller/payouts',
        roles: ['SUPPLIER'],
    },
    {
        key: 'seller-password',
        labelKo: '비밀번호 변경', labelEn: 'Change Password',
        icon: KeyRound,
        href: '/seller/change-password',
        roles: ['SUPPLIER'],
    },
] as const;

// ─── Main Layout ───────────────────────────────────────────────────────────────
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
        const nav = userRole === 'SUPPLIER' ? SELLER_NAV : ADMIN_NAV;
        for (const item of nav) {
            if ('children' in item && item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))) {
                setOpen(item.key);
                break;
            }
        }
    }, [pathname, userRole]);

    if (pathname === '/admin/login') return <>{children}</>;

    // ── Helpers ──────────────────────────────────────────────────────────────
    // Leaf item active: exact match OR prefix (for top-level leaves only, no sibling collision)
    const isLeafActive = (href: string) =>
        pathname === href || (href !== '/admin' && href !== '/seller' && pathname.startsWith(href + '/'));

    // Child item active: EXACT match only (prevents sibling highlight bug)
    const isChildActive = (href: string) => pathname === href;

    const canSee = (roles: readonly string[]) => roles.includes(userRole);

    const nav = userRole === 'SUPPLIER' ? SELLER_NAV : ADMIN_NAV;

    // ── Sub-components ────────────────────────────────────────────────────────
    const NavLabel = ({ labelKo, labelEn }: { labelKo: string; labelEn: string }) => {
        const primary   = language === 'ko' ? labelKo : labelEn;
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
                    <div className="text-xs text-blue-400">
                        {userRole === 'SUPPLIER' ? 'Seller Panel' : 'Admin Panel'}
                    </div>
                </div>
            </div>

            {/* Role Badge */}
            {userRole && (
                <div className="px-5 py-2 border-b border-white/5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        userRole === 'SUPERADMIN' ? 'bg-purple-600/30 text-purple-300' :
                        userRole === 'ADMIN'      ? 'bg-blue-600/30 text-blue-300' :
                                                    'bg-green-600/30 text-green-300'
                    }`}>
                        {userRole}
                    </span>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {nav.filter(item => canSee(item.roles)).map(item => {
                    const Icon = item.icon;

                    // ── Leaf item (no children) ──────────────────────────────
                    if ('href' in item && item.href) {
                        const active = isLeafActive(item.href);
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                                    active
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel labelKo={item.labelKo} labelEn={item.labelEn} />
                            </Link>
                        );
                    }

                    // ── Group item with children ──────────────────────────────
                    const visibleChildren = (item.children ?? []).filter((c) => canSee(c.roles));
                    if (visibleChildren.length === 0) return null;

                    // anyActive: true if current page is exactly one of the children
                    const anyActive = visibleChildren.some((c) => isChildActive(c.href) || pathname.startsWith(c.href + '/'));
                    const isOpenGroup = open === item.key || anyActive;

                    return (
                        <div key={item.key}>
                            <button
                                onClick={() => setOpen(prev => prev === item.key ? null : item.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                                    anyActive
                                        ? 'text-white bg-white/5'
                                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <NavLabel labelKo={item.labelKo} labelEn={item.labelEn} />
                                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpenGroup ? 'rotate-180' : ''}`} />
                            </button>

                            {isOpenGroup && (
                                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                    {visibleChildren.map((child) => {
                                        // ← BUG FIX: exact match for child links
                                        const childActive = isChildActive(child.href);
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center px-3 py-1.5 rounded-lg transition-all ${
                                                    childActive
                                                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                                                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                <span className="flex-1">
                                                    <span className="block text-sm leading-tight">
                                                        {language === 'ko' ? child.labelKo : child.labelEn}
                                                    </span>
                                                    <span className="block text-[10px] opacity-40 leading-tight">
                                                        {language === 'ko' ? child.labelEn : child.labelKo}
                                                    </span>
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/10 p-4 space-y-2">
                {userEmail && (
                    <div className="text-[10px] text-slate-500 truncate px-1">{userEmail}</div>
                )}

                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                    {(['ko', 'en'] as const).map(lang => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                language === lang
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {lang === 'ko' ? '한국어' : 'English'}
                        </button>
                    ))}
                </div>

                <Link
                    href="/"
                    target="_blank"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                    <Globe className="w-4 h-4" />
                    <span className="text-xs">{language === 'ko' ? '쇼핑몰 보기' : 'View Store'}</span>
                </Link>

                <button
                    onClick={() => signOut({ callbackUrl: window.location.origin + '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs">{language === 'ko' ? '로그아웃' : 'Logout'}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-slate-100 overflow-hidden">
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
