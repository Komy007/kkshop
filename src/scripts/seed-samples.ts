import { PrismaClient } from '@prisma/client';
import { Translate } from '@google-cloud/translate/build/src/v2';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly for standalone script
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const translate = new Translate();

const TARGET_LANGS = ['ko', 'en', 'km', 'zh'];

// Sample definitions
const sampleData = [
    { categoryTitle: '스킨케어', categoryPrefix: 'skincare', maxItems: 3, defaultPrice: 20 },
    { categoryTitle: '메이크업', categoryPrefix: 'makeup', maxItems: 3, defaultPrice: 15 },
    { categoryTitle: '헤어/바디', categoryPrefix: 'hairbody', maxItems: 3, defaultPrice: 25 },
    { categoryTitle: '생활용품', categoryPrefix: 'living', maxItems: 3, defaultPrice: 10 },
    { categoryTitle: '건강식품', categoryPrefix: 'health', maxItems: 3, defaultPrice: 40 },
];

async function seed() {
    console.log('🌱 Starting KKshop DB Seeding with Google Auto-Translation...');

    try {
        for (const data of sampleData) {
            console.log(`\nProcessing Category: ${data.categoryTitle}`);

            for (let i = 1; i <= data.maxItems; i++) {
                const baseName = `[샘플] 최고급 ${data.categoryTitle} 상품 ${i}호`;
                const baseShortDesc = `한국에서 엄선된 프리미엄 ${data.categoryTitle} 컬렉션 - ${i}번째 구성`;
                const baseDetailDesc = `이 상품은 테스트를 위해 자동 생성된 ${data.categoryTitle}의 샘플 상세 페이지입니다. 높은 품질과 디자인을 보증합니다.`;
                const baseKeywords = `${data.categoryTitle}, 샘플, 한국, 화장품, 뷰티`;

                const sku = `SAMP-${data.categoryPrefix.toUpperCase()}-0${i}`;

                // 1. Check if SKU exists to avoid duplicates
                const existing = await prisma.product.findUnique({ where: { sku } });
                if (existing) {
                    console.log(`   - ${sku} already exists. Skipping.`);
                    continue;
                }

                console.log(`   - Translating and creating ${sku}...`);

                // 2. Perform Translations
                const translationsData: Array<{
                    langCode: string;
                    name: string;
                    shortDesc: string;
                    detailDesc: string;
                    seoKeywords: string;
                }> = [];
                for (const lang of TARGET_LANGS) {
                    if (lang === 'ko') {
                        translationsData.push({
                            langCode: 'ko',
                            name: baseName,
                            shortDesc: baseShortDesc,
                            detailDesc: baseDetailDesc,
                            seoKeywords: baseKeywords,
                        });
                    } else {
                        // Google Cloud Translate
                        const [translatedName] = await translate.translate(baseName, lang);
                        const [translatedShortDesc] = await translate.translate(baseShortDesc, lang);
                        const [translatedDetailDesc] = await translate.translate(baseDetailDesc, lang);
                        const [translatedKeywords] = await translate.translate(baseKeywords, lang);

                        translationsData.push({
                            langCode: lang,
                            name: translatedName,
                            shortDesc: translatedShortDesc,
                            detailDesc: translatedDetailDesc,
                            seoKeywords: translatedKeywords,
                        });
                    }
                }

                // 3. Insert into DB with transaction
                await prisma.$transaction(async (tx) => {
                    const product = await tx.product.create({
                        data: {
                            sku,
                            priceUsd: data.defaultPrice + (i * 2),
                            stockQty: 100,
                            status: 'ACTIVE',
                        }
                    });

                    const translationsToInsert = translationsData.map(t => ({
                        ...t,
                        productId: product.id
                    }));

                    await tx.productTranslation.createMany({
                        data: translationsToInsert
                    });
                });

                console.log(`     ✅ Success: ${sku} created with all 4 languages.`);
            }
        }

        console.log('\n🎉 Finished Seeding Sample Products Successfully!');
    } catch (e) {
        console.error('❌ Error during seeding:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
