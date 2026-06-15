import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';

// 2-min cache per language — sections are deduplicated so one cache entry covers all three
const _cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 2 * 60 * 1000;

const LIMIT = 8;   // products per section shown
const POOL  = 18;  // fetch pool — larger pool = better deduplication headroom

const include = {
    translations: { select: { langCode: true, name: true } },
    category: { select: { slug: true } },
    images: { orderBy: { sortOrder: 'asc' } as any, take: 1 },
};

function serialize(p: any, lang: string) {
    const tAll: any[] = p.translations ?? [];
    const t = tAll.find((x: any) => x.langCode === lang)
        || tAll.find((x: any) => x.langCode === 'en')
        || tAll[0] || {};
    return {
        id: p.id.toString(),
        name: t.name || p.sku || '',
        priceUsd: Number(p.priceUsd),
        hotSalePrice: p.hotSalePrice ? Number(p.hotSalePrice) : null,
        isHotSale: p.isHotSale ?? false,
        isNew: p.isNew ?? false,
        isTodayPick: p.isTodayPick ?? false,
        status: p.status,
        stockQty: p.stockQty,
        imageUrl: p.images?.[0]?.url || p.imageUrl || null,
        reviewAvg: Number(p.reviewAvg ?? 0),
        reviewCount: p.reviewCount ?? 0,
        displayPriority: p.displayPriority ?? 0,
        categorySlug: p.category?.slug ?? null,
        brandName: p.brandName ?? null,
        origin: p.origin ?? null,
        badgeAuthentic: p.badgeAuthentic ?? false,
        badgeKoreanCertified: p.badgeKoreanCertified ?? false,
        // unused fields expected by TranslatedProduct
        sku: p.sku,
        categoryId: p.categoryId?.toString() ?? null,
        volume: p.volume ?? null,
        skinType: p.skinType ?? null,
        certifications: p.certifications ?? null,
        expiryMonths: p.expiryMonths ?? null,
        unitLabel: p.unitLabel ?? null,
        unitsPerPkg: p.unitsPerPkg ?? null,
        shortDesc: null,
        detailDesc: null,
        seoKeywords: null,
        ingredients: null,
        howToUse: null,
        benefits: null,
    };
}

// GET /api/homepage/sections?lang=en
// Returns { hot, new, popular } — guaranteed zero overlap between sections.
// Priority order: HOT first (isHotSale), then NEW (newest), then POPULAR (highest rated).
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const rawLang = searchParams.get('lang') ?? 'en';
    const lang = (['en', 'ko', 'km', 'zh'] as const).includes(rawLang as any) ? rawLang : 'en';

    const cached = _cache.get(lang);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    try {
        const baseWhere = { status: 'ACTIVE' as const, approvalStatus: 'APPROVED' as const };

        // ── 1. HOT DEALS: explicitly marked isHotSale=true ───────────────────
        // Sorted by discount% desc so the biggest savings appear first
        const hotRaw = await prisma.product.findMany({
            where: { ...baseWhere, isHotSale: true, hotSalePrice: { not: null } },
            include,
            orderBy: [
                { displayPriority: 'desc' },
                { reviewCount: 'desc' },
                { createdAt: 'desc' },
            ],
            take: POOL,
        });
        // Sort by effective discount % descending
        const hotSorted = hotRaw
            .map(p => ({
                p,
                pct: p.hotSalePrice ? Math.round((1 - Number(p.hotSalePrice) / Number(p.priceUsd)) * 100) : 0,
            }))
            .sort((a, b) => b.pct - a.pct)
            .map(x => x.p);
        const hotProducts = hotSorted.slice(0, LIMIT);
        const hotIds = hotProducts.map(p => p.id);

        // ── 2. NEW ARRIVALS: freshest products not already in hot ─────────────
        const newRaw = await prisma.product.findMany({
            where: {
                ...baseWhere,
                id: { notIn: hotIds.length > 0 ? hotIds : undefined },
            },
            include,
            orderBy: [
                { displayPriority: 'desc' },
                { createdAt: 'desc' },
            ],
            take: POOL,
        });
        const newProducts = newRaw.slice(0, LIMIT);
        const newIds = newProducts.map(p => p.id);

        // ── 3. POPULAR: highest-rated products not in hot or new ─────────────
        const excludeIds = [...hotIds, ...newIds];
        const popularRaw = await prisma.product.findMany({
            where: {
                ...baseWhere,
                id: { notIn: excludeIds.length > 0 ? excludeIds : undefined },
            },
            include,
            orderBy: [
                { displayPriority: 'desc' },
                { reviewAvg: 'desc' },
                { reviewCount: 'desc' },
                { createdAt: 'desc' },
            ],
            take: LIMIT,
        });

        const result = {
            hot:     hotProducts.map(p => serialize(p, lang)),
            new:     newProducts.map(p => serialize(p, lang)),
            popular: popularRaw.map(p => serialize(p, lang)),
        };

        _cache.set(lang, { data: result, ts: Date.now() });
        return NextResponse.json(result);
    } catch (err: any) {
        console.error('GET /api/homepage/sections error:', err);
        return NextResponse.json({ hot: [], new: [], popular: [] }, { status: 500 });
    }
}
