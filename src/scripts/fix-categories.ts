import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching categories...');
    const cats = await prisma.category.findMany();
    const hairBodyId = cats.find(c => c.slug === 'hair-body')?.id;
    const saleId = cats.find(c => c.slug === 'sale')?.id;

    if (hairBodyId) {
        const update1 = await prisma.product.updateMany({
            where: { sku: { startsWith: 'SAMP-HAIRBODY' } },
            data: { categoryId: hairBodyId }
        });
        console.log(`Updated ${update1.count} HAIRBODY products`);
    }

    if (saleId) {
        const update2 = await prisma.product.updateMany({
            where: { sku: { startsWith: 'SAMP-DISCOUNT' } },
            data: { categoryId: saleId }
        });
        console.log(`Updated ${update2.count} DISCOUNT products`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
