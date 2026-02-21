import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Type definition for translated product response
export interface TranslatedProduct {
    id: string; // Using string to bypass BigInt JSON serialization issues
    sku: string;
    priceUsd: number;
    stockQty: number;
    categoryId?: string | null;
    status: string;

    // Transformed fields from Translation table matched to current language
    name: string;
    shortDesc: string | null;
    detailDesc: string | null;
    seoKeywords: string | null;
}

/**
 * Fetch products and map their translations to a specific language.
 */
export async function getProductsByLanguage(langCode: string): Promise<TranslatedProduct[]> {
    try {
        const products = await prisma.product.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                translations: {
                    where: {
                        langCode: langCode,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            // Limit to 10 for display purposes on the homepage
            take: 10,
        });

        return products.map(product => {
            // Find the translation for the requested language
            // Fallback: If translation is missing (edge case), use first available or empty string
            const translation = product.translations[0] || {
                name: `[${langCode}] ${product.sku}`,
                shortDesc: null,
                detailDesc: null,
                seoKeywords: null
            };

            return {
                id: product.id.toString(), // Convert BigInt to string for Next.js Serializability
                sku: product.sku,
                priceUsd: Number(product.priceUsd), // Decimal -> Number
                stockQty: product.stockQty,
                categoryId: product.categoryId?.toString() || null,
                status: product.status,
                name: translation.name,
                shortDesc: translation.shortDesc,
                detailDesc: translation.detailDesc,
                seoKeywords: translation.seoKeywords,
            };
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}
