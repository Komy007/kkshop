'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MessageCircle, ShieldCheck, Sparkles, MapPin, Store, Check } from 'lucide-react';

export default function AboutPage() {
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
                        <span className="text-xs font-semibold tracking-widest text-blue-200 uppercase">Cambodia's #1 Korean Shopping Platform</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black mb-5 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">KK</span>
                        <span className="text-white">Shop</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-200 font-semibold leading-relaxed mb-3">
                        100% Authentic Korean Cosmetics &amp;<br className="hidden sm:block" /> Korean-Quality Products — Delivered to Your Door
                    </p>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        캄보디아 NO.1 한국 쇼핑 플랫폼 · 정품 한국 화장품 · 집 앞까지 배송
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                        {[
                            '🇰🇷 100% Made in Korea (Cosmetics)',
                            '✅ Korean Quality Verified',
                            '🏠 Home Delivery in Cambodia',
                        ].map(t => (
                            <span key={t} className="text-xs glass-card px-3 py-1.5 rounded-full text-gray-300 font-medium">{t}</span>
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
                        <h2 className="text-2xl sm:text-4xl font-bold mb-4">
                            100% Authentic Korean Cosmetics
                        </h2>
                        <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">
                            Every single beauty and skincare product on KKShop is <strong className="text-white">manufactured in South Korea</strong>.
                            No compromises. No imitations. We guarantee origin authenticity — protecting your skin with genuine K-Beauty only.
                        </p>
                        <p className="text-gray-500 text-sm mt-3">
                            모든 뷰티·스킨케어 상품은 100% 한국산 정품입니다. 원산지 보증을 철저히 지킵니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: '🇰🇷', title: 'Made in Korea', desc: 'Cosmetics & skincare sourced directly from Korean manufacturers' },
                            { icon: '🔬', title: 'Lab Tested', desc: 'Products meet Korean MFDS safety standards for skin health' },
                            { icon: '💯', title: 'No Counterfeits', desc: 'Zero tolerance for replicas or products of unknown origin' },
                        ].map(item => (
                            <div key={item.title} className="glass-card rounded-2xl p-5 flex flex-col gap-3">
                                <span className="text-3xl">{item.icon}</span>
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
                        <h2 className="text-2xl sm:text-4xl font-bold mb-4">
                            Korean-Quality Verified Products
                        </h2>
                        <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">
                            Beyond cosmetics, we offer daily lifestyle products that pass the <strong className="text-white">strict standards Korean consumers demand</strong>.
                            Regardless of country of manufacture — if Koreans trust it and use it daily, we bring it to Cambodia at the best price.
                        </p>
                        <p className="text-gray-500 text-sm mt-3">
                            화장품 외 생활용품은 한국인이 직접 사용하며 검증한 가성비 우수 제품만 엄선합니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass-card rounded-2xl p-6 sm:col-span-2 flex items-center gap-5">
                            <span className="text-4xl flex-shrink-0">🏆</span>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-1">Koreans&apos; Pick</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Trending products hand-selected by Koreans who care about quality. From home goods and electronics accessories to everyday essentials — curated, tested, and loved in Korea before reaching Cambodia.
                                </p>
                            </div>
                        </div>
                        {[
                            { emoji: '🏠', title: 'Smart Home & Living', desc: 'Functional, well-designed home products Koreans actually use' },
                            { emoji: '💰', title: 'Best Value Price', desc: 'Korean market pricing standards applied — quality without overpaying' },
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
                            <h2 className="text-2xl sm:text-4xl font-bold mb-4">
                                Quality Delivered to Your Home in Cambodia
                            </h2>
                            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
                                <strong className="text-white">Cambodia can now receive authentic Korean products without going abroad.</strong>{' '}
                                Shop from your smartphone. We deliver directly to your door — anywhere in Cambodia.
                                No import hassle, no middlemen, no fakes.
                            </p>
                            <p className="text-gray-500 text-sm mb-8">
                                이제 캄보디아에서도 집에서 한국 정품을 편리하게 받아볼 수 있습니다.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {[
                                    'Phnom Penh Delivery',
                                    'Nationwide Shipping',
                                    'Fast & Safe Packaging',
                                    'Order by Phone',
                                ].map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-full font-medium">
                                        <Check className="w-3 h-3" />{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
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
                                Coming Soon
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Korean Mart Category</h2>
                            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                                We&apos;re expanding! Authentic Korean food, instant noodles, snacks, household goods, and grocery items from Korean supermarkets — coming to KKShop soon.
                                Everything from ramyeon to kitchen essentials, delivered to your Cambodian home.
                            </p>
                            <p className="text-gray-500 text-xs mt-2">한국 식품·생필품 카테고리 추가 예정입니다.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Contact ── */}
            <section className="py-20 px-6 bg-gray-900 border-t border-white/5">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
                        <p className="text-gray-400 text-sm">Questions? We reply fast — in English, Korean, and Khmer.</p>
                        <p className="text-gray-500 text-xs mt-1">문의사항은 빠르게 답변드립니다.</p>
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

                        <a href="tel:+85595779873" className="glass-card p-5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all active:scale-[0.98]">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base">Call / WhatsApp (EN · KH · KO)</h4>
                                <p className="text-gray-400 font-mono text-sm mt-0.5">+855 95 779 873</p>
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
