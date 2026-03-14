import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/api';
import { auth } from '@/auth';

// Public categories endpoint — accessible by any authenticated user (incl. SUPPLIER)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const categories = await getAllCategories();
        return NextResponse.json(categories);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
