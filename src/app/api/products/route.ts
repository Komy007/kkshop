import { NextResponse } from 'next/server';
import { getProductsByLanguage } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'ko';
    const category = searchParams.get('category');

    try {
        const products = await getProductsByLanguage(lang, category);
        return NextResponse.json(products);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
