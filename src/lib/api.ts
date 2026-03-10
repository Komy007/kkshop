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
    hotSalePrice?: number | null;
    reviewAvg: number;
    reviewCount: number;
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
    productCount?: number;
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
        hotSalePrice: product.hotSalePrice ? Number(product.hotSalePrice) : null,
        reviewAvg: Number(product.reviewAvg ?? 0),
        reviewCount: product.reviewCount ?? 0,
        brandName: product.brandName ?? null,
        volume: product.volume ?? null,
        skinType: product.skinType ?? null,
        origin: product.origin ?? null,
        certifications: product.certifications ?? null,
        expiryMonths: product.expiryMonths ?? null,
        // name: always English
        name: enTrans.name || localTrans.name || product.sku,
        // descriptions: user's language, fallback to English
        shortDesc: localTrans.shortDesc ?? enTrans.shortDesc ?? null,
        detailDesc: localTrans.detailDesc ?? enTrans.detailDesc ?? null,
        seoKeywords: localTrans.seoKeywords ?? enTrans.seoKeywords ?? null,
        ingredients: localTrans.ingredients ?? enTrans.ingredients ?? null,
        howToUse: localTrans.howToUse ?? enTrans.howToUse ?? null,
        benefits: localTrans.benefits ?? enTrans.benefits ?? null,
    };
}

// ── Fetch by Category Slug ─────────────────────────────────────────────────
export async function getProductsByLanguage(
    langCode: string,
    categorySlug?: string | null
): Promise<TranslatedProduct[]> {
    try {
        const where: any = { status: 'ACTIVE', approvalStatus: 'APPROVED' };

        if (categorySlug) {
            if (categorySlug === 'new') {
                // 신상품: isNew=true 이거나 신상품 카테고리
                where.OR = [
                    { isNew: true },
                    { category: { slug: 'new' } },
                ];
            } else if (categorySlug === 'all') {
                // 전체보기: 필터 없음
            } else {
                where.category = { slug: categorySlug };
            }
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                // Fetch both EN (for name) and requested lang (for descriptions)
                translations: { where: { langCode: { in: ['en', langCode] } } },
                category: { select: { slug: true } },
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
            orderBy: [
                { isNew: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        return products.map(p => serializeProduct(p, langCode));
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// ── Fetch all categories ───────────────────────────────────────────────────
export async function getAllCategories(): Promise<CategoryInfo[]> {
    const cats = await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
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
        productCount: (c as any)._count?.products ?? 0,
    }));
}
