'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';
import { type TranslatedProduct } from '@/lib/api';

type LangKey = 'ko' | 'en' | 'km' | 'zh';

const categoryTitles: Record<string, Record<string, string>> = {
    ko: { all: '전체 상품', skincare: '스킨케어', makeup: '메이크업', 'hair-body': '헤어/바디', living: '생활용품', health: '건강식품', 'food-beverage': '식품/음료', new: '신상품', best: '베스트', sale: '할인' },
    en: { all: 'All Products', skincare: 'Skincare', makeup: 'Makeup', 'hair-body': 'Hair/Body', living: 'Living', health: 'Health', 'food-beverage': 'F&B', new: 'New Arrivals', best: 'Bestseller', sale: 'Sale' },
    km: { all: 'ផលិតផលទាំងអស់', skincare: 'ថែស្បែក', makeup: 'គ្រឿងសំអាង', 'hair-body': 'សក់/រាងកាយ', living: 'គ្រឿងប្រើប្រាស់', health: 'សុខភាព', 'food-beverage': 'អាហារ/ភេសជ្ជៈ', new: 'ផលិតផលថ្មី', best: 'ពេញនិយម', sale: 'បញ្ចុះតម្លៃ' },
    zh: { all: '全部商品', skincare: '护肤', makeup: '彩妆', 'hair-body': '洗护', living: '生活用品', health: '保健品', 'food-beverage': '食品饮料', new: '新品', best: '热销', sale: '折扣' }
};

const uiT: Record<LangKey, Record<string, string>> = {
    ko: { empty: '상품이 없습니다.', backHome: '쇼핑 홈으로', sortDefault: '추천순', sortNewest: '최신순', sortPriceAsc: '낮은 가격순', sortPriceDesc: '높은 가격순', sortRating: '평점순', sortPopular: '인기순', filter: '필터', priceRange: '가격대', apply: '적용', reset: '초기화', items: '개 상품', loadMore: '더 보기', min: '최소', max: '최대' },
    en: { empty: 'No products found.', backHome: 'Back to Home', sortDefault: 'Recommended', sortNewest: 'Newest', sortPriceAsc: 'Price: Low→High', sortPriceDesc: 'Price: High→Low', sortRating: 'Top Rated', sortPopular: 'Most Popular', filter: 'Filter', priceRange: 'Price Range', apply: 'Apply', reset: 'Reset', items: 'items', loadMore: 'Load More', min: 'Min', max: 'Max' },
    km: { empty: 'រកមិនឃើញផលិតផល។', backHome: 'ត្រឡប់ទៅទំព័រដើម', sortDefault: 'ផ្សេងៗ', sortNewest: 'ថ្មីបំផុត', sortPriceAsc: 'តម្លៃទាប→ខ្ពស់', sortPriceDesc: 'តម្លៃខ្ពស់→ទាប', sortRating: 'ពិន្ទុខ្ពស់', sortPopular: 'ពេញនិយម', filter: 'តម្រង', priceRange: 'ជួរតម្លៃ', apply: 'អនុវត្ត', reset: 'កំណត់ឡើងវិញ', items: 'ផលិតផល', loadMore: 'ផ្ទុកបន្ថែម', min: 'អប្បបរមា', max: 'អតិបរមា' },
    zh: { empty: '没有找到商品。', backHome: '返回首页', sortDefault: '推荐', sortNewest: '最新', sortPriceAsc: '价格低→高', sortPriceDesc: '价格高→低', sortRating: '评分最高', sortPopular: '最受欢迎', filter: '筛选', priceRange: '价格区间', apply: '应用', reset: '重置', items: '件商品', loadMore: '加载更多', min: '最低', max: '最高' },
};

const SORT_OPTIONS = [
    { key: '', label: 'sortDefault' },
    { key: 'newest', label: 'sortNewest' },
    { key: 'price_asc', label: 'sortPriceAsc' },
    { key: 'price_desc', label: 'sortPriceDesc' },
    { key: 'rating', label: 'sortRating' },
    { key: 'popular', label: 'sortPopular' },
] as const;

const PAGE_SIZE = 24;

export default function CategoryDetailPage() {
    const params = useParams();
    const slug = (params?.slug as string) || '';

    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
    const lang = (language as LangKey) in uiT ? (language as LangKey) : 'en';
    const t = uiT[lang];
    const currentTitle = categoryTitles[lang]?.[slug] || slug.toUpperCase();

    // State
    const [products, setProducts] = useState<TranslatedProduct[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [sort, setSort] = useState('');
    const [showSort, setShowSort] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [appliedMin, setAppliedMin] = useState('');
    const [appliedMax, setAppliedMax] = useState('');
    const [page, setPage] = useState(0);

    const fetchProducts = useCallback(async (skip: number, append: boolean) => {
        if (!slug) return;
        append ? setIsLoadingMore(true) : setIsLoading(true);
        try {
            const params = new URLSearchParams({ lang: language, category: slug, limit: String(PAGE_SIZE), skip: String(skip) });
            if (sort) params.set('sort', sort);
            if (appliedMin) params.set('minPrice', appliedMin);
            if (appliedMax) params.set('maxPrice', appliedMax);
            const res = await fetch(`/api/products?${params}`);
            if (res.ok) {
                const data = await res.json();
                const list: TranslatedProduct[] = Array.isArray(data) ? data : (data.products ?? []);
                setProducts(prev => append ? [...prev, ...list] : list);
                setTotal(data.total ?? list.length);
            }
        } catch (e) {
            console.error('Failed to load category products', e);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [slug, language, sort, appliedMin, appliedMax]);

    // Re-fetch when sort/filter/language changes
    useEffect(() => {
        setPage(0);
        fetchProducts(0, false);
    }, [fetchProducts]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage * PAGE_SIZE, true);
    };

    const applyFilter = () => {
        setAppliedMin(minPrice);
        setAppliedMax(maxPrice);
        setShowFilter(false);
    };

    const resetFilter = () => {
        setMinPrice('');
        setMaxPrice('');
        setAppliedMin('');
        setAppliedMax('');
        setShowFilter(false);
    };

    const hasMore = products.length < total;
    const hasFilter = !!(appliedMin || appliedMax);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-900" />
                        </Link>
                        <h1 className="text-base font-extrabold text-gray-900">{currentTitle}</h1>
                        {!isLoading && <span className="text-xs text-gray-400 font-bold ml-1">({total})</span>}
                    </div>
                </div>

                {/* Sort & Filter Bar */}
                <div className="flex items-center gap-2 mt-2">
                    {/* Sort dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowSort(!showSort); setShowFilter(false); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-400 transition-colors bg-white"
                        >
                            {t[(SORT_OPTIONS.find(o => o.key === sort) || SORT_OPTIONS[0]).label]}
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showSort && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 min-w-[160px]">
                                {SORT_OPTIONS.map(o => (
                                    <button
                                        key={o.key}
                                        onClick={() => { setSort(o.key); setShowSort(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors ${sort === o.key ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                                    >
                                        {t[o.label]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter button */}
                    <button
                        onClick={() => { setShowFilter(!showFilter); setShowSort(false); }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${hasFilter ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-700 bg-white hover:border-gray-400'}`}
                    >
                        <SlidersHorizontal className="w-3 h-3" />
                        {t.filter}
                        {hasFilter && (
                            <button onClick={(e) => { e.stopPropagation(); resetFilter(); }} className="ml-1 hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilter && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs font-bold text-gray-600 mb-2">{t.priceRange} (USD)</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder={t.min}
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500"
                                min="0"
                            />
                            <span className="text-gray-400">~</span>
                            <input
                                type="number"
                                placeholder={t.max}
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500"
                                min="0"
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={resetFilter} className="flex-1 py-2 text-xs font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100">{t.reset}</button>
                            <button onClick={applyFilter} className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">{t.apply}</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-3 pt-4">
                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-[4/5] bg-gray-200" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                                    <div className="h-4 bg-gray-200 rounded" />
                                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-24 px-4">
                        <div className="text-6xl mb-4 opacity-30 grayscale">📦</div>
                        <p className="text-gray-500 font-medium">{t.empty}</p>
                        <Link href="/" className="inline-block mt-6 px-8 py-3 bg-white border border-gray-300 rounded-full text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
                            {t.backHome}
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {products.map((product) => (
                                <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all border border-gray-200">
                                    <div className="aspect-[4/5] relative w-full bg-gray-100 overflow-hidden">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                                                loading="lazy"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500'; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">✨</div>
                                        )}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                            {product.isHotSale && <span className="bg-[#E52528] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">SALE</span>}
                                            {product.isNew && !product.isHotSale && <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">NEW</span>}
                                        </div>
                                        {product.isHotSale && product.hotSalePrice && product.hotSalePrice < product.priceUsd && (
                                            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                -{Math.round((1 - product.hotSalePrice / product.priceUsd) * 100)}%
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 flex flex-col flex-1">
                                        {product.brandName && (
                                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide truncate mb-0.5">{product.brandName}</span>
                                        )}
                                        <p className="text-sm text-gray-800 leading-snug line-clamp-2 min-h-[36px] font-bold mb-1.5 group-hover:text-blue-600 transition-colors">
                                            {product.name}
                                        </p>
                                        <div className="mt-auto">
                                            {product.isHotSale && product.hotSalePrice && product.hotSalePrice < product.priceUsd ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 line-through">${product.priceUsd.toFixed(2)}</span>
                                                    <span className="text-lg font-extrabold text-[#E52528] leading-none">${product.hotSalePrice.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-lg font-extrabold text-gray-900 leading-none">${product.priceUsd.toFixed(2)}</span>
                                            )}
                                            {product.reviewCount > 0 && (
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                    <span className="text-xs font-bold text-gray-700">{product.reviewAvg.toFixed(1)}</span>
                                                    <span className="text-xs text-gray-400">({product.reviewCount})</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Load More */}
                        {hasMore && (
                            <div className="flex justify-center mt-6 mb-4">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="px-8 py-3 bg-white border border-gray-300 rounded-full text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {isLoadingMore ? (
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto" />
                                    ) : (
                                        `${t.loadMore} (${products.length}/${total})`
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Overlay to close dropdowns */}
            {(showSort || showFilter) && (
                <div className="fixed inset-0 z-30" onClick={() => { setShowSort(false); setShowFilter(false); }} />
            )}
        </main>
    );
}
