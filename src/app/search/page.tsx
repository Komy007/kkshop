'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search as SearchIcon, X, Star, ChevronDown } from 'lucide-react';
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

    const PAGE_SIZE = 24;
    const sortLabels: Record<string, string> = {
        '': lang === 'ko' ? '추천순' : lang === 'km' ? 'ផ្សេងៗ' : lang === 'zh' ? '推荐' : 'Recommended',
        newest: lang === 'ko' ? '최신순' : lang === 'km' ? 'ថ្មីបំផុត' : lang === 'zh' ? '最新' : 'Newest',
        price_asc: lang === 'ko' ? '낮은 가격순' : lang === 'km' ? 'តម្លៃទាប→ខ្ពស់' : lang === 'zh' ? '价格低→高' : 'Price: Low→High',
        price_desc: lang === 'ko' ? '높은 가격순' : lang === 'km' ? 'តម្លៃខ្ពស់→ទាប' : lang === 'zh' ? '价格高→低' : 'Price: High→Low',
        rating: lang === 'ko' ? '평점순' : lang === 'km' ? 'ពិន្ទុខ្ពស់' : lang === 'zh' ? '评分最高' : 'Top Rated',
    };
    const loadMoreLabel = lang === 'ko' ? '더 보기' : lang === 'km' ? 'ផ្ទុកបន្ថែម' : lang === 'zh' ? '加载更多' : 'Load More';

    const [query, setQuery] = useState('');
    const [displayed, setDisplayed] = useState<TranslatedProduct[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [sort, setSort] = useState('');
    const [showSort, setShowSort] = useState(false);
    const [page, setPage] = useState(0);
    const [suggestions, setSuggestions] = useState<{ brands: string[]; products: { id: string; name: string }[] }>({ brands: [], products: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const suggestRef = useRef<ReturnType<typeof setTimeout>>();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try { setRecentSearches(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    // Server-side search
    const fetchProducts = useCallback(async (searchTerm: string, skip: number, append: boolean) => {
        append ? setIsLoadingMore(true) : setIsLoading(true);
        try {
            const params = new URLSearchParams({ lang: language, limit: String(PAGE_SIZE), skip: String(skip) });
            if (searchTerm.trim()) params.set('search', searchTerm.trim());
            if (sort) params.set('sort', sort);
            const res = await fetch(`/api/products?${params}`);
            if (res.ok) {
                const json = await res.json();
                const list: TranslatedProduct[] = Array.isArray(json) ? json : (json.products ?? []);
                setDisplayed(prev => append ? [...prev, ...list] : list);
                setTotal(json.total ?? list.length);
            }
        } catch (e) {
            console.error('Failed to fetch products', e);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [language, sort]);

    // Initial load & on sort change
    useEffect(() => {
        setPage(0);
        fetchProducts(query, 0, false);
    }, [sort, language]);

    // Debounced search on keystroke (300ms)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(0);
            fetchProducts(query, 0, false);
            setShowSuggestions(false);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    // Autocomplete suggestions (150ms debounce, fires faster)
    useEffect(() => {
        if (suggestRef.current) clearTimeout(suggestRef.current);
        if (!query.trim() || query.trim().length < 2) {
            setSuggestions({ brands: [], products: [] });
            setShowSuggestions(false);
            return;
        }
        suggestRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(query.trim())}&lang=${language}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                    if (data.brands.length > 0 || data.products.length > 0) {
                        setShowSuggestions(true);
                    }
                }
            } catch { /* ignore */ }
        }, 150);
        return () => { if (suggestRef.current) clearTimeout(suggestRef.current); };
    }, [query, language]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(query, nextPage * PAGE_SIZE, true);
    };

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

                {/* Autocomplete Suggestions */}
                {showSuggestions && (suggestions.brands.length > 0 || suggestions.products.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-1 mx-4 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 max-h-[300px] overflow-y-auto">
                        {suggestions.brands.length > 0 && (
                            <div className="px-3 pb-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Brands</p>
                                {suggestions.brands.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => { setQuery(b); setShowSuggestions(false); }}
                                        className="block w-full text-left px-2 py-1.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                    >
                                        🏷️ {b}
                                    </button>
                                ))}
                            </div>
                        )}
                        {suggestions.products.length > 0 && (
                            <div className="px-3 pt-1 border-t border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Products</p>
                                {suggestions.products.map(p => (
                                    <a
                                        key={p.id}
                                        href={`/products/${p.id}`}
                                        className="block w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors line-clamp-1"
                                    >
                                        {p.name}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
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
                <div className="px-4 mb-3 flex items-center justify-between">
                    {query ? (
                        <div className="text-sm font-bold text-gray-600">
                            <span className="text-black text-base">&apos;{query}&apos;</span> — {total} {t.productsFound}
                        </div>
                    ) : (
                        <div className="text-sm font-extrabold text-gray-900">{t.allProducts} ({total})</div>
                    )}
                    {/* Sort dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSort(!showSort)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-400 bg-white"
                        >
                            {sortLabels[sort] || sortLabels['']}
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showSort && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 min-w-[160px]">
                                {Object.entries(sortLabels).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setSort(key); setShowSort(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${sort === key ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

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
                    <>
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
                    {/* Load More - inside fragment */}
                    {displayed.length < total && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="px-8 py-3 bg-white border border-gray-300 rounded-full text-gray-700 font-bold text-sm hover:bg-gray-50 shadow-sm disabled:opacity-50"
                            >
                                {isLoadingMore ? (
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto" />
                                ) : (
                                    `${loadMoreLabel} (${displayed.length}/${total})`
                                )}
                            </button>
                        </div>
                    )}
                    </>
                )}
            </div>
            {showSort && <div className="fixed inset-0 z-30" onClick={() => setShowSort(false)} />}
            <Footer />
        </main>
    );
}
