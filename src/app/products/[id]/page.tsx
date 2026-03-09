import { Metadata } from 'next';
import { prisma } from '@/lib/api';
import ProductDetailClient from './ProductDetailClient';

const BASE_URL = 'https://kkshop.cc';

// ── SEO: dynamic metadata per product ──────────────────────────────────────
export async function generateMetadata(
    { params }: { params: { id: string } }
): Promise<Metadata> {
    try {
        const product = await prisma.product.findUnique({
            where: { id: BigInt(params.id) },
            include: {
                translations: {
                    where: { langCode: 'en' },
                    select: { name: true, shortDesc: true, seoKeywords: true },
                },
            },
        });

        if (!product) {
            return {
                title: 'Product Not Found | KKShop',
                description: 'The product you are looking for could not be found.',
            };
        }

        const t = product.translations[0];
        const name = t?.name ?? product.sku;
        const description = t?.shortDesc
            ?? `Shop ${name} at KKShop — Cambodia's K-Beauty & K-Living store. Delivered to your door.`;
        const keywords = t?.seoKeywords ?? undefined;
        const imageUrl = product.imageUrl ?? undefined;
        const productUrl = `${BASE_URL}/products/${params.id}`;

        return {
            title: `${name} | KKShop`,
            description,
            keywords,
            alternates: { canonical: productUrl },
            openGraph: {
                title: `${name} | KKShop`,
                description,
                url: productUrl,
                siteName: 'KKShop',
                type: 'website',
                images: imageUrl
                    ? [{ url: imageUrl, alt: name, width: 800, height: 800 }]
                    : [],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${name} | KKShop`,
                description,
                images: imageUrl ? [imageUrl] : [],
            },
        };
    } catch {
        return { title: 'KKShop — K-Beauty Cambodia' };
    }
}

// ── Page: server wrapper renders the full client component ─────────────────
export default function ProductDetailPage() {
    return <ProductDetailClient />;
}
