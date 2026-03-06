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
        categoryTitle: '헤어/바디', categoryPrefix: 'hair-body', maxItems: 3, defaultPrice: 25,
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
    {
        categoryTitle: '베스트', categoryPrefix: 'best', maxItems: 3, defaultPrice: 30,
        images: [
            'https://images.unsplash.com/photo-1588731234159-8b9963143fca?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=500'
        ]
    },
    {
        categoryTitle: '신상품', categoryPrefix: 'new', maxItems: 3, defaultPrice: 35,
        images: [
            'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1534639633288-724d193ed963?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?auto=format&fit=crop&q=80&w=500'
        ]
    },
    {
        categoryTitle: '할인', categoryPrefix: 'sale', maxItems: 3, defaultPrice: 10,
        images: [
            'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1595166664984-7acb2a36b306?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=500'
        ]
    },
    {
        categoryTitle: '전체보기', categoryPrefix: 'all', maxItems: 3, defaultPrice: 20,
        images: [
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=500'
        ]
    },
    {
        categoryTitle: 'FOR YOU', categoryPrefix: 'foryou', maxItems: 3, defaultPrice: 25,
        images: [
            'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1571781526291-c477ebefa68c?auto=format&fit=crop&q=80&w=500',
            'https://images.unsplash.com/photo-1580870059942-159fd87aa04f?auto=format&fit=crop&q=80&w=500'
        ]
    }
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

        // 0.5 Fetch existing categories to assign products correctly
        const categories = await prisma.category.findMany();

        for (const data of sampleData) {
            console.log(`\nProcessing Category: ${data.categoryTitle}`);

            for (let i = 1; i <= data.maxItems; i++) {
                const imageUrl = data.images && data.images.length > i - 1
                    ? data.images[i - 1]
                    : `https://picsum.photos/seed/kkshop_${data.categoryPrefix}_${i}/500/500`;

                const baseName = `[KKshop 단독] 프리미엄 ${data.categoryTitle} 컬렉션 ${i}호`;
                const baseShortDesc = `한국에서 엄선된 성분으로 완성된 프리미엄 ${data.categoryTitle} 스페셜 솔루션. 피부 활력과 보습을 동시에 부여합니다.`;
                const baseDetailDesc = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #E52528; border-bottom: 2px solid #E52528; padding-bottom: 10px;">프리미엄 K-뷰티의 정수, 당신의 루틴을 완성하세요.</h2>
  <img src="${imageUrl}" alt="상품 상세 이미지" style="width: 100%; max-width: 600px; border-radius: 12px; margin: 20px 0;" />
  <p>최고급 한국산 원료를 특허받은 공법으로 추출하여 피부 깊숙이 유효성분을 전달합니다. <strong>KKshop</strong>이 자신 있게 선보이는 이 제품은 끈적임 없이 놀라운 흡수력을 자랑합니다.</p>
  
  <h3 style="margin-top: 30px;">🌟 핵심 포인트</h3>
  <ul style="padding-left: 20px;">
    <li>피부 저자극 테스트 완료 (Dermatologist Tested)</li>
    <li>자연 유래 성분 98% 함유로 민감한 피부도 안심</li>
    <li>미백 / 주름개선 이중 기능성 화장품 인증</li>
  </ul>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #E52528;">
    <strong>※ 유의사항</strong>
    <p style="margin: 0; font-size: 0.9em;">본 상품 상세 정보는 실 상품 데이터 입력을 위한 테스트용 데이터입니다.</p>
  </div>
</div>
                `;
                const baseIngredients = "정제수, 부틸렌글라이콜, 글리세린, 나이아신아마이드, 1,2-헥산다이올, 병풀추출물, 알란토인, 판테놀, 소듐하이알루로네이트, 마데카소사이드, 세라마이드엔피, 아데노신, 쇠비름추출물, 카보머, 알지닌, 시트릭애씨드, 소듐시트레이트, 향료";
                const baseHowToUse = "세안 후 적당량을 덜어 피부 결을 따라 부드럽게 펴 바르고 가볍게 두드려 흡수시켜 줍니다.";
                const baseKeywords = `${data.categoryTitle}, 한국 화장품, 뷰티, 스킨케어, 보습, 프리미엄`;

                const sku = `SAMP-${data.categoryPrefix.toUpperCase()}-0${i}`;

                console.log(`   - Translating and creating ${sku}...`);

                // 2. Perform Translations
                const translationsData: Array<{
                    langCode: string;
                    name: string;
                    shortDesc: string;
                    detailDesc: string;
                    seoKeywords: string;
                    ingredients: string;
                    howToUse: string;
                }> = [];
                for (const lang of TARGET_LANGS) {
                    if (lang === 'ko') {
                        translationsData.push({
                            langCode: 'ko',
                            name: baseName,
                            shortDesc: baseShortDesc,
                            detailDesc: baseDetailDesc,
                            seoKeywords: baseKeywords,
                            ingredients: baseIngredients,
                            howToUse: baseHowToUse,
                        });
                    } else {
                        try {
                            // Try Google Cloud Translate
                            const [translatedName] = await translate.translate(baseName, lang);
                            const [translatedShortDesc] = await translate.translate(baseShortDesc, lang);
                            const [translatedDetailDesc] = await translate.translate(baseDetailDesc, lang);
                            const [translatedKeywords] = await translate.translate(baseKeywords, lang);
                            const [translatedIngredients] = await translate.translate(baseIngredients, lang);
                            const [translatedHowToUse] = await translate.translate(baseHowToUse, lang);

                            translationsData.push({
                                langCode: lang,
                                name: translatedName,
                                shortDesc: translatedShortDesc,
                                detailDesc: translatedDetailDesc,
                                seoKeywords: translatedKeywords,
                                ingredients: translatedIngredients,
                                howToUse: translatedHowToUse,
                            });
                        } catch (err) {
                            console.warn(`Translation failed for ${lang}. Using fallback...`);
                            translationsData.push({
                                langCode: lang,
                                name: `[${lang.toUpperCase()}] ${baseName}`,
                                shortDesc: `[${lang.toUpperCase()}] ${baseShortDesc}`,
                                detailDesc: `[${lang.toUpperCase()}] ${baseDetailDesc}`,
                                seoKeywords: `[${lang.toUpperCase()}] ${baseKeywords}`,
                                ingredients: `[${lang.toUpperCase()}] ${baseIngredients}`,
                                howToUse: `[${lang.toUpperCase()}] ${baseHowToUse}`,
                            });
                        }
                    }
                }

                // 3. Map category and Insert into DB with transaction
                const categoryId = categories.find(c => c.slug === data.categoryPrefix)?.id || null;

                await prisma.$transaction(async (tx) => {
                    const product = await tx.product.create({
                        data: {
                            sku,
                            priceUsd: data.defaultPrice + (i * 2),
                            stockQty: 100,
                            categoryId,
                            status: 'ACTIVE',
                            imageUrl: imageUrl || null,
                            brandName: 'KKshop Official',
                            origin: 'South Korea',
                            skinType: 'All Skin Types',
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
