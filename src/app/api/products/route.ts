import { NextResponse } from 'next/server';
import { getProductsByLanguage, getProductsForSection } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'ko';
    const category = searchParams.get('category');
    const section = searchParams.get('section'); // hot | new | popular | todaypick
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '48'), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0);

    try {
        // Section-specific fetch (homepage) — returns small curated list
        if (section === 'hot' || section === 'new' || section === 'popular' || section === 'todaypick') {
            const products = await getProductsForSection(lang, section, limit || 8);
            return NextResponse.json({ products, total: products.length });
        }

        // General paginated fetch
        const result = await getProductsByLanguage(lang, category, limit, skip, search);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
