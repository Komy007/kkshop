import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

// Per-language server-side cache (5 min TTL) — avoids 7-9 DB queries on every page load
const _cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Carousel API — returns POOLS of products per slide so the client can
// randomly pick different products each time a slide appears.
// Slide 1: brand banner (no data)
// Slide 2: Skincare + Makeup  (pool of 6 each)
// Slide 3: Hot Deal           (pool of 6 hot-sale products)
// Slide 4: Health + Korean F&B (pool of 6 each)
// Slide 5: New Arrivals        (pool of 9)
// Slide 6: Best Sellers        (pool of 6)

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
    bgColor: true,
    images: { take: 1, select: { url: true } },
    translations: { select: { langCode: true, name: true } },
    category: { select: { slug: true } },
};

function serialize(p: any, lang: string) {
    const translations: any[] = p.translations ?? [];
    const t = translations.find((x: any) => x.langCode === lang)
        || translations.find((x: any) => x.langCode === 'en')
        || translations[0] || {};
    const original = Number(p.priceUsd);
    const sale = p.hotSalePrice ? Number(p.hotSalePrice) : null;
    const discountPercent = (p.isHotSale && sale && sale < original)
        ? Math.round(((original - sale) / original) * 100) : 0;
    return {
        id: p.id.toString(),
        name: t.name || 'Product',
        priceUsd: original,
        hotSalePrice: sale,
        isHotSale: p.isHotSale,
        imageUrl: p.images?.[0]?.url || p.imageUrl || null,
        bgColor: p.bgColor ?? null,
        reviewAvg: p.reviewAvg ? Number(p.reviewAvg) : 0,
        reviewCount: p.reviewCount ?? 0,
        categorySlug: p.category?.slug ?? null,
        discountPercent,
    };
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const lang = searchParams.get('lang') || 'en';

        const cached = _cache.get(lang);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            return NextResponse.json(cached.data);
        }

        // ── Category pair pools ──────────────────────────────────────────────
        const categoryPairSlides = await Promise.all(
            CATEGORY_PAIRS.map(async ([slug1, slug2]) => {
                const [pool1, pool2] = await Promise.all([
                    prisma.product.findMany({
                        where: { category: { slug: slug1 }, status: 'ACTIVE' },
                        orderBy: [{ reviewCount: 'desc' }, { createdAt: 'desc' }],
                        take: 6,
                        select: productSelect,
                    }),
                    prisma.product.findMany({
                        where: { category: { slug: slug2 }, status: 'ACTIVE' },
                        orderBy: [{ reviewCount: 'desc' }, { createdAt: 'desc' }],
                        take: 6,
                        select: productSelect,
                    }),
                ]);
                return {
                    type: 'categoryPair' as const,
                    categories: [slug1, slug2],
                    // Return full pools — client picks randomly each rotation
                    pool1: pool1.map(p => serialize(p, lang)),
                    pool2: pool2.map(p => serialize(p, lang)),
                };
            })
        );

        // ── Hot Deal pool (biggest discounts first) ──────────────────────────
        const hotRaw = await prisma.product.findMany({
            where: { status: 'ACTIVE', isHotSale: true, hotSalePrice: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 12,
            select: productSelect,
        });
        // Sort by discount % descending
        const hotPool = hotRaw
            .map(p => serialize(p, lang))
            .filter(p => p.discountPercent > 0)
            .sort((a, b) => b.discountPercent - a.discountPercent)
            .slice(0, 6);

        // Fallback: any active products if no hot sale
        if (hotPool.length === 0) {
            const fallback = await prisma.product.findMany({
                where: { status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                take: 6,
                select: productSelect,
            });
            hotPool.push(...fallback.map(p => serialize(p, lang)));
        }

        const hotDealSlide = {
            type: 'hotDeal' as const,
            pool: hotPool,
        };

        // ── New Arrivals pool ────────────────────────────────────────────────
        const newPool = await prisma.product.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 9,
            select: productSelect,
        });

        const newArrivalsSlide = {
            type: 'newArrivals' as const,
            pool: newPool.map(p => serialize(p, lang)),
        };

        // ── Best Sellers pool ────────────────────────────────────────────────
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        let bestPool: ReturnType<typeof serialize>[] = [];

        try {
            const orderGroups = await prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                where: { order: { createdAt: { gte: thirtyDaysAgo } } },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 12,
            });
            if (orderGroups.length >= 3) {
                const ids = orderGroups.map(g => g.productId);
                const prods = await prisma.product.findMany({
                    where: { id: { in: ids }, status: 'ACTIVE' },
                    select: productSelect,
                });
                prods.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
                bestPool = prods.slice(0, 6).map(p => serialize(p, lang));
            }
        } catch { /* fallback below */ }

        if (bestPool.length < 3) {
            const fallback = await prisma.product.findMany({
                where: { status: 'ACTIVE' },
                orderBy: [{ reviewCount: 'desc' }, { reviewAvg: 'desc' }],
                take: 6,
                select: productSelect,
            });
            bestPool = fallback.map(p => serialize(p, lang));
        }

        const bestSellersSlide = {
            type: 'bestSellers' as const,
            pool: bestPool,
        };

        const result = {
            slides: [
                { type: 'brand' },
                categoryPairSlides[0],   // Skincare + Makeup
                hotDealSlide,
                categoryPairSlides[1],   // Health + F&B
                newArrivalsSlide,
                bestSellersSlide,
            ],
        };
        _cache.set(lang, { data: result, ts: Date.now() });
        return NextResponse.json(result);
    } catch (err: any) {
        console.error('Carousel API error:', err);
        return NextResponse.json({ slides: [{ type: 'brand' }] }, { status: 200 });
    }
}
