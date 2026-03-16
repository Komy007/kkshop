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
            url: `${BASE_URL}/search`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
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

    // Category pages
    const categorySlugs = ['skincare', 'makeup', 'hair-body', 'living', 'health', 'new', 'best', 'sale'];
    const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
        url: `${BASE_URL}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    // Active product pages
    try {
        const [products, categories] = await Promise.all([
            prisma.product.findMany({
                where: { status: 'ACTIVE', approvalStatus: 'APPROVED' },
                select: { id: true, updatedAt: true },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.category.findMany({
                where: { parentId: null }, // Top-level categories only
                select: { slug: true, updatedAt: true },
            }),
        ]);

        const productPages: MetadataRoute.Sitemap = products.map((p) => ({
            url: `${BASE_URL}/products/${p.id.toString()}`,
            lastModified: p.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

        const dbCategoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
            url: `${BASE_URL}/category/${c.slug}`,
            lastModified: c.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 0.9,
        }));

        // Merge static and dynamic category pages (deduplicate)
        const allCategoryUrls = new Set(categoryPages.map(c => c.url));
        const uniqueDbCategories = dbCategoryPages.filter(c => !allCategoryUrls.has(c.url));

        return [...staticPages, ...categoryPages, ...uniqueDbCategories, ...productPages];
    } catch {
        return [...staticPages, ...categoryPages];
    }
}
