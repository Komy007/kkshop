'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle, ShieldCheck, Sparkles, MapPin, Store, Check, Handshake, FileCheck } from 'lucide-react';
import TaegukgiIcon from '@/components/TaegukgiIcon';
import { useTranslations } from '@/i18n/useTranslations';

export default function AboutPage() {
    const t = useTranslations().about;

    return (
        <main className="min-h-screen bg-gray-900 text-white overflow-x-hidden">

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes floatUp {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                .float-anim { animation: floatUp 5s ease-in-out infinite; }
                .glass-card {
                    background: rgba(255,255,255,0.05);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .grid-bg {
                    background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
                    background-size: 28px 28px;
                }
            `}} />

            {/* Back Nav */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center bg-gradient-to-b from-gray-900/80 to-transparent pointer-events-none">
                <Link href="/" className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full glass-card hover:bg-white/10 transition-colors text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>

            {/* ── Hero ── */}
            <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden grid-bg">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-gray-900/60 to-gray-900 z-0" />
                {/* Big KK glow */}
                <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10 pointer-events-none select-none overflow-hidden">
                    <span className="text-[45vw] font-black text-blue-400 float-anim">KK</span>
                </div>

                <div className="relative z-10 text-center max-w-2xl mx-auto mt-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-5">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-xs font-semibold tracking-widest text-blue-200 uppercase">{t.badge}</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black mb-5 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">KK</span>
                        <span className="text-white">Shop</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-200 font-semibold leading-relaxed mb-3">
                        {t.heroSubtitle}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                        {[
                            { node: <><TaegukgiIcon className="inline-block w-5 h-[13px] align-middle mr-1" />100% Made in Korea (Cosmetics)</> },
                            { node: <>✅ Korean Quality Verified</> },
                            { node: <>🏠 Home Delivery in Cambodia</> },
                        ].map((item, i) => (
                            <span key={i} className="text-xs glass-card px-3 py-1.5 rounded-full text-gray-300 font-medium">{item.node}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 1: K-Beauty 100% Korean ── */}
            <section className="py-20 px-6 bg-gray-900">
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                            <ShieldCheck className="w-7 h-7 text-blue-400" />
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold mb-4">{t.sec1Title}</h2>
                        <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">{t.sec1Desc}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: <TaegukgiIcon className="w-10 h-[27px]" />, title: t.card1Title, desc: t.card1Desc },
                            { icon: <span className="text-3xl">🔬</span>, title: t.card2Title, desc: t.card2Desc },
                            { icon: <span className="text-3xl">💯</span>, title: t.card3Title, desc: t.card3Desc },
                        ].map(item => (
                            <div key={item.title} className="glass-card rounded-2xl p-5 flex flex-col gap-3">
                                <span>{item.icon}</span>
                                <div>
                                    <h3 className="font-bold text-white text-base mb-1">{item.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 2: Korean-Verified Quality ── */}
            <section className="py-20 px-6 bg-gray-950">
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4">
                            <Sparkles className="w-7 h-7 text-amber-400" />
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold mb-4">{t.sec2Title}</h2>
                        <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">{t.sec2Desc}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass-card rounded-2xl p-6 sm:col-span-2 flex items-center gap-5">
                            <span className="text-4xl flex-shrink-0">🏆</span>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-1">{t.card4Title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{t.card4Desc}</p>
                            </div>
                        </div>
                        {[
                            { emoji: '🏠', title: t.card5Title, desc: t.card5Desc },
                            { emoji: '💰', title: t.card6Title, desc: t.card6Desc },
                        ].map(item => (
                            <div key={item.title} className="glass-card rounded-2xl p-6 flex flex-col gap-3">
                                <span className="text-3xl">{item.emoji}</span>
                                <div>
                                    <h3 className="font-bold text-white text-base mb-1">{item.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 3: Cambodia Home Delivery ── */}
            <section className="py-20 px-6 bg-gray-900">
                <div className="max-w-3xl mx-auto">
                    <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/5 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4 mx-auto">
                                <MapPin className="w-7 h-7 text-cyan-400" />
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-bold mb-4">{t.sec3Title}</h2>
                            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
                                {t.sec3Desc}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {[t.tag1, t.tag2, t.tag3, t.tag4].map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-full font-medium">
                                        <Check className="w-3 h-3" />{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section: Seller Marketplace ── */}
            <section className="py-20 px-6 bg-gray-950">
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4">
                            <Handshake className="w-7 h-7 text-purple-400" />
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold mb-4">{t.sellerTitle}</h2>
                        <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">{t.sellerDesc}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {[
                            { emoji: <><TaegukgiIcon className="w-10 h-[27px]" /></>, title: t.sellerCard1Title, desc: t.sellerCard1Desc },
                            { emoji: <span className="text-3xl">✅</span>, title: t.sellerCard2Title, desc: t.sellerCard2Desc },
                            { emoji: <span className="text-3xl">🏪</span>, title: t.sellerCard3Title, desc: t.sellerCard3Desc },
                            { emoji: <FileCheck className="w-8 h-8 text-amber-400" />, title: t.sellerCard4Title, desc: t.sellerCard4Desc },
                        ].map(item => (
                            <div key={item.title} className="glass-card rounded-2xl p-6 flex flex-col gap-3">
                                <span>{item.emoji}</span>
                                <div>
                                    <h3 className="font-bold text-white text-base mb-1">{item.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link href="/seller/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-full transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.97]">
                            <Store className="w-5 h-5" />
                            {t.sellerCta}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Section 4: Coming Soon - Korean Mart ── */}
            <section className="py-16 px-6 bg-gray-950">
                <div className="max-w-3xl mx-auto">
                    <div className="glass-card rounded-3xl p-7 flex items-start gap-5 border border-emerald-500/20">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Store className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full mb-2 uppercase tracking-wider">
                                {t.sec4Badge}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t.sec4Title}</h2>
                            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{t.sec4Desc}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Contact ── */}
            <section className="py-20 px-6 bg-gray-900 border-t border-white/5">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">{t.contactTitle}</h2>
                        <p className="text-gray-400 text-sm">{t.contactDesc}</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <a href="mailto:help@kkshop.cc" className="glass-card p-5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all active:scale-[0.98]">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base">Email Support</h4>
                                <p className="text-gray-400 font-mono text-sm mt-0.5">help@kkshop.cc</p>
                            </div>
                        </a>

                        <div className="grid grid-cols-2 gap-4">
                            <a href="https://t.me/kkshop_cc" target="_blank" rel="noopener noreferrer" className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all text-center">
                                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">Telegram</span>
                                    <span className="text-gray-500 text-xs">@kkshop_cc</span>
                                </div>
                            </a>
                            <a href="https://m.me/kkshopcc" target="_blank" rel="noopener noreferrer" className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all text-center">
                                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">Messenger</span>
                                    <span className="text-gray-500 text-xs">kkshopcc</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
