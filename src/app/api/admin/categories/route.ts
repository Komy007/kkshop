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

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        const bigId = BigInt(id);

        // 1. 카테고리 존재 여부 확인
        const cat = await prisma.category.findUnique({ where: { id: bigId } });
        if (!cat) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

        // 2. 시스템 카테고리 보호
        if (cat.isSystem) {
            return NextResponse.json({ error: 'System categories cannot be deleted.' }, { status: 403 });
        }

        // 3. 서브카테고리 존재 여부 확인
        const subCount = await prisma.category.count({ where: { parentId: bigId } });
        if (subCount > 0) {
            return NextResponse.json({
                error: `This category has ${subCount} sub-categor${subCount > 1 ? 'ies' : 'y'}. Please delete sub-categories first.`,
                errorKo: `서브카테고리 ${subCount}개가 있습니다. 서브카테고리를 먼저 삭제해주세요.`,
            }, { status: 409 });
        }

        // 4. 연결된 상품 존재 여부 확인
        const productCount = await prisma.product.count({ where: { categoryId: bigId } });
        if (productCount > 0) {
            return NextResponse.json({
                error: `This category has ${productCount} product${productCount > 1 ? 's' : ''} linked. Please reassign them first.`,
                errorKo: `상품 ${productCount}개가 이 카테고리에 연결되어 있습니다. 먼저 상품을 다른 카테고리로 이동해주세요.`,
            }, { status: 409 });
        }

        // 5. 안전하게 삭제
        await prisma.category.delete({ where: { id: bigId } });
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('DELETE /api/admin/categories error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { slug, nameKo, nameEn, nameKm, nameZh, sortOrder, parentId } = body;

        if (!slug || !nameKo || !nameEn) {
            return NextResponse.json({ error: 'Slug, Korean name, and English name are required.' }, { status: 400 });
        }

        // Check if slug already exists
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ error: 'A category with this Slug already exists.' }, { status: 409 });
        }

        // Validate parentId if provided
        if (parentId) {
            const parent = await prisma.category.findUnique({ where: { id: BigInt(parentId) } });
            if (!parent) return NextResponse.json({ error: 'Parent category not found.' }, { status: 404 });
        }

        const newCategory = await prisma.category.create({
            data: {
                slug,
                nameKo,
                nameEn,
                nameKm: nameKm || nameEn,
                nameZh: nameZh || nameEn,
                sortOrder: sortOrder ? parseInt(sortOrder) : 0,
                isSystem: false,
                parentId: parentId ? BigInt(parentId) : null,
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
