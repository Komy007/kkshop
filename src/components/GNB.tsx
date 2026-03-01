"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Globe, User, ShoppingCart, Menu, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useCartStore, selectTotalItems } from "@/store/useCartStore";

const LANGUAGES = [
    { code: "ko" as const, label: "한국어", flag: "🇰🇷" },
    { code: "en" as const, label: "English", flag: "🇺🇸" },
    { code: "km" as const, label: "ភាសាខ្មែរ", flag: "🇰🇭" },
    { code: "zh" as const, label: "中文", flag: "🇨🇳" },
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
                        <Link href="/cosmetics" className="text-sm font-bold text-gray-700 hover:text-brand-primary transition-colors">
                            Cosmetics
                        </Link>
                        <Link href="/living" className="text-sm font-bold text-gray-700 hover:text-brand-secondary transition-colors">
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
                                        className={`px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors ${currentLang?.code === lang.code ? "text-brand-primary font-bold" : "text-gray-700"
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* User Login */}
                        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-gray-300 hover:text-brand-primary transition-all text-gray-700 shadow-sm">
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
                                    className={`px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${currentLang?.code === lang.code ? "bg-brand-primary/5 text-brand-primary font-bold" : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <span>{lang.flag} {lang.label}</span>
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
