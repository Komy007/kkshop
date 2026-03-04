import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        include: {
            images: { orderBy: { sortOrder: 'asc' } },
            translations: { where: { langCode: 'ko' } },
        },
        orderBy: { id: 'asc' },
    });

    for (const p of products) {
        const name = p.translations[0]?.name || '(이름없음)';
        console.log(`[${p.id}] ${name} | imageUrl: ${p.imageUrl || 'NULL'} | images: ${p.images.length}개`);
        p.images.forEach((img, i) => console.log(`  -> [${i}] ${img.url}`));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
