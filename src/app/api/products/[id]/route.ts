import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

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
                    where: { langCode: lang }
                }
            }
        });

        if (!product) {
            // Try fetching with any available translation as fallback
            const productAny = await prisma.product.findUnique({
                where: { id: BigInt(productId) },
                include: {
                    translations: { take: 1 }
                }
            });

            if (!productAny) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            const fallbackTranslation = productAny.translations[0] || {
                name: productAny.sku,
                shortDesc: null,
                detailDesc: null,
                seoKeywords: null,
            };

            return NextResponse.json({
                id: productAny.id.toString(),
                sku: productAny.sku,
                priceUsd: Number(productAny.priceUsd),
                stockQty: productAny.stockQty,
                status: productAny.status,
                imageUrl: productAny.imageUrl,
                categoryId: productAny.categoryId?.toString() || null,
                name: fallbackTranslation.name,
                shortDesc: fallbackTranslation.shortDesc,
                detailDesc: fallbackTranslation.detailDesc,
                seoKeywords: fallbackTranslation.seoKeywords,
            });
        }

        const translation = product.translations[0] || {
            name: product.sku,
            shortDesc: null,
            detailDesc: null,
            seoKeywords: null,
        };

        return NextResponse.json({
            id: product.id.toString(),
            sku: product.sku,
            priceUsd: Number(product.priceUsd),
            stockQty: product.stockQty,
            status: product.status,
            imageUrl: product.imageUrl,
            categoryId: product.categoryId?.toString() || null,
            name: translation.name,
            shortDesc: translation.shortDesc,
            detailDesc: translation.detailDesc,
            seoKeywords: translation.seoKeywords,
        });
    } catch (error) {
        console.error('Failed to fetch product:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}
