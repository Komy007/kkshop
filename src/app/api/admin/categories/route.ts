import { NextResponse } from 'next/server';
import { getAllCategories, prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const categories = await getAllCategories();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await req.json();
    const { nameKo, nameEn, nameKm, nameZh, sortOrder } = body;
    const data: any = {};
    if (nameKo) data.nameKo = nameKo;
    if (nameEn) data.nameEn = nameEn;
    if (nameKm) data.nameKm = nameKm;
    if (nameZh) data.nameZh = nameZh;
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder);

    await prisma.category.update({ where: { id: BigInt(id) }, data });
    return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { slug, nameKo, nameEn, nameKm, nameZh, sortOrder } = body;

        if (!slug || !nameKo || !nameEn || !nameKm || !nameZh) {
            return NextResponse.json({ error: 'All fields (slug and 4-language names) are required.' }, { status: 400 });
        }

        // Check if slug already exists
        const existing = await prisma.category.findUnique({
            where: { slug }
        });

        if (existing) {
            return NextResponse.json({ error: 'A category with this Slug already exists.' }, { status: 409 });
        }

        const newCategory = await prisma.category.create({
            data: {
                slug,
                nameKo,
                nameEn,
                nameKm,
                nameZh,
                sortOrder: sortOrder ? parseInt(sortOrder) : 0,
                isSystem: false // User-created categories are not system categories by default
            }
        });

        return NextResponse.json({
            success: true,
            id: newCategory.id.toString(),
            message: 'Category created successfully'
        });
    } catch (error: any) {
        console.error('POST /api/admin/categories error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
