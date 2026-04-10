import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

// Carousel API — returns data for 6 hero slides
// Slide 1: brand banner (no data needed)
// Slide 2: Skincare + Makeup  (1 product each)
// Slide 3: Hot Deal (1 product, biggest discount)
// Slide 4: Health + Korean F&B (1 product each)
// Slide 5: New Arrivals (3 products)
// Slide 6: Best Sellers top 3

const CATEGORY_PAIRS = [
    ['skincare', 'makeup'],
    ['health', 'fnb'],
] as const;

const productSelect = {
    id: true,
    priceUsd: true,
    imageUrl: true,
    isHotSale: true,
    hotSalePrice: true,
    reviewAvg: true,
    reviewCount: true,
    images: { take: 1, select: { url: true } },
    translations: {
        select: { langCode: true, name: true },
    },
    category: { select: { slug: true } },
};

function serializeItem(p: any, lang: string) {
    const translations: any[] = p.translations ?? [];
    const t = translations.find((t: any) => t.langCode === lang)
        || translations.find((t: any) => t.langCode === 'en')
        || translations[0]
        || {};
    return {
        id: p.id.toString(),
        name: t.name || 'Product',
        priceUsd: Number(p.priceUsd),
        hotSalePrice: p.hotSalePrice ? Number(p.hotSalePrice) : null,
        isHotSale: p.isHotSale,
        imageUrl: p.images?.[0]?.url || p.imageUrl || null,
        reviewAvg: p.reviewAvg ? Number(p.reviewAvg) : 0,
        reviewCount: p.reviewCount ?? 0,
        categorySlug: p.category?.slug ?? null,
    };
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const lang = searchParams.get('lang') || 'en';

        // Use daily seed for rotation
        const dayNum = Math.floor(Date.now() / 86400000);

        // ── Category Pairs (slides 2 & 4) ──
        const categoryPairSlides = await Promise.all(
            CATEGORY_PAIRS.map(async ([slug1, slug2]) => {
                const [products1, products2] = await Promise.all([
                    prisma.product.findMany({
                        where: { category: { slug: slug1 }, status: 'ACTIVE' },
                        orderBy: [{ reviewCount: 'desc' }, { createdAt: 'desc' }],
                        take: 5,
                        select: productSelect,
                    }),
                    prisma.product.findMany({
                        where: { category: { slug: slug2 }, status: 'ACTIVE' },
                        orderBy: [{ reviewCount: 'desc' }, { createdAt: 'desc' }],
                        take: 5,
                        select: productSelect,
                    }),
                ]);

                // Pick 1 product per category, rotating daily
                const p1 = products1.length > 0 ? products1[dayNum % products1.length] : null;
                const p2 = products2.length > 0 ? products2[dayNum % products2.length] : null;

                return {
                    type: 'categoryPair' as const,
                    categories: [slug1, slug2],
                    products: [
                        p1 ? serializeItem(p1, lang) : null,
                        p2 ? serializeItem(p2, lang) : null,
                    ],
                };
            })
        );

        // ── Hot Deal (slide 3): biggest discount ──
        const hotProducts = await prisma.product.findMany({
            where: {
                status: 'ACTIVE',
                isHotSale: true,
                hotSalePrice: { not: null },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: productSelect,
        });

        // Find the product with the biggest discount percentage
        let hotDealProduct = null;
        let maxDiscount = 0;
        for (const p of hotProducts) {
            const original = Number(p.priceUsd);
            const sale = Number(p.hotSalePrice);
            if (original > 0 && sale > 0 && sale < original) {
                const discount = Math.round(((original - sale) / original) * 100);
                if (discount > maxDiscount) {
                    maxDiscount = discount;
                    hotDealProduct = p;
                }
            }
        }

        // Fallback: if no hot deal, pick latest active product
        if (!hotDealProduct && hotProducts.length > 0) {
            hotDealProduct = hotProducts[0];
        }
        if (!hotDealProduct) {
            const fallback = await prisma.product.findFirst({
                where: { status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                select: productSelect,
            });
            if (fallback) hotDealProduct = fallback;
        }

        const hotDealSlide = {
            type: 'hotDeal' as const,
            product: hotDealProduct ? serializeItem(hotDealProduct, lang) : null,
            discountPercent: maxDiscount,
        };

        // ── New Arrivals (slide 5): 3 newest products ──
        const newProducts = await prisma.product.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: productSelect,
        });
        // Rotate: pick 3 starting from dayNum offset
        const newStart = newProducts.length > 3 ? dayNum % Math.max(1, newProducts.length - 2) : 0;
        const newSlice = newProducts.slice(newStart, newStart + 3);
        // If not enough, wrap
        const newItems = newSlice.length < 3
            ? [...newSlice, ...newProducts.slice(0, 3 - newSlice.length)]
            : newSlice;

        const newArrivalsSlide = {
            type: 'newArrivals' as const,
            products: newItems.map(p => serializeItem(p, lang)),
        };

        // ── Best Sellers (slide 6): top 3 by order count (last 30 days) ──
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        let bestSellerIds: bigint[] = [];
        try {
            const orderGroups = await prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                where: {
                    order: { createdAt: { gte: thirtyDaysAgo } },
                },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            });
            bestSellerIds = orderGroups.map(g => g.productId);
        } catch {
            // fallback: use review count
        }

        let bestProducts;
        if (bestSellerIds.length >= 3) {
            bestProducts = await prisma.product.findMany({
                where: { id: { in: bestSellerIds }, status: 'ACTIVE' },
                select: productSelect,
            });
            // Reorder by sales rank
            bestProducts.sort((a, b) => {
                const ai = bestSellerIds.indexOf(a.id);
                const bi = bestSellerIds.indexOf(b.id);
                return ai - bi;
            });
            bestProducts = bestProducts.slice(0, 3);
        } else {
            // Fallback: top by review
            bestProducts = await prisma.product.findMany({
                where: { status: 'ACTIVE' },
                orderBy: [{ reviewCount: 'desc' }, { reviewAvg: 'desc' }],
                take: 3,
                select: productSelect,
            });
        }

        const bestSellersSlide = {
            type: 'bestSellers' as const,
            products: bestProducts.map((p, i) => ({
                ...serializeItem(p, lang),
                rank: i + 1,
            })),
        };

        return NextResponse.json({
            slides: [
                { type: 'brand' },             // Slide 1
                categoryPairSlides[0],           // Slide 2: Skincare + Makeup
                hotDealSlide,                    // Slide 3: Hot Deal
                categoryPairSlides[1],           // Slide 4: Health + F&B
                newArrivalsSlide,                // Slide 5: New Arrivals
                bestSellersSlide,                // Slide 6: Best Sellers
            ],
        });
    } catch (err: any) {
        console.error('Carousel API error:', err);
        return NextResponse.json({ slides: [{ type: 'brand' }] }, { status: 200 });
    }
}
