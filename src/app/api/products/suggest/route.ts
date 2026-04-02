import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/suggest?q=xxx&lang=en
 * Returns lightweight suggestions for search autocomplete:
 * - Matching brand names (distinct, max 3)
 * - Matching product names (max 5)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const lang = searchParams.get('lang') || 'en';

    if (!q || q.length < 2) {
        return NextResponse.json({ brands: [], products: [] });
    }

    try {
        const likePattern = { contains: q, mode: 'insensitive' as const };

        // Parallel: brand suggestions + product name suggestions
        const [brandResults, productResults] = await Promise.all([
            prisma.product.findMany({
                where: {
                    status: 'ACTIVE',
                    approvalStatus: 'APPROVED',
                    brandName: likePattern,
                },
                select: { brandName: true },
                distinct: ['brandName'],
                take: 3,
            }),
            prisma.product.findMany({
                where: {
                    status: 'ACTIVE',
                    approvalStatus: 'APPROVED',
                    OR: [
                        { translations: { some: { name: likePattern, langCode: lang } } },
                        { translations: { some: { name: likePattern, langCode: 'en' } } },
                        { brandName: likePattern },
                    ],
                },
                include: {
                    translations: {
                        where: { langCode: { in: ['en', lang] } },
                        select: { name: true, langCode: true },
                    },
                },
                take: 5,
                orderBy: [{ reviewCount: 'desc' }, { displayPriority: 'desc' }],
            }),
        ]);

        const brands = brandResults
            .map(p => p.brandName)
            .filter((b): b is string => !!b);

        const products = productResults.map(p => {
            const localTrans = p.translations.find(t => t.langCode === lang);
            const enTrans = p.translations.find(t => t.langCode === 'en');
            return {
                id: p.id.toString(),
                name: localTrans?.name || enTrans?.name || '',
            };
        });

        return NextResponse.json({ brands, products });
    } catch (error) {
        console.error('Suggest API error:', error);
        return NextResponse.json({ brands: [], products: [] });
    }
}
