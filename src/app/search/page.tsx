'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search as SearchIcon, X, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { type TranslatedProduct } from '@/lib/api';
import Footer from '@/components/Footer';

type LanguageKey = 'ko' | 'en' | 'km' | 'zh';
const searchTranslations: Record<LanguageKey, Record<string, string>> = {
    ko: {
        placeholder: '검색어를 입력하세요',
        recent: '최근 검색어',
        popular: '인기 검색어',
        clear: '전체 삭제',
        noResults: '에 대한 검색 결과가 없습니다.',
        productsFound: '개의 상품',
    },
    en: {
        placeholder: 'Search products',
        recent: 'Recent Searches',
        popular: 'Popular Searches',
        clear: 'Clear All',
        noResults: 'No results found for',
        productsFound: 'products found',
    },
    km: {
        placeholder: 'ស្វែងរកផលិតផល',
        recent: 'ការស្វែងរកថ្មីៗ',
        popular: 'ការស្វែងរកពេញនិយម',
        clear: 'លុបទាំងអស់',
        noResults: 'រកមិនឃើញលទ្ធផលសម្រាប់',
        productsFound: 'ផលិតផលរកឃើញ',
    },
    zh: {
        placeholder: '搜索商品',
        recent: '最近搜索',
        popular: '热门搜索',
        clear: '清除全部',
        noResults: '没有找到相关结果：',
        productsFound: '个商品',
    },
};

const popularSearches = ['Skincare', 'Makeup', 'Serum', 'Lipstick', 'Cream'];

export default function SearchPage() {
    const { language } = useAppStore();
    const t = searchTranslations[language as LanguageKey] || searchTranslations.en;

    const [query, setQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        // Load recent searches from local storage
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    const saveSearch = (q: string) => {
        if (!q.trim()) return;
        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const clearRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        setSubmittedQuery(query);
        saveSearch(query);
    };

    useEffect(() => {
        if (!submittedQuery) return;

        async function fetchResults() {
            setIsLoading(true);
            try {
                // Fetch all products, then filter client-side for simplicity since the API doesn't support complex search yet
                const res = await fetch(`/api/products?lang=${language}`);
                if (res.ok) {
                    const data: TranslatedProduct[] = await res.json();
                    const filtered = data.filter(p =>
                        p.name.toLowerCase().includes(submittedQuery.toLowerCase()) ||
                        (p.shortDesc && p.shortDesc.toLowerCase().includes(submittedQuery.toLowerCase())) ||
                        (p.detailDesc && p.detailDesc.toLowerCase().includes(submittedQuery.toLowerCase()))
                    );
                    setProducts(filtered);
                }
            } catch (error) {
                console.error('Failed to search products', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchResults();
    }, [submittedQuery, language]);

    return (
        <main className="min-h-screen bg-white text-gray-900 pb-24">
            {/* Header / Search Bar */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <Link href="/" className="p-1 -ml-1 text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full bg-gray-100 border-2 border-transparent focus:bg-white focus:border-brand-primary rounded-xl py-2.5 pl-4 pr-10 outline-none text-base font-bold text-gray-900 transition-all"
                        autoFocus
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery('')} className="absolute right-3 p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </form>
                <button onClick={() => handleSearch()} className="p-1 -mr-1 text-gray-900 font-bold hover:text-brand-primary transition-colors">
                    <SearchIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content Area */}
            {!submittedQuery ? (
                <div className="px-4 py-6 max-w-lg mx-auto space-y-8 animate-fade-in">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-extrabold text-gray-900">{t.recent}</h2>
                                <button onClick={clearRecent} className="text-xs font-bold text-gray-400 hover:text-gray-600">
                                    {t.clear}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setQuery(s);
                                            setSubmittedQuery(s);
                                        }}
                                        className="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Popular Searches */}
                    <section>
                        <h2 className="font-extrabold text-gray-900 mb-3">{t.popular}</h2>
                        <div className="flex flex-wrap gap-2">
                            {popularSearches.map(s => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setQuery(s);
                                        setSubmittedQuery(s);
                                    }}
                                    className="px-4 py-2 rounded-full bg-brand-primary/5 text-brand-primary text-sm font-bold hover:bg-brand-primary/10 transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="bg-gray-50 min-h-screen pt-4 pb-20">
                    <div className="px-4 mb-4 font-bold text-gray-600 text-sm">
                        <span className="text-black text-base ml-1">'{submittedQuery}'</span> {t.productsFound} ({products.length})
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-24 px-4">
                            <div className="text-6xl mb-4 opacity-30 grayscale">🔍</div>
                            <p className="text-gray-500 font-medium">'{submittedQuery}' {t.noResults}</p>
                        </div>
                    ) : (
                        <div className="px-4 max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {products.map((product) => (
                                <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all border border-gray-200">
                                    <div className="aspect-[4/5] relative w-full bg-gray-100 overflow-hidden">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">✨</div>
                                        )}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                                            <span className="bg-[#E52528] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">특가</span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col flex-1">
                                        <p className="text-sm text-gray-800 leading-snug line-clamp-2 min-h-[40px] font-medium mb-3 group-hover:text-brand-primary transition-colors">
                                            {product.name}
                                        </p>

                                        <div className="mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400 line-through mb-0.5">
                                                    $ {(product.priceUsd * 1.5).toFixed(2)}
                                                </span>
                                                <span className="text-lg font-extrabold text-[#E52528] leading-none">
                                                    $ {product.priceUsd.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-2">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-sm" />
                                                <span className="text-xs font-bold text-gray-700">4.9</span>
                                                <span className="text-xs text-gray-400">(128)</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {submittedQuery && <Footer />}
        </main>
    );
}
