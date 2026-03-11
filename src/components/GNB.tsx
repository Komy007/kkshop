"use client";

import { useState, useEffect, useRef } from "react";
import TaegukgiIcon from "@/components/TaegukgiIcon";
import Link from "next/link";
import { Globe, User, ShoppingCart, Menu, X, LogOut, Settings, Heart } from "lucide-react";
import { useSafeMarketStore, rehydrateLanguageStore } from "@/store/useAppStore";
import { useCartStore, selectTotalItems } from "@/store/useCartStore";
import { useSession, signOut } from "next-auth/react";

const LANGUAGES = [
    { code: "ko" as const, label: "한국어", flag: "" },
    { code: "en" as const, label: "English", flag: "🇺🇸" },
    { code: "km" as const, label: "ភាសាខ្មែរ", flag: "🇰🇭" },
    { code: "zh" as const, label: "中文", flag: "🇨🇳" },
];

export default function GNB() {
    const sessionResult = useSession();
    const session = sessionResult?.data;
    const store = useSafeMarketStore();
    const { language, setLanguage } = store || { language: 'en', setLanguage: (l: string) => { } };
    const totalItems = useCartStore(selectTotalItems);
    const openDrawer = useCartStore((s) => s.openDrawer);

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [wishlistCount, setWishlistCount] = useState(0);
    const langRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

    // Fetch wishlist count when logged in
    useEffect(() => {
        if (session?.user) {
            fetch('/api/user/wishlist')
                .then(res => res.ok ? res.json() : [])
                .then(data => { if (Array.isArray(data)) setWishlistCount(data.length); })
                .catch(() => {});
        } else {
            setWishlistCount(0);
        }
    }, [session]);

    // Sync language with session user if available
    useEffect(() => {
        if (session?.user && (session.user as any).preferredLanguage) {
            const userLang = (session.user as any).preferredLanguage;
            if (userLang !== language && ['ko', 'en', 'km', 'zh'].includes(userLang)) {
                setLanguage(userLang as any);
            }
        }
    }, [session, setLanguage]);

    useEffect(() => {
        setMounted(true);
        // Load persisted language from localStorage on first mount
        rehydrateLanguageStore();

        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update the HTML data-lang attribute whenever language changes
    useEffect(() => {
        document.documentElement.setAttribute('data-lang', language);
    }, [language]);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangOpen(false);
            }
            if (userRef.current && !userRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        if (langOpen || userMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [langOpen, userMenuOpen]);

    if (!mounted) return null;

    return (
        <>
            <header
                className={`fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-300 animate-slide-down ${scrolled ? "pt-2 pb-2" : "pt-6"
                    }`}
            >
                <div
                    className={`w-[95%] max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-full transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border border-gray-100 shadow-sm" : "bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm"
                        }`}
                >
                    {/* Logo */}
                    <Link href="/" className="relative flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center">
                            <span className="text-white font-bold text-lg leading-none">K</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tighter transition-all">
                            <span className="text-gray-900">KK</span>
                            <span className="text-[#Ef4444]">S</span>
                            <span className="text-[#EAB308]">h</span>
                            <span className="text-[#22C55E]">o</span>
                            <span className="text-[#38BDF8]">p</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/category/skincare" className="text-sm font-bold text-gray-700 hover:text-brand-primary transition-colors">
                            Skincare
                        </Link>
                        <Link href="/category/living" className="text-sm font-bold text-gray-700 hover:text-brand-secondary transition-colors">
                            Living
                        </Link>
                        <Link href="/about" className="text-sm font-bold text-gray-700 hover:text-brand-accent transition-colors">
                            About
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Language Selector */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors text-sm text-gray-700 font-bold"
                            >
                                <Globe className="w-4 h-4" />
                                <span>{currentLang?.label}</span>
                            </button>

                            {/* Dropdown — CSS transition */}
                            <div
                                className={`absolute right-0 mt-2 w-28 py-1 glass-panel rounded-xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-200 origin-top-right ${langOpen
                                    ? "opacity-100 scale-100 pointer-events-auto"
                                    : "opacity-0 scale-95 pointer-events-none"
                                    }`}
                            >
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLanguage(lang.code);
                                            setLangOpen(false);
                                        }}
                                        className={`px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors ${currentLang?.code === lang.code ? "text-brand-primary font-extrabold" : "text-gray-900 font-semibold"
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* User Login / Menu */}
                        <div className="relative" ref={userRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200 hover:border-brand-primary/40 hover:text-brand-primary transition-all text-gray-700 shadow-sm"
                            >
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4" />
                                )}
                                <span className="text-sm font-bold">
                                    {session ? (session.user?.name?.split(' ')[0] || 'My') : 'My'}
                                </span>
                            </button>

                            {/* User Dropdown */}
                            <div
                                className={`absolute right-0 mt-2 w-52 py-1 glass-panel rounded-xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-200 origin-top-right ${userMenuOpen
                                    ? "opacity-100 scale-100 pointer-events-auto"
                                    : "opacity-0 scale-95 pointer-events-none"
                                    }`}
                            >
                                {session ? (
                                    <>
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Account</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{session.user?.email}</p>
                                        </div>
                                        <Link href="/mypage" onClick={() => setUserMenuOpen(false)}
                                            className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                            <User className="w-4 h-4" /> My Page
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                useCartStore.getState().clearCart();
                                                signOut({ callbackUrl: window.location.origin + '/' });
                                            }}
                                            className="px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 text-left flex items-center gap-2 w-full"
                                        >
                                            <LogOut className="w-4 h-4" /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" onClick={() => setUserMenuOpen(false)}
                                            className="px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Login
                                        </Link>
                                        <Link href="/signup" onClick={() => setUserMenuOpen(false)}
                                            className="mx-3 mb-2 mt-1 px-4 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl flex items-center gap-2 justify-center transition-colors">
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Wishlist */}
                        {session && (
                            <Link
                                href="/mypage?tab=wishlist"
                                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500 transition-all"
                            >
                                <Heart className="w-4 h-4" />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                        {wishlistCount > 99 ? '99+' : wishlistCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Cart */}
                        <button
                            onClick={openDrawer}
                            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all btn-micro"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-secondary text-[9px] font-bold flex items-center justify-center">
                                {totalItems > 99 ? '99+' : totalItems}
                            </span>
                        </button>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="md:hidden relative" ref={langRef}>
                        <button
                            className="flex items-center gap-1.5 p-1 px-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm text-gray-700"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <span className="text-sm font-bold mt-0.5">{currentLang?.code.toUpperCase()}</span>
                            <Menu className="w-5 h-5 text-gray-700" />
                        </button>

                        {/* Mobile Dropdown Menu */}
                        <div
                            className={`absolute right-0 mt-2 w-48 py-2 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-200 origin-top-right ${mobileMenuOpen
                                ? "opacity-100 scale-100 pointer-events-auto"
                                : "opacity-0 scale-95 pointer-events-none"
                                }`}
                        >
                            <div className="px-3 pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500">언어 선택</span>
                            </div>

                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${currentLang?.code === lang.code ? "bg-brand-primary/5 text-brand-primary font-extrabold" : "text-gray-900 font-semibold hover:bg-gray-50"
                                        }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {lang.code === 'ko'
                                            ? <TaegukgiIcon className="w-5 h-[14px] inline-block flex-shrink-0" />
                                            : <span>{lang.flag}</span>
                                        }
                                        {lang.label}
                                    </span>
                                    {currentLang?.code === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                                </button>
                            ))}

                            <div className="h-px w-full bg-gray-100 my-1" />

                            <Link
                                href="/about"
                                className="px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors flex items-center justify-between"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span>회사 소개 (About Us)</span>
                            </Link>

                            <div className="h-px w-full bg-gray-100 my-1" />

                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                <span>닫기 (Close)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}
