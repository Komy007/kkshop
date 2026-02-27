"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Globe, User, ShoppingCart, Menu, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useCartStore, selectTotalItems } from "@/store/useCartStore";

const LANGUAGES = [
    { code: "ko" as const, label: "한국어" },
    { code: "en" as const, label: "English" },
    { code: "km" as const, label: "ភាសាខ្មែរ" },
    { code: "zh" as const, label: "中文" },
];

export default function GNB() {
    const { language, setLanguage } = useAppStore();
    const totalItems = useCartStore(selectTotalItems);
    const openDrawer = useCartStore((s) => s.openDrawer);

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close lang dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangOpen(false);
            }
        };
        if (langOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [langOpen]);

    if (!mounted) return null;

    return (
        <>
            <header
                className={`fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-300 animate-slide-down ${scrolled ? "pt-2 pb-2" : "pt-6"
                    }`}
            >
                <div
                    className={`w-[95%] max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-full transition-all duration-300 ${scrolled ? "glass-panel bg-space-900/40" : "bg-transparent"
                        }`}
                >
                    {/* Logo */}
                    <Link href="/" className="relative flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center">
                            <span className="text-white font-bold text-lg leading-none">K</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tighter text-white group-hover:text-glow transition-all">
                            KK<span className="text-brand-primary">Shop</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/cosmetics" className="text-sm font-medium text-white/80 hover:text-brand-primary transition-colors">
                            Cosmetics
                        </Link>
                        <Link href="/living" className="text-sm font-medium text-white/80 hover:text-brand-accent transition-colors">
                            Living
                        </Link>
                        <Link href="/about" className="text-sm font-medium text-white/80 hover:text-brand-secondary transition-colors">
                            About
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Language Selector */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/5 transition-colors text-sm text-white/90"
                            >
                                <Globe className="w-4 h-4" />
                                <span>{currentLang?.label}</span>
                            </button>

                            {/* Dropdown — CSS transition */}
                            <div
                                className={`absolute right-0 mt-2 w-32 py-2 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden transition-all duration-200 origin-top-right ${langOpen
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
                                        className={`px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${currentLang?.code === lang.code ? "text-brand-primary font-medium" : "text-white/80"
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* User Login */}
                        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 hover:text-brand-secondary border border-white/10 transition-all text-white/80">
                            <User className="w-4 h-4" />
                        </button>

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
                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Mobile Menu — CSS transition overlay */}
            <div
                className={`fixed inset-0 z-[60] transition-all duration-300 ${mobileMenuOpen
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                    }`}
            >
                <div className="absolute inset-0 glass-panel bg-space-900/95 flex flex-col p-6">
                    <div className="flex items-center justify-between mb-8">
                        <span className="text-2xl font-bold tracking-tighter text-white">
                            KK<span className="text-brand-primary">Shop</span>
                        </span>
                        <button
                            className="p-2 text-white/60 hover:text-white transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex flex-col gap-6 text-xl">
                        <Link href="/cosmetics" className="text-white hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Cosmetics</Link>
                        <Link href="/living" className="text-white hover:text-brand-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>Living</Link>
                        <Link href="/about" className="text-white hover:text-brand-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>About</Link>
                    </nav>

                    <div className="mt-auto flex flex-col gap-4">
                        <p className="text-sm text-white/40 mb-2">Language / 언어</p>
                        <div className="grid grid-cols-2 gap-2">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`py-3 rounded-xl border transition-colors ${language === lang.code
                                        ? "bg-brand-primary/20 border-brand-primary text-brand-primary"
                                        : "border-white/10 text-white/70 hover:bg-white/5"
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
