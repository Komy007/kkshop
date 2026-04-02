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
    try {
        const where: any = { status: 'ACTIVE', approvalStatus: 'APPROVED' };
        let orderBy: any[] = [{ createdAt: 'desc' }];

        if (filter === 'todaypick') {
            where.isTodayPick = true;
            orderBy = [{ displayPriority: 'desc' }, { createdAt: 'desc' }];
        } else if (filter === 'hot') {
            where.isHotSale = true;
            orderBy = [{ displayPriority: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }];
        } else if (filter === 'new') {
            orderBy = [{ displayPriority: 'desc' }, { createdAt: 'desc' }];
        } else if (filter === 'popular') {
            orderBy = [{ displayPriority: 'desc' }, { reviewAvg: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }];
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                translations: { where: { langCode: { in: ['en', langCode] } } },
                category: { select: { slug: true } },
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
            orderBy,
            take: limit,
        });

        return products.map(p => serializeProduct(p, langCode));
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
