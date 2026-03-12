'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    Settings, Store, Tag, ChevronDown, LogOut,
    Menu, X, Sparkles, ClipboardList, Globe,
} from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { useAppStore, rehydrateLanguageStore } from '@/store/useAppStore';

const getAdminNav = (t: any) => [
    { label: t.admin.nav.dashboard, icon: LayoutDashboard, href: '/admin' },
    {
        label: t.admin.nav.products, icon: Package,
        children: [
            { label: t.admin.products.title, href: '/admin/products' },
            { label: t.admin.nav.reviews, href: '/admin/reviews' },
            { label: t.admin.nav.reviewProducts, href: '/admin/products/review' },
            { label: t.admin.products.newProduct, href: '/admin/products/new' },
            { label: t.admin.nav.categories, href: '/admin/categories' },
        ],
    },
    { label: t.admin.nav.orders, icon: ShoppingCart, href: '/admin/orders' },
    { label: t.admin.nav.inventory, icon: ClipboardList, href: '/admin/inventory' },
    {
        label: t.admin.nav.customers, icon: Users,
        children: [
            { label: t.admin.nav.customerList, href: '/admin/customers' },
            { label: t.admin.nav.roles, href: '/admin/settings/roles' },
        ],
    },
    { label: t.admin.nav.suppliers, icon: Store, href: '/admin/suppliers' },
    {
        label: t.admin.nav.settings, icon: Settings,
        children: [
            { label: t.admin.nav.landingSettings, href: '/admin/landing-settings' },
            { label: t.admin.nav.changePassword, href: '/admin/change-password' },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const params = usePathname();
    const t = useTranslations();
    const { language, setLanguage } = useAppStore();
    const ADMIN_NAV = getAdminNav(t);

    const [open, setOpen] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        rehydrateLanguageStore();
        // Auto-expand active group
        for (const item of ADMIN_NAV) {
            if (item.children?.some(c => pathname.startsWith(c.href))) {
                setOpen(item.label);
                break;
            }
        }
        // Get user info
        fetch('/api/auth/session').then(r => r.json()).then(s => {
            setUserEmail(s?.user?.email || '');
            setUserRole(s?.user?.role || 'USER');
        });
    }, [pathname, ADMIN_NAV]);

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
                {ADMIN_NAV.filter(item => {
                    // SUPERADMIN can see everything
                    if (userRole === 'SUPERADMIN') return true;
                    // ADMIN (Staff) restricted view
                    if (userRole === 'ADMIN') {
                        const adminAllowed = [
                            t.admin.nav.products,
                            t.admin.nav.orders,
                            t.admin.nav.inventory,
                            t.admin.nav.customers,
                        ];
                        // Also check for specific restricted children within allowed groups
                        if (item.label === t.admin.nav.customers) {
                            // STAFF can see customers, but not roles
                            return true;
                        }
                        return adminAllowed.includes(item.label);
                    }
                    return false;
                }).map(item => {
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
                    
                    // Filter children for ADMIN role
                    const filteredChildren = item.children?.filter(child => {
                        if (userRole === 'SUPERADMIN') return true;
                        if (userRole === 'ADMIN') {
                            // Staff cannot see 'Roles & Permissions'
                            if (child.href === '/admin/settings/roles') return false;
                            // Staff cannot see dashboard (if it's a child, but here it's root)
                            return true;
                        }
                        return false;
                    });

                    if (!filteredChildren || filteredChildren.length === 0) return null;

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
                                    {filteredChildren.map(child => (
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
                    <div className="text-xs text-slate-500 truncate px-1 mb-3">{userEmail}</div>
                )}
                
                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl mb-3">
                    <button onClick={() => setLanguage('ko')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'ko' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        🇰🇷 KO
                    </button>
                    <button onClick={() => setLanguage('en')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        🇺🇸 EN
                    </button>
                </div>

                <Link href="/" target="_blank"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all mb-1">
                    <Sparkles className="w-4 h-4" />{t.admin.nav.viewStore}
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: window.location.origin + '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <LogOut className="w-4 h-4" />{t.mypage.logout}
                </button>
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

                <main className="flex-1 overflow-y-auto overflow-x-auto min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
