import { NextResponse } from 'next/server';
import { getProductsByLanguage, getProductsForSection } from '@/lib/api';

export const dynamic = 'force-dynamic';

// 2-min server cache for homepage section queries (hot/new/popular/todaypick)
// Key: `${section}:${lang}:${limit}` — only section requests are cached
const _sectionCache = new Map<string, { data: any; ts: number }>();
const SECTION_TTL = 2 * 60 * 1000;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'ko';
    const category = searchParams.get('category');
    const section = searchParams.get('section'); // hot | new | popular | todaypick
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');        // price_asc | price_desc | newest | rating | popular
    const minPrice = parseFloat(searchParams.get('minPrice') || '0') || null;
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '0') || null;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '48') || 48, 1), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0') || 0, 0);

    try {
        // Section-specific fetch (homepage) — returns small curated list
        if (section === 'hot' || section === 'new' || section === 'popular' || section === 'todaypick') {
            const cacheKey = `${section}:${lang}:${limit}`;
            const cached = _sectionCache.get(cacheKey);
            if (cached && Date.now() - cached.ts < SECTION_TTL) {
                return NextResponse.json(cached.data);
            }
            const products = await getProductsForSection(lang, section, limit || 8);
            const result = { products, total: products.length };
            _sectionCache.set(cacheKey, { data: result, ts: Date.now() });
            return NextResponse.json(result);
        }

        // General paginated fetch
        const result = await getProductsByLanguage(lang, category, limit, skip, search, sort, minPrice, maxPrice);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
