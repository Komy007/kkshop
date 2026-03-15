import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/api';

// Public categories endpoint — no auth required (category list is non-sensitive public data)
// Returns flat list of all non-system categories including parentId for building hierarchy on client
export async function GET() {
    try {
        const categories = await getAllCategories();
        // Exclude system categories (best, new, sale, foryou etc.)
        const visible = categories.filter(c => !c.isSystem);
        return NextResponse.json(visible, {
            headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
