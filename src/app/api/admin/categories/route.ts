import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/api';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role === 'USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const categories = await getAllCategories();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
