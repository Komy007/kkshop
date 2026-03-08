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

        const serializeOptions = (opts: any[], lang: string) => {
            return opts.map(o => ({
                id: o.id.toString(),
                minQty: o.minQty,
                maxQty: o.maxQty,
                discountPct: Number(o.discountPct),
                freeShipping: o.freeShipping,
                label: lang === 'ko' ? o.labelKo : (o.labelEn || o.labelKo)
            }));
        };

        const buildResponse = (p: any, t: any) => ({
            id: p.id.toString(),
            sku: p.sku,
            priceUsd: Number(p.priceUsd),
            stockQty: p.stockQty,
            status: p.status,
            imageUrl: p.imageUrl || p.images?.[0]?.url || null,
            categoryId: p.categoryId?.toString() || null,
            name: t.name,
            shortDesc: t.shortDesc,
            detailDesc: t.detailDesc,
            seoKeywords: t.seoKeywords,
            ingredients: t.ingredients,
            howToUse: t.howToUse,
            benefits: t.benefits,
            isHotSale: p.isHotSale,
            hotSalePrice: p.hotSalePrice ? Number(p.hotSalePrice) : null,
            volume: p.volume,
            skinType: p.skinType,
            origin: p.origin,
            expiryMonths: p.expiryMonths,
            certifications: p.certifications,
            brandName: p.brandName || p.supplier?.brandName || p.supplier?.companyName || null,
            supplier: p.supplier ? { companyName: p.supplier.companyName } : null,
            options: serializeOptions(p.options || [], lang),
        });

        if (!product) {
            // Try fetching with any available translation as fallback
            const productAny = await prisma.product.findUnique({
                where: { id: BigInt(productId) },
                include: {
                    translations: { take: 1 },
                    options: { orderBy: { sortOrder: 'asc' } },
                    supplier: { select: { companyName: true, brandName: true } }
                }
            });

            if (!productAny) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            return NextResponse.json(buildResponse(productAny, productAny.translations[0] || {
                name: productAny.sku,
                shortDesc: null, detailDesc: null, seoKeywords: null,
                ingredients: null, howToUse: null, benefits: null
            }));
        }

        return NextResponse.json(buildResponse(product, product.translations[0] || {
            name: product.sku,
            shortDesc: null, detailDesc: null, seoKeywords: null,
            ingredients: null, howToUse: null, benefits: null
        }));
    } catch (error) {
        console.error('Failed to fetch product:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}
