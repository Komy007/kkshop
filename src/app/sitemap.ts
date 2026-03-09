import { MetadataRoute } from 'next';
import { prisma } from '@/lib/api';

const BASE_URL = 'https://kkshop.cc';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/signup`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    // Active product pages
    try {
        const products = await prisma.product.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });

        const productPages: MetadataRoute.Sitemap = products.map((p) => ({
            url: `${BASE_URL}/products/${p.id.toString()}`,
            lastModified: p.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

        return [...staticPages, ...productPages];
    } catch {
        return staticPages;
    }
}
