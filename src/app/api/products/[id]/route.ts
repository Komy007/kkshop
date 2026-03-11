import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'ko';
    const { id: productId } = await context.params;

    try {
        const product = await prisma.product.findUnique({
            where: { id: BigInt(productId) },
            include: {
                translations: {
                    where: { langCode: { in: ['en', lang] } }
                },
                options: { orderBy: { sortOrder: 'asc' } },
                images: { orderBy: { sortOrder: 'asc' } },
                variants: { orderBy: { sortOrder: 'asc' } },
                supplier: {
                    select: {
                        companyName: true,
                        brandName: true,
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const serializeOptions = (opts: any[]) => {
            return opts.map(o => ({
                id: o.id.toString(),
                minQty: o.minQty,
                maxQty: o.maxQty,
                discountPct: Number(o.discountPct),
                freeShipping: o.freeShipping,
                label: lang === 'ko' ? o.labelKo : (o.labelEn || o.labelKo)
            }));
        };

        const translations = product.translations ?? [];
        const enTrans: any = translations.find(t => t.langCode === 'en') || translations[0] || {};
        const localTrans: any = translations.find(t => t.langCode === lang) || enTrans;


        // All gallery images
        const allImages = (product.images ?? []).map(img => ({
            id: img.id.toString(),
            url: img.url,
            altText: img.altText ?? null,
            sortOrder: img.sortOrder,
        }));

        // Variants (color / size)
        const serializedVariants = (product.variants ?? []).map((v: any) => ({
            id: v.id.toString(),
            variantType: v.variantType,
            variantValue: v.variantValue,
            sku: v.sku ?? null,
            stockQty: v.stockQty,
            priceUsd: v.priceUsd ? Number(v.priceUsd) : null,
            imageUrl: v.imageUrl ?? null,
            sortOrder: v.sortOrder,
        }));

        return NextResponse.json({
            id: product.id.toString(),
            sku: product.sku,
            priceUsd: Number(product.priceUsd),
            stockQty: product.stockQty,
            status: product.status,
            imageUrl: product.imageUrl || allImages[0]?.url || null,
            images: allImages,
            variants: serializedVariants,
            categoryId: product.categoryId?.toString() || null,
            name: localTrans.name || enTrans.name || product.sku,
            shortDesc: localTrans.shortDesc ?? enTrans.shortDesc ?? null,
            detailDesc: localTrans.detailDesc ?? enTrans.detailDesc ?? null,
            seoKeywords: localTrans.seoKeywords ?? enTrans.seoKeywords ?? null,
            ingredients: localTrans.ingredients ?? enTrans.ingredients ?? null,
            howToUse: localTrans.howToUse ?? enTrans.howToUse ?? null,
            benefits: localTrans.benefits ?? enTrans.benefits ?? null,

            isHotSale: product.isHotSale,
            hotSalePrice: product.hotSalePrice ? Number(product.hotSalePrice) : null,
            volume: product.volume,
            skinType: product.skinType,
            origin: product.origin,
            expiryMonths: product.expiryMonths,
            certifications: product.certifications,
            brandName: product.brandName || product.supplier?.brandName || product.supplier?.companyName || null,
            supplier: product.supplier ? { companyName: product.supplier.companyName } : null,
            options: serializeOptions(product.options || []),
        });
    } catch (error) {
        console.error('Failed to fetch product:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}
