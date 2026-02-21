import { NextResponse } from 'next/server';
import { getProductsByLanguage } from '@/lib/api';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Default to Korean if language is not specified
    const lang = searchParams.get('lang') || 'ko';

    try {
        const products = await getProductsByLanguage(lang);
        return NextResponse.json(products);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
