import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── 카테고리 정의 ──────────────────────────────────────────────────────
const CATEGORIES = [
    { slug: 'skincare', nameKo: '스킨케어', nameEn: 'Skincare', nameKm: 'ថែស្បែក', nameZh: '护肤', sortOrder: 1, isSystem: false },
    { slug: 'makeup', nameKo: '메이크업', nameEn: 'Makeup', nameKm: 'គ្រឿងសំអាង', nameZh: '彩妆', sortOrder: 2, isSystem: false },
    { slug: 'hair-body', nameKo: '헤어/바디', nameEn: 'Hair & Body', nameKm: 'សក់/រាងកាយ', nameZh: '洗护', sortOrder: 3, isSystem: false },
    { slug: 'living', nameKo: '생활용품', nameEn: 'Living', nameKm: 'គ្រឿងប្រើប្រាស់', nameZh: '生活用品', sortOrder: 4, isSystem: false },
    { slug: 'health', nameKo: '건강식품', nameEn: 'Health', nameKm: 'សុខភាព', nameZh: '保健品', sortOrder: 5, isSystem: false },
    { slug: 'best', nameKo: '베스트', nameEn: 'Bestseller', nameKm: 'ពេញនិយម', nameZh: '热销', sortOrder: 6, isSystem: true },
    { slug: 'new', nameKo: '신상품', nameEn: 'New Arrivals', nameKm: 'ផលិតផលថ្មី', nameZh: '新品', sortOrder: 7, isSystem: true },
    { slug: 'sale', nameKo: '할인', nameEn: 'Sale', nameKm: 'បញ្ចុះតម្លៃ', nameZh: '折扣', sortOrder: 8, isSystem: true },
    { slug: 'all', nameKo: '전체보기', nameEn: 'All Products', nameKm: 'ទំនិញទាំងអស់', nameZh: '全部', sortOrder: 9, isSystem: false },
    { slug: 'foryou', nameKo: 'FOR YOU', nameEn: 'For You', nameKm: 'សម្រាប់អ្នក', nameZh: '为你推荐', sortOrder: 10, isSystem: true },
];

// SKU 접두사 → 카테고리 슬러그 매핑
const SKU_TO_SLUG: Record<string, string> = {
    'SKINCARE': 'skincare',
    'MAKEUP': 'makeup',
    'HAIRBODY': 'hair-body',
    'LIVING': 'living',
    'HEALTH': 'health',
    'BEST': 'best',
    'NEW': 'new',
    'DISCOUNT': 'sale',
    'ALL': 'all',
    'FORYOU': 'foryou',
};

async function main() {
    console.log('🌱 카테고리 시드 시작...');

    // 1. 카테고리 upsert
    const categoryMap: Record<string, bigint> = {};
    for (const cat of CATEGORIES) {
        const created = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: { nameKo: cat.nameKo, nameEn: cat.nameEn, nameKm: cat.nameKm, nameZh: cat.nameZh, sortOrder: cat.sortOrder, isSystem: cat.isSystem },
            create: cat,
        });
        categoryMap[cat.slug] = created.id;
        console.log(`  ✅ 카테고리: ${cat.nameKo} (id=${created.id})`);
    }

    // 2. 기존 샘플 상품 → categoryId 설정
    const products = await prisma.product.findMany({
        where: { sku: { startsWith: 'SAMP-' } },
        select: { id: true, sku: true, isNew: true },
    });

    console.log(`\n🔄 샘플 상품 ${products.length}개 카테고리 연결 시작...`);

    for (const p of products) {
        // SAMP-SKINCARE-01 → prefix = SKINCARE
        const parts = p.sku.split('-');
        const prefix = parts[1] || '';
        const slug = SKU_TO_SLUG[prefix];

        if (!slug) {
            console.log(`  ⚠️ 알 수 없는 SKU 접두사: ${p.sku}`);
            continue;
        }

        const categoryId = categoryMap[slug];
        const isNewProduct = (slug === 'new');

        await prisma.product.update({
            where: { id: p.id },
            data: {
                categoryId: BigInt(categoryId as bigint),
                isNew: isNewProduct,
                status: 'ACTIVE' as string,
            } as any,
        });
        console.log(`  ✅ ${p.sku} → ${slug} (isNew: ${isNewProduct})`);
    }

    // 3. categoryId=null 비샘플 상품은 'all' 카테고리로
    const uncategorized = await prisma.product.findMany({
        where: { categoryId: null, sku: { not: { startsWith: 'SAMP-' } } },
        select: { id: true, sku: true },
    });

    if (uncategorized.length > 0) {
        const allId = categoryMap['all'];
        await prisma.product.updateMany({
            where: { id: { in: uncategorized.map(p => p.id) } },
            data: { categoryId: allId as bigint, status: 'ACTIVE' } as any,
        });

        console.log(`\n  ✅ 미분류 상품 ${uncategorized.length}개 → 전체보기(all) 카테고리로 설정`);
    }

    console.log('\n🎉 카테고리 시드 및 마이그레이션 완료!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
