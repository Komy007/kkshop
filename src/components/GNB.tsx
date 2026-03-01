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
                    className={`w-[95%] max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-full transition-all duration-300 ${scrolled ? "glass-panel bg-white/90 border border-gray-100 shadow-sm" : "bg-transparent"
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
                    <button
                        className="md:hidden flex items-center gap-1.5 p-1 px-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm text-gray-700"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="text-base leading-none mt-0.5">{currentLang?.flag}</span>
                        <Menu className="w-5 h-5 text-gray-700" />
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
                <div className="absolute inset-0 bg-white flex flex-col p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <span className="text-2xl font-bold tracking-tighter">
                            <span className="text-gray-900">KK</span>
                            <span className="text-[#Ef4444]">S</span>
                            <span className="text-[#EAB308]">h</span>
                            <span className="text-[#22C55E]">o</span>
                            <span className="text-[#38BDF8]">p</span>
                        </span>
                        <button
                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Mobile Menu Body - Only Languages and About Us */}
                    <div className="flex flex-col flex-1 mt-6">
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center justify-between w-full py-4 px-5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-gray-500" />
                                    <span className="text-lg font-bold">언어 선택 ({currentLang?.label})</span>
                                </div>
                                <span className="text-gray-400 text-xs">{langOpen ? '▲' : '▼'}</span>
                            </button>

                            {langOpen && (
                                <div className="flex flex-col px-2 py-1 bg-gray-50 rounded-2xl border border-gray-200 mb-2">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code);
                                                setLangOpen(false);
                                            }}
                                            className={`py-3 px-4 flex items-center justify-between transition-all rounded-xl ${language === lang.code
                                                ? "bg-brand-primary/10 text-brand-primary font-bold"
                                                : "text-gray-600 hover:bg-white"
                                                }`}
                                        >
                                            <span className="text-base">{lang.flag} {lang.label}</span>
                                            {language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pushed to the bottom */}
                        <div className="mt-auto pb-4">
                            <div className="h-px w-full bg-gray-200 mb-6" />
                            <Link
                                href="/about"
                                className="flex items-center justify-between w-full py-4 px-5 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors group"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">회사 소개 (About Us)</span>
                                    <span className="text-xs text-gray-500 mt-1">회사 소개 및 철학</span>
                                </div>
                                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
