import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- SETTINGS ---');
    const settings = await prisma.siteSetting.findMany();
    console.log(JSON.stringify(settings, null, 2));

    console.log('\n--- SAMPLE PRODUCTS ---');
    const products = await prisma.product.findMany({
        where: { sku: { startsWith: 'SAMP-' } },
        include: { category: true }
    });
    console.log(`Total sample products: ${products.length}`);
    const noCat = products.filter(p => !p.categoryId);
    console.log(`Products without category: ${noCat.length}`);
    if (products.length > 0) {
        const first = products[0];
        console.log('Sample 1:', { sku: first?.sku, category: first?.category?.slug });
    }

    console.log('\n--- CATEGORIES ---');
    const cats = await prisma.category.findMany();
    console.log(cats.map(c => c.slug).join(', '));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
