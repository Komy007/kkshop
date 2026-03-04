import { NextResponse } from 'next/server';
import { getAllCategories, prisma } from '@/lib/api';
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
