import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/api';

// Public categories endpoint — no auth required (category list is non-sensitive public data)
export async function GET() {
    try {
        const categories = await getAllCategories();
        // Return only non-system categories (seller/consumer visible)
        const visible = categories.filter(c => !c.isSystem);
        return NextResponse.json(visible, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
        });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
