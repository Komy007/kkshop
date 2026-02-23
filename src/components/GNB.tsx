"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, User, ShoppingCart, Menu, X } from "lucide-react";

const LANGUAGES = [
    { code: "ko", label: "한국어" },
    { code: "en", label: "English" },
    { code: "km", label: "ភាសាខ្មែរ" },
    { code: "zh", label: "中文" },
];

export default function GNB() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState(LANGUAGES[0]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-300 ${scrolled ? "pt-2 pb-2" : "pt-6"
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
                        <div className="relative">
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/5 transition-colors text-sm text-white/90"
                            >
                                <Globe className="w-4 h-4" />
                                <span>{currentLang?.label}</span>
                            </button>

                            <AnimatePresence>
                                {langOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-32 py-2 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden"
                                    >
                                        {LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setCurrentLang(lang);
                                                    setLangOpen(false);
                                                }}
                                                className={`px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${currentLang?.code === lang.code ? "text-brand-primary font-medium" : "text-white/80"
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User Login */}
                        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 hover:text-brand-secondary border border-white/10 transition-all text-white/80">
                            <User className="w-4 h-4" />
                        </button>

                        {/* Cart */}
                        <button className="relative flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
                            <ShoppingCart className="w-4 h-4" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-secondary text-[9px] font-bold flex items-center justify-center">
                                0
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
            </motion.header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] glass-panel bg-space-900/95 flex flex-col p-6"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-2xl font-bold tracking-tighter text-white">
                                KK<span className="text-brand-primary">Shop</span>
                            </span>
                            <button
                                className="p-2 text-white/60 hover:text-white"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-6 text-xl">
                            <Link href="/cosmetics" className="text-white hover:text-brand-primary" onClick={() => setMobileMenuOpen(false)}>Cosmetics</Link>
                            <Link href="/living" className="text-white hover:text-brand-accent" onClick={() => setMobileMenuOpen(false)}>Living</Link>
                            <Link href="/about" className="text-white hover:text-brand-secondary" onClick={() => setMobileMenuOpen(false)}>About</Link>
                        </nav>

                        <div className="mt-auto flex flex-col gap-4">
                            <p className="text-sm text-white/40 mb-2">Language / 언어</p>
                            <div className="grid grid-cols-2 gap-2">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setCurrentLang(lang);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`py-3 rounded-xl border ${currentLang?.code === lang.code
                                            ? "bg-brand-primary/20 border-brand-primary text-brand-primary"
                                            : "border-white/10 text-white/70 hover:bg-white/5"
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
