'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MessageCircle } from 'lucide-react';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-gray-900 text-white overflow-x-hidden selection:bg-brand-primary selection:text-white">

            {/* Custom CSS for Zero-Gravity, Parallax, and Pop-out Effects */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes floatLeft {
                    0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
                    50% { transform: translateY(-20px) translateX(10px) rotate(5deg); }
                }
                @keyframes floatRight {
                    0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
                    50% { transform: translateY(15px) translateX(-15px) rotate(-5deg); }
                }
                .anti-gravity-left {
                    animation: floatLeft 6s ease-in-out infinite;
                }
                .anti-gravity-right {
                    animation: floatRight 7s ease-in-out infinite;
                }
                
                .pop-out-container:hover .pop-out-item {
                    transform: translateZ(50px) scale(1.05);
                    filter: drop-shadow(0 20px 30px rgba(56, 189, 248, 0.4));
                }
                .perspective-wrapper {
                    perspective: 1000px;
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                /* Subdued Parallax grid effect for mobile */
                .parallax-grid {
                    background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: 30px 30px;
                    background-attachment: fixed;
                }
            `}} />

            {/* Back Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6 flex items-center bg-gradient-to-b from-gray-900/80 to-transparent pointer-events-none">
                <Link href="/" className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full glass-card hover:bg-white/10 transition-colors text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>

            {/* Hero Section: Brand Identity */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden parallax-grid">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-gray-900 to-gray-900 z-0" />

                {/* Floating "K" Graphics */}
                <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20 pointer-events-none overflow-hidden">
                    <span className="text-[35vw] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 anti-gravity-left -mr-[10vw]">K</span>
                    <span className="text-[35vw] font-black text-transparent bg-clip-text bg-gradient-to-l from-red-500 to-orange-500 anti-gravity-right -ml-[10vw]">K</span>
                </div>

                <div className="relative z-10 text-center max-w-2xl mx-auto mt-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-sm font-medium tracking-widest text-blue-200 uppercase">Premium Cross-Border</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black mb-6 leading-tight tracking-tight animate-fade-in-up [animation-delay:100ms]">
                        Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">Khmer</span><br />
                        Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Korea</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-medium animate-fade-in-up [animation-delay:200ms]">
                        캄보디아의 역동적인 라이프스타일과 한국의 깐깐한 품질 기준이 만나는 곳, KKShop에 오신 것을 환영합니다.
                    </p>
                </div>
            </section>

            {/* Section 1: Our Promise 1 - K-Beauty */}
            <section className="py-24 px-6 relative bg-gray-900">
                <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                    <h2 className="text-3xl sm:text-5xl font-bold mb-6">100% Authentic K-Beauty</h2>
                    <p className="text-gray-400 text-[17px] sm:text-lg leading-relaxed max-w-2xl mb-16">
                        KKShop의 모든 뷰티 제품은 100% 한국에서 생산된 정품만을 고집합니다. 타협하지 않는 원칙으로 캄보디아 고객님들의 피부에 가장 안전하고 투명한 아름다움을 선사합니다.
                    </p>

                    {/* Pop-out 3D Effect Container */}
                    <div className="perspective-wrapper w-full max-w-sm mx-auto">
                        <div className="pop-out-container relative aspect-square rounded-3xl bg-gradient-to-br from-blue-900/50 to-cyan-900/20 p-8 flex items-center justify-center transition-transform duration-500 ease-out preserve-3d">
                            {/* Abstract Waterdrop / Ampoule representation */}
                            <div className="pop-out-item relative w-3/4 h-3/4 rounded-full bg-gradient-to-tr from-cyan-400/80 to-blue-300/80 backdrop-blur-md shadow-[inset_0_-10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all duration-500 ease-out">
                                <div className="absolute top-8 right-8 w-8 h-8 bg-white/60 rounded-full blur-[2px]" />
                                <span className="text-4xl">✨</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Our Promise 2 - Living & Daily */}
            <section className="py-24 px-6 relative bg-gray-950">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-3xl sm:text-5xl font-bold mb-6">Koreans' Pick : Quality & Value</h2>
                    <p className="text-gray-400 text-[17px] sm:text-lg leading-relaxed max-w-2xl mx-auto">
                        제조국이 어디든 상관없습니다. 트렌드에 민감하고 품질에 깐깐한 '한국인들이 실제로 선택하고 사용하는' 최고 수준의 생활용품만을 큐레이션하여 합리적인 가격(가성비)으로 제공합니다.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="glass-card rounded-3xl p-8 sm:col-span-2 flex flex-col justify-end min-h-[300px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[50px] group-hover:bg-orange-500/20 transition-colors" />
                        <h3 className="text-2xl font-bold mb-2 relative z-10">Smart Living</h3>
                        <p className="text-gray-400 relative z-10">실용성과 디자인을 겸비한 홈 인테리어 소품</p>
                    </div>

                    <div className="glass-card rounded-3xl p-8 flex flex-col justify-end min-h-[300px] relative overflow-hidden group">
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-colors" />
                        <h3 className="text-xl font-bold mb-2 relative z-10">Daily Essentials</h3>
                        <p className="text-gray-400 text-sm relative z-10">일상의 질을 높여주는 필수 아이템</p>
                    </div>

                    <div className="glass-card rounded-3xl p-8 sm:col-span-3 flex items-center justify-between overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Unbeatable Price</h3>
                            <p className="text-gray-400">현지 물가를 고려한 최고의 가성비 큐레이션</p>
                        </div>
                        <div className="text-5xl relative z-10 opacity-50 group-hover:scale-110 transition-transform duration-500">
                            🛒
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact & Support Zone */}
            <section className="py-24 px-6 relative bg-gray-900 border-t border-white/5">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold mb-4">고객지원실 (Contact Us)</h2>
                        <p className="text-gray-400 text-[15px]">문의사항이 있으신가요? 빠르고 친절하게 답변해 드립니다.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Email */}
                        <a href="mailto:help@kkshop.cc" className="glass-card p-5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all active:scale-[0.98]">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">이메일 문의</h4>
                                <p className="text-gray-400 font-mono text-sm mt-0.5">help@kkshop.cc</p>
                            </div>
                        </a>

                        {/* Phone */}
                        <a href="tel:+85595779873" className="glass-card p-5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all active:scale-[0.98]">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">전화 상담 (EN/KH)</h4>
                                <p className="text-gray-400 font-mono text-sm mt-0.5">+855 95 779 873</p>
                            </div>
                        </a>

                        {/* Messengers */}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <a href="https://t.me/kkshop_cc" target="_blank" rel="noopener noreferrer" className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all text-center">
                                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-[15px]">Telegram</span>
                            </a>
                            <a href="https://m.me/kkshopcc" target="_blank" rel="noopener noreferrer" className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all text-center">
                                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-[15px]">Messenger</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
