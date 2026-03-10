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
                // Fetch both EN (for name) and requested lang (for descriptions)
                translations: {
                    where: { langCode: { in: ['en', lang] } }
                },
                options: { orderBy: { sortOrder: 'asc' } },
                images: { orderBy: { sortOrder: 'asc' } },
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
        // name → always English; descriptions → user's language, fallback to English
        const enTrans = translations.find(t => t.langCode === 'en') || translations[0] || {};
        const localTrans = translations.find(t => t.langCode === lang) || enTrans;

        return NextResponse.json({
            id: product.id.toString(),
            sku: product.sku,
            priceUsd: Number(product.priceUsd),
            stockQty: product.stockQty,
            status: product.status,
            imageUrl: product.imageUrl || product.images?.[0]?.url || null,
            categoryId: product.categoryId?.toString() || null,
            // name: always English
            name: enTrans.name || localTrans.name || product.sku,
            // descriptions: user's language, fallback to English
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
