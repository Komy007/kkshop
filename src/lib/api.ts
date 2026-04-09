import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ── Types ──────────────────────────────────────────────────────────────────
export interface TranslatedProduct {
    id: string;
    sku: string;
    priceUsd: number;
    stockQty: number;
    categoryId?: string | null;
    categorySlug?: string | null;
    status: string;
    imageUrl?: string | null;
    isNew: boolean;
    isHotSale: boolean;
    isTodayPick: boolean;
    hotSalePrice?: number | null;
    reviewAvg: number;
    reviewCount: number;
    displayPriority: number;
    badgeAuthentic: boolean;
    badgeKoreanCertified: boolean;
    brandName?: string | null;
    volume?: string | null;
    skinType?: string | null;
    origin?: string | null;
    certifications?: string | null;
    expiryMonths?: number | null;
    unitLabel?: string | null;
    unitsPerPkg?: number | null;
    // Translated fields
    name: string;
    shortDesc: string | null;
    detailDesc: string | null;
    seoKeywords: string | null;
    ingredients?: string | null;
    howToUse?: string | null;
    benefits?: string | null;
}

export interface CategoryInfo {
    id: string;
    slug: string;
    nameKo: string;
    nameEn: string;
    nameKm: string;
    nameZh: string;
    sortOrder: number;
    isSystem: boolean;
    parentId?: string | null;
    productCount?: number;
    children?: CategoryInfo[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function serializeProduct(product: any, langCode: string): TranslatedProduct {
    const translations: any[] = product.translations ?? [];
    // name → always English; descriptions → user's language (fallback to English)
    const enTrans = translations.find(t => t.langCode === 'en') || translations[0] || {};
    const localTrans = translations.find(t => t.langCode === langCode) || enTrans;

    return {
        id: product.id.toString(),
        sku: product.sku,
        priceUsd: Number(product.priceUsd),
        stockQty: product.stockQty,
        categoryId: product.categoryId?.toString() ?? null,
        categorySlug: product.category?.slug ?? null,
        status: product.status,
        imageUrl: product.images?.[0]?.url || product.imageUrl || null,
        isNew: product.isNew ?? false,
        isHotSale: product.isHotSale ?? false,
        isTodayPick: product.isTodayPick ?? false,
        hotSalePrice: product.hotSalePrice ? Number(product.hotSalePrice) : null,
        reviewAvg: Number(product.reviewAvg ?? 0),
        reviewCount: product.reviewCount ?? 0,
        displayPriority: product.displayPriority ?? 0,
        badgeAuthentic: product.badgeAuthentic ?? false,
        badgeKoreanCertified: product.badgeKoreanCertified ?? false,
        brandName: product.brandName ?? null,
        volume: product.volume ?? null,
        skinType: product.skinType ?? null,
        origin: product.origin ?? null,
        certifications: product.certifications ?? null,
        expiryMonths: product.expiryMonths ?? null,
        unitLabel: (product as any).unitLabel ?? null,
        unitsPerPkg: (product as any).unitsPerPkg ?? null,
        // name: user's language first, fallback to English
        name: localTrans.name || enTrans.name || product.sku,
        // descriptions: user's language, fallback to English
        shortDesc: localTrans.shortDesc ?? enTrans.shortDesc ?? null,
        detailDesc: localTrans.detailDesc ?? enTrans.detailDesc ?? null,
        seoKeywords: localTrans.seoKeywords ?? enTrans.seoKeywords ?? null,
        ingredients: localTrans.ingredients ?? enTrans.ingredients ?? null,
        howToUse: localTrans.howToUse ?? enTrans.howToUse ?? null,
        benefits: localTrans.benefits ?? enTrans.benefits ?? null,
    };
}

// ── Fetch by Category Slug (with pagination) ──────────────────────────────
export async function getProductsByLanguage(
    langCode: string,
    categorySlug?: string | null,
    limit: number = 48,
    skip: number = 0,
    searchQuery?: string | null,
    sortBy?: string | null,
    minPrice?: number | null,
    maxPrice?: number | null,
): Promise<{ products: TranslatedProduct[]; total: number }> {
    try {
        const where: any = { status: 'ACTIVE', approvalStatus: 'APPROVED' };

        if (categorySlug) {
            if (categorySlug === 'new') {
                where.OR = [
                    { isNew: true },
                    { category: { slug: 'new' } },
                ];
            } else if (categorySlug !== 'all') {
                where.category = { slug: categorySlug };
            }
        }

        if (searchQuery) {
            const term = searchQuery.trim();
            if (term) {
                const likePattern = { contains: term, mode: 'insensitive' as const };
                where.OR = [
                    ...(where.OR ?? []),
                    { translations: { some: { name: likePattern } } },
                    { translations: { some: { shortDesc: likePattern } } },
                    { translations: { some: { ingredients: likePattern } } },
                    { translations: { some: { seoKeywords: likePattern } } },
                    { brandName: likePattern },
                    { origin: likePattern },
                    { certifications: likePattern },
                    { sku: likePattern },
                ];
            }
        }

        // Price range filter
        if (minPrice != null && minPrice > 0) {
            where.priceUsd = { ...(where.priceUsd ?? {}), gte: minPrice };
        }
        if (maxPrice != null && maxPrice > 0) {
            where.priceUsd = { ...(where.priceUsd ?? {}), lte: maxPrice };
        }

        // Sort options
        let orderBy: any[];
        switch (sortBy) {
            case 'price_asc':  orderBy = [{ priceUsd: 'asc' }]; break;
            case 'price_desc': orderBy = [{ priceUsd: 'desc' }]; break;
            case 'newest':     orderBy = [{ createdAt: 'desc' }]; break;
            case 'rating':     orderBy = [{ reviewAvg: 'desc' }, { reviewCount: 'desc' }]; break;
            case 'popular':    orderBy = [{ reviewCount: 'desc' }, { reviewAvg: 'desc' }]; break;
            case 'hot':
                where.isHotSale = true;
                orderBy = [{ displayPriority: 'desc' }, { hotSalePrice: 'asc' }, { createdAt: 'desc' }];
                break;
            default:           orderBy = [{ displayPriority: 'desc' }, { isNew: 'desc' }, { createdAt: 'desc' }]; break;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    translations: { where: { langCode: { in: ['en', langCode] } } },
                    category: { select: { slug: true } },
                    images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                },
                orderBy,
                take: Math.min(limit, 100), // 최대 100개 제한
                skip,
            }),
            prisma.product.count({ where }),
        ]);

        return { products: products.map(p => serializeProduct(p, langCode)), total };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { products: [], total: 0 };
    }
}

// ── Fetch small set for homepage sections ─────────────────────────────────
export async function getProductsForSection(
    langCode: string,
    filter: 'hot' | 'new' | 'popular' | 'todaypick',
    limit: number = 8,
): Promise<TranslatedProduct[]> {
    const include = {
        translations: { where: { langCode: { in: ['en', langCode] } } },
        category: { select: { slug: true } },
        images: { orderBy: { sortOrder: 'asc' } as any, take: 1 },
    };
    const baseWhere: any = { status: 'ACTIVE', approvalStatus: 'APPROVED' };
    const dayNum = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    try {
        // ── NEW ARRIVALS ──────────────────────────────────────────────────────
        // Always guarantee the 3 most-recently approved products appear first,
        // then fill the remaining slots with a daily-rotated pool of older ones.
        // This ensures a brand-new product is always visible.
        if (filter === 'new') {
            const GUARANTEED = Math.min(3, limit);
            const REST_SLOTS = limit - GUARANTEED;

            // Top 3 newest (by approval/creation date)
            const guaranteed = await prisma.product.findMany({
                where: baseWhere,
                include,
                orderBy: [{ displayPriority: 'desc' }, { createdAt: 'desc' }],
                take: GUARANTEED,
            });

            if (REST_SLOTS <= 0) return guaranteed.map(p => serializeProduct(p, langCode));

            const guaranteedIds = guaranteed.map(p => p.id);
            const poolSize = Math.min(REST_SLOTS * 4, 30);
            const restPool = await prisma.product.findMany({
                where: { ...baseWhere, id: { notIn: guaranteedIds } },
                include,
                orderBy: [{ displayPriority: 'desc' }, { createdAt: 'desc' }],
                take: poolSize,
            });

            let rotated: typeof restPool;
            if (restPool.length <= REST_SLOTS) {
                rotated = restPool;
            } else {
                const maxStart = restPool.length - REST_SLOTS;
                const startIdx = dayNum % (maxStart + 1);
                rotated = restPool.slice(startIdx, startIdx + REST_SLOTS);
            }

            return [...guaranteed, ...rotated].map(p => serializeProduct(p, langCode));
        }

        // ── POPULAR ───────────────────────────────────────────────────────────
        // Top reviewers fill most slots, but up to 2 slots reserved for
        // products approved within the last 14 days that haven't built reviews yet.
        if (filter === 'popular') {
            const NEW_BOOST_SLOTS = 2;
            const MAIN_SLOTS = limit - NEW_BOOST_SLOTS;
            const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

            // Newly approved products (< 14 days, no/few reviews)
            const boosted = await prisma.product.findMany({
                where: { ...baseWhere, createdAt: { gte: fourteenDaysAgo } },
                include,
                orderBy: [{ displayPriority: 'desc' }, { createdAt: 'desc' }],
                take: NEW_BOOST_SLOTS,
            });

            const boostedIds = boosted.map(p => p.id);
            const poolSize = Math.min(MAIN_SLOTS * 3, 24);
            const mainPool = await prisma.product.findMany({
                where: { ...baseWhere, id: { notIn: boostedIds } },
                include,
                orderBy: [{ displayPriority: 'desc' }, { reviewAvg: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }],
                take: poolSize,
            });

            let mainSlice: typeof mainPool;
            if (mainPool.length <= MAIN_SLOTS) {
                mainSlice = mainPool;
            } else {
                const maxStart = mainPool.length - MAIN_SLOTS;
                const startIdx = dayNum % (maxStart + 1);
                mainSlice = mainPool.slice(startIdx, startIdx + MAIN_SLOTS);
            }

            return [...mainSlice, ...boosted].map(p => serializeProduct(p, langCode));
        }

        // ── TODAY'S PICKS ─────────────────────────────────────────────────────
        // Admin-curated first; auto-fill remaining slots by order/review activity.
        if (filter === 'todaypick') {
            // 1. Admin-curated picks first (always priority)
            const curated = await prisma.product.findMany({
                where: { ...baseWhere, isTodayPick: true },
                include,
                orderBy: [{ displayPriority: 'desc' }, { createdAt: 'desc' }],
                take: limit,
            });

            if (curated.length >= limit) {
                return curated.map(p => serializeProduct(p, langCode));
            }

            // 2. Auto-fill remaining slots
            const curatedIds = curated.map(p => p.id);
            const remaining = limit - curated.length;
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            // Priority A: Most ordered in last 7 days
            let topOrderedIds: bigint[] = [];
            try {
                const orderCounts = await prisma.orderItem.groupBy({
                    by: ['productId'],
                    where: {
                        product: { status: 'ACTIVE', approvalStatus: 'APPROVED' },
                        order: { createdAt: { gte: sevenDaysAgo } },
                    },
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: remaining * 3,
                });
                topOrderedIds = orderCounts
                    .map(oc => oc.productId)
                    .filter(id => !curatedIds.includes(id));
            } catch { /* groupBy may fail if no orders */ }

            // Priority B: Most reviewed in last 7 days
            let topReviewedIds: bigint[] = [];
            try {
                const reviewCounts = await prisma.productReview.groupBy({
                    by: ['productId'],
                    where: {
                        createdAt: { gte: sevenDaysAgo },
                        status: 'APPROVED',
                    },
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: remaining * 2,
                });
                topReviewedIds = reviewCounts
                    .map(rc => rc.productId)
                    .filter(id => !curatedIds.includes(id));
            } catch { /* groupBy may fail if no reviews */ }

            // Priority C: Recently approved (fallback)
            const recentPool = await prisma.product.findMany({
                where: { ...baseWhere, id: { notIn: curatedIds } },
                include,
                orderBy: [{ createdAt: 'desc' }],
                take: remaining * 3,
            });

            // Merge with priority order, avoiding duplicates
            const filledIds = new Set(curatedIds.map(id => id.toString()));
            const filled: typeof curated = [];

            // Helper to pick from recentPool by ID
            const pickById = (targetId: bigint) => {
                const idStr = targetId.toString();
                if (filledIds.has(idStr)) return;
                const prod = recentPool.find(p => p.id === targetId);
                if (prod && filled.length < remaining) {
                    filled.push(prod);
                    filledIds.add(idStr);
                }
            };

            // Apply priorities
            topOrderedIds.forEach(pickById);
            topReviewedIds.forEach(pickById);
            // Fill rest from recent
            for (const prod of recentPool) {
                if (filled.length >= remaining) break;
                const idStr = prod.id.toString();
                if (!filledIds.has(idStr)) {
                    filled.push(prod);
                    filledIds.add(idStr);
                }
            }

            return [...curated, ...filled].map(p => serializeProduct(p, langCode));
        }

        // ── HOT DEALS ─────────────────────────────────────────────────────────
        // Flag-based section — daily rotation from isHotSale pool
        const where: any = { ...baseWhere, isHotSale: true };
        const orderBy: any[] = [{ displayPriority: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }];

        const poolSize = Math.min(limit * 3, 24);
        const pool = await prisma.product.findMany({ where, include, orderBy, take: poolSize });

        if (pool.length <= limit) return pool.map(p => serializeProduct(p, langCode));

        const maxStart = pool.length - limit;
        const startIdx = dayNum % (maxStart + 1);
        return pool.slice(startIdx, startIdx + limit).map(p => serializeProduct(p, langCode));

    } catch (error) {
        console.error('Error fetching products for section:', error);
        return [];
    }
}

// ── Fetch all categories (flat list, includes parentId) ───────────────────
export async function getAllCategories(): Promise<CategoryInfo[]> {
    const cats = await prisma.category.findMany({
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
        include: { _count: { select: { products: true } } },
    });
    return cats.map(c => ({
        id: c.id.toString(),
        slug: c.slug,
        nameKo: c.nameKo,
        nameEn: c.nameEn,
        nameKm: c.nameKm,
        nameZh: c.nameZh,
        sortOrder: c.sortOrder,
        isSystem: c.isSystem,
        parentId: c.parentId ? c.parentId.toString() : null,
        productCount: (c as any)._count?.products ?? 0,
    }));
}

// ── Build category tree (top-level with children nested) ──────────────────
export function buildCategoryTree(flat: CategoryInfo[]): CategoryInfo[] {
    const map: Record<string, CategoryInfo> = {};
    const roots: CategoryInfo[] = [];
    flat.forEach(c => { map[c.id] = { ...c, children: [] }; });
    flat.forEach(c => {
        if (c.parentId && map[c.parentId]) {
            map[c.parentId]!.children!.push(map[c.id]!);
        } else {
            roots.push(map[c.id]!);
        }
    });
    return roots;
}
