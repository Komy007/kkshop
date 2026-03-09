import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// ── GET: single product (owned by this seller) ────────────────────────────
export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const product = await prisma.product.findUnique({
        where: { id: BigInt(params.id) },
        include: {
            translations: { orderBy: { langCode: 'asc' } },
            images: { orderBy: { sortOrder: 'asc' } },
        },
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.supplierId !== supplier.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
        ...product,
        id: product.id.toString(),
        priceUsd: product.priceUsd.toString(),
        costPrice: product.costPrice?.toString() ?? null,
        hotSalePrice: product.hotSalePrice?.toString() ?? null,
        reviewAvg: product.reviewAvg.toString(),
        categoryId: product.categoryId?.toString() ?? null,
        images: product.images.map(img => ({
            ...img,
            id: img.id.toString(),
            productId: img.productId.toString(),
        })),
    });
}

// ── PATCH: limited seller-only update ────────────────────────────────────
// Sellers can update content fields. On update, approvalStatus resets to PENDING.
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const product = await prisma.product.findUnique({
        where: { id: BigInt(params.id) },
        select: { id: true, supplierId: true, approvalStatus: true },
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.supplierId !== supplier.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, shortDesc, detailDesc, ingredients, howToUse, benefits, priceUsd, volume, skinType, origin } = body;

    await prisma.$transaction(async (tx) => {
        // Update Korean translation (base language for seller)
        if (name !== undefined) {
            await tx.productTranslation.upsert({
                where: { productId_langCode: { productId: product.id, langCode: 'ko' } },
                create: {
                    productId: product.id,
                    langCode: 'ko',
                    name: name ?? '',
                    shortDesc: shortDesc ?? null,
                    detailDesc: detailDesc ?? null,
                    ingredients: ingredients ?? null,
                    howToUse: howToUse ?? null,
                    benefits: benefits ?? null,
                },
                update: {
                    name: name ?? undefined,
                    shortDesc: shortDesc ?? null,
                    detailDesc: detailDesc ?? null,
                    ingredients: ingredients ?? null,
                    howToUse: howToUse ?? null,
                    benefits: benefits ?? null,
                },
            });
        }

        // Update product fields (limited)
        const updateData: any = {
            approvalStatus: 'PENDING', // Always reset to pending on seller edit
        };
        if (priceUsd !== undefined) updateData.priceUsd = parseFloat(priceUsd);
        if (volume !== undefined) updateData.volume = volume || null;
        if (skinType !== undefined) updateData.skinType = skinType || null;
        if (origin !== undefined) updateData.origin = origin || null;

        await tx.product.update({
            where: { id: product.id },
            data: updateData,
        });
    });

    return NextResponse.json({ success: true, message: '수정 완료. 관리자 검수 후 판매됩니다.' });
}
