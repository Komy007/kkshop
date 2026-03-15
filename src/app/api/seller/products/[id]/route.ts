import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// ── GET: single product (owned by this seller) ────────────────────────────
export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const product = await prisma.product.findUnique({
        where: { id: BigInt(id) },
        include: {
            translations: { orderBy: { langCode: 'asc' } },
            images: { orderBy: { sortOrder: 'asc' } },
        },
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.supplierId !== supplier.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Explicit serialization — no ...product spread to avoid hidden BigInt/Decimal leaking
    return NextResponse.json({
        id: product.id.toString(),
        sku: product.sku,
        priceUsd: product.priceUsd.toString(),
        costPrice: product.costPrice?.toString() ?? null,
        hotSalePrice: product.hotSalePrice?.toString() ?? null,
        reviewAvg: product.reviewAvg.toString(),
        reviewCount: product.reviewCount,
        stockQty: product.stockQty,
        categoryId: product.categoryId?.toString() ?? null,
        supplierId: product.supplierId ?? null,
        brandName: product.brandName ?? null,
        volume: product.volume ?? null,
        skinType: product.skinType ?? null,
        origin: product.origin ?? null,
        expiryMonths: product.expiryMonths ?? null,
        status: product.status,
        approvalStatus: product.approvalStatus,
        imageUrl: product.imageUrl ?? null,
        isNew: product.isNew,
        isHotSale: product.isHotSale,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        translations: product.translations.map(t => ({
            langCode: t.langCode,
            name: t.name,
            shortDesc: t.shortDesc ?? null,
            detailDesc: t.detailDesc ?? null,
            ingredients: t.ingredients ?? null,
            howToUse: t.howToUse ?? null,
            benefits: t.benefits ?? null,
            seoKeywords: t.seoKeywords ?? null,
        })),
        images: product.images.map(img => ({
            id: img.id.toString(),
            url: img.url,
            altText: img.altText ?? null,
            sortOrder: img.sortOrder,
        })),
    });
}

// ── PATCH: limited seller-only update ────────────────────────────────────
// Sellers can update content fields. On update, approvalStatus resets to PENDING.
export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const product = await prisma.product.findUnique({
        where: { id: BigInt(id) },
        select: { id: true, supplierId: true, approvalStatus: true },
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.supplierId !== supplier.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
        name, shortDesc, detailDesc, ingredients, howToUse, benefits,
        priceUsd, volume, skinType, origin,
        imageUrls = [],      // new GCS URLs to add
        deleteImageIds = [], // existing image IDs to remove
    } = body;

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

        // Delete removed images
        if (deleteImageIds.length > 0) {
            await tx.productImage.deleteMany({
                where: {
                    id: { in: deleteImageIds.map((imgId: string) => BigInt(imgId)) },
                    productId: product.id,
                },
            });
        }

        // Add new images
        if (imageUrls.length > 0) {
            const maxSort = await tx.productImage.findFirst({
                where: { productId: product.id },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });
            const startSort = (maxSort?.sortOrder ?? -1) + 1;
            await tx.productImage.createMany({
                data: imageUrls.map((url: string, i: number) => ({
                    productId: product.id,
                    url,
                    sortOrder: startSort + i,
                })),
            });
        }

        // Update main imageUrl to first remaining image
        const firstImg = await tx.productImage.findFirst({
            where: { productId: product.id },
            orderBy: { sortOrder: 'asc' },
        });

        // Update product fields (limited)
        const updateData: any = {
            approvalStatus: 'PENDING', // Always reset to pending on seller edit
            imageUrl: firstImg?.url ?? null,
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
