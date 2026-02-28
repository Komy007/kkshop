import { PrismaClient } from '@prisma/client';
import { Translate } from '@google-cloud/translate/build/src/v2';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly for standalone script
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const translate = new Translate();

const TARGET_LANGS = ['ko', 'en', 'km', 'zh'];

// Sample definitions with Real High-Res Unsplash Image URLs
const sampleData = [
    {
        categoryTitle: '스킨케어', categoryPrefix: 'skincare', maxItems: 3, defaultPrice: 20,
        images: [
            'https://images.unsplash.com/photo-1580870059942-159fd87aa04f?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=500'
        ]
    },
    {
        categoryTitle: '메이크업', categoryPrefix: 'makeup', maxItems: 3, defaultPrice: 15,
        images: [
            'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1512496015851-a1aacf8ca60e?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500'
        ]
    },
    {
        categoryTitle: '헤어/바디', categoryPrefix: 'hairbody', maxItems: 3, defaultPrice: 25,
        images: [
            'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1608248593842-8010baac8b78?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1563170351-136b80145c2f?auto=format&fit=crop&q=80&w=500'
        ]
    },
    {
        categoryTitle: '생활용품', categoryPrefix: 'living', maxItems: 3, defaultPrice: 10,
        images: [
            'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=500'
        ]
    },
    {
        categoryTitle: '건강식품', categoryPrefix: 'health', maxItems: 3, defaultPrice: 40,
        images: [
            'https://images.unsplash.com/photo-1550572017-edb73e35a14d?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1498837167922-41c305a3064e?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&q=80&w=500'
        ]
    },
];

async function seed() {
    console.log('🌱 Starting KKshop DB Seeding with Images and Translations...');

    try {
        // 0. Remove existing samples to cleanly inject new ones with images
        console.log('🧹 Purging old SAMPLE products to refresh schema...');
        await prisma.product.deleteMany({
            where: {
                sku: { startsWith: 'SAMP-' }
            }
        });

        for (const data of sampleData) {
            console.log(`\nProcessing Category: ${data.categoryTitle}`);

            for (let i = 1; i <= data.maxItems; i++) {
                const baseName = `[샘플] 최고급 ${data.categoryTitle} 상품 ${i}호`;
                const baseShortDesc = `한국에서 엄선된 프리미엄 ${data.categoryTitle} 컬렉션 - ${i}번째 구성`;
                const baseDetailDesc = `이 상품은 테스트를 위해 자동 생성된 ${data.categoryTitle}의 샘플 상세 페이지입니다. 높은 품질과 디자인을 보증합니다.`;
                const baseKeywords = `${data.categoryTitle}, 샘플, 한국, 화장품, 뷰티`;

                const sku = `SAMP-${data.categoryPrefix.toUpperCase()}-0${i}`;
                const imageUrl = data.images[i - 1]; // Pull corresponding image

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
                            imageUrl: imageUrl,
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

                console.log(`     ✅ Success: ${sku} created with image and translations.`);
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
