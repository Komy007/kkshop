'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 px-4">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-black text-sm">K</div>
                    <span className="font-black text-lg text-gray-900">KKShop</span>
                </Link>
            </div>

            {/* Main content */}
            <div className="text-center max-w-md mx-auto mt-16">
                {/* Big 404 */}
                <div className="relative mb-6">
                    <h1 className="text-[140px] sm:text-[180px] font-black text-gray-100 leading-none select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl">🔍</span>
                    </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                    Page Not Found
                </h2>
                <p className="text-gray-500 mb-2 text-sm sm:text-base">
                    찾으시는 페이지가 없거나 이동되었습니다.
                </p>
                <p className="text-gray-400 text-sm mb-8">
                    The page you are looking for doesn&apos;t exist or has been moved.
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-white font-bold rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-brand-primary/30"
                    >
                        <Home className="w-4 h-4" />
                        홈으로 돌아가기
                    </Link>
                    <Link
                        href="/search"
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        상품 검색
                    </Link>
                </div>

                {/* Shortcuts */}
                <div className="mt-10 pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-4 font-semibold uppercase tracking-wider">Popular Categories</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {[
                            { label: '스킨케어', href: '/category/skincare' },
                            { label: '메이크업', href: '/category/makeup' },
                            { label: '헤어/바디', href: '/category/hair-body' },
                            { label: '생활용품', href: '/category/living' },
                            { label: '신상품', href: '/category/new' },
                            { label: '베스트', href: '/category/best' },
                        ].map(cat => (
                            <Link
                                key={cat.href}
                                href={cat.href}
                                className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm font-semibold hover:border-brand-primary hover:text-brand-primary transition-colors"
                            >
                                {cat.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Back link */}
                <button
                    onClick={() => window.history.back()}
                    className="mt-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mx-auto"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    이전 페이지로
                </button>
            </div>
        </div>
    );
}
