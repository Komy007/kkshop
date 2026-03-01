import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const products = await prisma.product.findMany({
        where: { sku: { startsWith: 'SAMP-' } },
        select: { sku: true, status: true },
        take: 10
    });
    console.log('Seeded Samples:', products.length, products);
}

check().finally(() => prisma.$disconnect());
