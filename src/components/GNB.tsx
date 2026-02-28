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
                        <span className="text-2xl font-bold tracking-tighter group-hover:text-glow transition-all">
                            <span className="text-white">KK</span>
                            <span className="text-[#Ef4444]">S</span>
                            <span className="text-[#EAB308]">h</span>
                            <span className="text-[#22C55E]">o</span>
                            <span className="text-[#38BDF8]">p</span>
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
                        <span className="text-2xl font-bold tracking-tighter">
                            <span className="text-white">KK</span>
                            <span className="text-[#Ef4444]">S</span>
                            <span className="text-[#EAB308]">h</span>
                            <span className="text-[#22C55E]">o</span>
                            <span className="text-[#38BDF8]">p</span>
                        </span>
                        <button
                            className="p-2 text-white/60 hover:text-white transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Mobile Menu Body - Only Languages and About Us */}
                    <div className="flex flex-col flex-1 mt-6">
                        <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">Select Language</p>
                        <div className="flex flex-col gap-3">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`py-4 px-5 rounded-2xl border flex items-center justify-between transition-all ${language === lang.code
                                        ? "bg-brand-primary/20 border-brand-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                        : "border-white/10 text-white/70 hover:bg-white/10"
                                        }`}
                                >
                                    <span className={`text-lg ${language === lang.code ? "font-bold" : "font-medium"}`}>{lang.label}</span>
                                    {language === lang.code && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                                </button>
                            ))}
                        </div>

                        {/* Pushed to the bottom */}
                        <div className="mt-auto pb-4">
                            <div className="h-px w-full bg-white/10 mb-6" />
                            <Link
                                href="/about"
                                className="flex items-center justify-between w-full py-4 px-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">About Us</span>
                                    <span className="text-xs text-white/50 mt-1">회사 소개 및 철학</span>
                                </div>
                                <span className="text-white/40 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
