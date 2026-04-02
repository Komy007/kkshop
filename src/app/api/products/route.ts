import { NextResponse } from 'next/server';
import { getProductsByLanguage, getProductsForSection } from '@/lib/api';

export const dynamic = 'force-dynamic';

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
            const products = await getProductsForSection(lang, section, limit || 8);
            return NextResponse.json({ products, total: products.length });
        }

        // General paginated fetch
        const result = await getProductsByLanguage(lang, category, limit, skip, search, sort, minPrice, maxPrice);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
