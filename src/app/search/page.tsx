'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search as SearchIcon, X, Star } from 'lucide-react';
import { useAppStore, useSafeAppStore } from '@/store/useAppStore';
import { type TranslatedProduct } from '@/lib/api';
import Footer from '@/components/Footer';

type LanguageKey = 'ko' | 'en' | 'km' | 'zh';

const searchTranslations: Record<LanguageKey, Record<string, string>> = {
    ko: {
        placeholder: '검색어를 입력하세요',
        recent: '최근 검색어',
        popular: '인기 카테고리',
        clear: '전체 삭제',
        noResults: '에 대한 검색 결과가 없습니다.',
        allProducts: '전체 상품',
        productsFound: '개의 상품',
    },
    en: {
        placeholder: 'Search products',
        recent: 'Recent Searches',
        popular: 'Popular Categories',
        clear: 'Clear All',
        noResults: 'No results found for',
        allProducts: 'All Products',
        productsFound: 'products found',
    },
    km: {
        placeholder: 'ស្វែងរកផលិតផល',
        recent: 'ការស្វែងរកថ្មីៗ',
        popular: 'ប្រភេទពេញនិយម',
        clear: 'លុបទាំងអស់',
        noResults: 'រកមិនឃើញលទ្ធផលសម្រាប់',
        allProducts: 'ផលិតផលទាំងអស់',
        productsFound: 'ផលិតផលរកឃើញ',
    },
    zh: {
        placeholder: '搜索商品',
        recent: '最近搜索',
        popular: '热门分类',
        clear: '清除全部',
        noResults: '没有找到相关结果：',
        allProducts: '全部商品',
        productsFound: '个商品',
    },
};

// Popular category tags - multilingual, linking to category pages
const popularCategories: Record<LanguageKey, { label: string; href: string }[]> = {
    ko: [
        { label: '스킨케어', href: '/category/skincare' },
        { label: '메이크업', href: '/category/makeup' },
        { label: '헤어/바디', href: '/category/hair-body' },
        { label: '생활용품', href: '/category/living' },
        { label: '건강식품', href: '/category/health' },
        { label: '신상품', href: '/category/new' },
        { label: '베스트', href: '/category/best' },
        { label: '할인', href: '/category/sale' },
    ],
    en: [
        { label: 'Skincare', href: '/category/skincare' },
        { label: 'Makeup', href: '/category/makeup' },
        { label: 'Hair/Body', href: '/category/hair-body' },
        { label: 'Living', href: '/category/living' },
        { label: 'Health', href: '/category/health' },
        { label: 'New Arrivals', href: '/category/new' },
        { label: 'Bestsellers', href: '/category/best' },
        { label: 'Sale', href: '/category/sale' },
    ],
    km: [
        { label: 'ថែស្បែក', href: '/category/skincare' },
        { label: 'គ្រឿងសំអាង', href: '/category/makeup' },
        { label: 'សក់/រាងកាយ', href: '/category/hair-body' },
        { label: 'គ្រឿងប្រើប្រាស់', href: '/category/living' },
        { label: 'សុខភាព', href: '/category/health' },
        { label: 'ផលិតផលថ្មី', href: '/category/new' },
        { label: 'ពេញនិយម', href: '/category/best' },
        { label: 'បញ្ចុះតម្លៃ', href: '/category/sale' },
    ],
    zh: [
        { label: '护肤', href: '/category/skincare' },
        { label: '彩妆', href: '/category/makeup' },
        { label: '洗护', href: '/category/hair-body' },
        { label: '生活用品', href: '/category/living' },
        { label: '保健品', href: '/category/health' },
        { label: '新品', href: '/category/new' },
        { label: '热销', href: '/category/best' },
        { label: '折扣', href: '/category/sale' },
    ],
};

export default function SearchPage() {
    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
    const lang = (language as LanguageKey) in searchTranslations ? (language as LanguageKey) : 'en';
    const t = searchTranslations[lang];
    const categories = popularCategories[lang];

    const [query, setQuery] = useState('');
    const [displayed, setDisplayed] = useState<TranslatedProduct[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try { setRecentSearches(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    // Server-side search with debounce
    const fetchProducts = useCallback(async (searchTerm: string) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ lang: language, limit: '100' });
            if (searchTerm.trim()) params.set('search', searchTerm.trim());
            const res = await fetch(`/api/products?${params}`);
            if (res.ok) {
                const json = await res.json();
                const list: TranslatedProduct[] = Array.isArray(json) ? json : (json.products ?? []);
                setDisplayed(list);
                setTotal(json.total ?? list.length);
            }
        } catch (e) {
            console.error('Failed to fetch products', e);
        } finally {
            setIsLoading(false);
        }
    }, [language]);

    // Initial load
    useEffect(() => {
        fetchProducts('');
    }, [fetchProducts]);

    // Debounced search on keystroke (300ms)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchProducts(query);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, fetchProducts]);

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
        if (query.trim()) saveSearch(query.trim());
        fetchProducts(query);
    };

    return (
        <main className="min-h-screen bg-white text-gray-900 pb-24">
            {/* Sticky Search Bar */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <Link href="/" className="p-1 -ml-1 text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
                    <SearchIcon className="absolute left-3 w-4 h-4 text-gray-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full bg-gray-100 border-2 border-transparent focus:bg-white focus:border-brand-primary rounded-xl py-2.5 pl-9 pr-10 outline-none text-base font-bold text-gray-900 transition-all"
                        autoFocus
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery('')} className="absolute right-3 p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </form>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !query && (
                <div className="px-4 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-extrabold text-gray-900 text-sm">{t.recent}</h2>
                        <button onClick={clearRecent} className="text-xs font-bold text-gray-400 hover:text-gray-600">{t.clear}</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {recentSearches.map(s => (
                            <button
                                key={s}
                                onClick={() => setQuery(s)}
                                className="px-3 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Popular Category Tags */}
            {!query && (
                <div className="px-4 pt-2 pb-3 border-b border-gray-100">
                    <h2 className="font-extrabold text-gray-900 text-sm mb-2">{t.popular}</h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <Link
                                key={cat.href}
                                href={cat.href}
                                className="px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-bold hover:bg-brand-primary/20 transition-colors"
                            >
                                {cat.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Product Grid — always shown (all products or filtered) */}
            <div className="bg-gray-50 min-h-screen pt-4 pb-20">
                {query && (
                    <div className="px-4 mb-3 text-sm font-bold text-gray-600">
                        <span className="text-black text-base">'{query}'</span> — {displayed.length} {t.productsFound}
                    </div>
                )}
                {!query && (
                    <div className="px-4 mb-3 text-sm font-extrabold text-gray-900">{t.allProducts} ({displayed.length})</div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="text-center py-24 px-4">
                        <div className="text-6xl mb-4 opacity-30 grayscale">🔍</div>
                        <p className="text-gray-500 font-medium">'{query}' {t.noResults}</p>
                    </div>
                ) : (
                    <div className="px-4 max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {displayed.map((product) => (
                            <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all border border-gray-200">
                                <div className="aspect-[4/5] relative w-full bg-gray-100 overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">✨</div>
                                    )}
                                    {product.isHotSale && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <span className="bg-[#E52528] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">SALE</span>
                                        </div>
                                    )}
                                    {product.isNew && !product.isHotSale && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">NEW</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 flex flex-col flex-1">
                                    {(product.brandName || (product.origin && /korea/i.test(product.origin))) && (
                                        <div className="flex items-center gap-1 mb-0.5">
                                            {product.brandName && (
                                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide truncate">{product.brandName}</span>
                                            )}
                                            {product.origin && /korea/i.test(product.origin) && (
                                                <span className="text-[9px] bg-rose-50 text-rose-600 font-bold px-1 py-px rounded-full whitespace-nowrap">🇰🇷</span>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-800 leading-snug line-clamp-2 min-h-[40px] font-bold mb-2 group-hover:text-brand-primary transition-colors">
                                        {product.name}
                                    </p>
                                    <div className="mt-auto">
                                        <div className="flex flex-col">
                                            {product.isHotSale && product.hotSalePrice ? (
                                                <>
                                                    <span className="text-xs text-gray-400 line-through mb-0.5">
                                                        ${Number(product.priceUsd).toFixed(2)}
                                                    </span>
                                                    <span className="text-lg font-extrabold text-[#E52528] leading-none">
                                                        ${Number(product.hotSalePrice).toFixed(2)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-lg font-extrabold text-gray-900 leading-none">
                                                    ${Number(product.priceUsd).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {product.reviewCount > 0 && (
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-sm" />
                                                <span className="text-xs font-bold text-gray-700">{Number(product.reviewAvg).toFixed(1)}</span>
                                                <span className="text-xs text-gray-400">({product.reviewCount})</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </main>
    );
}
