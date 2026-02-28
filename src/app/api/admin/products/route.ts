import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { Translate } from '@google-cloud/translate/build/src/v2';

// Initialize Google Cloud Translation API Client
// Important: This requires GOOGLE_APPLICATION_CREDENTIALS in .env
const translate = new Translate();

const TARGET_LANGS = ['ko', 'en', 'km', 'zh'];

export async function POST(req: Request) {
    try {
        // 1. Authenticate Admin/SuperAdmin User
        const session = await auth();
        if (!session?.user || session.user.role === 'USER') {
            return NextResponse.json({ error: 'Unauthorized Access. Admin required.' }, { status: 403 });
        }

        const body = await req.json();
        const {
            sku,
            priceUsd,
            stockQty,
            categoryId,
            baseLang, // e.g., 'ko' or 'en'
            name,
            shortDesc,
            detailDesc,
            seoKeywords
        } = body;

        if (!sku || !priceUsd || !name || !baseLang) {
            return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
        }

        // 2. Perform Translations
        // We need to translate the base text into all target languages EXCEPT the baseLang itself.
        const translationsData: Array<{
            langCode: string;
            name: string;
            shortDesc: string | null;
            detailDesc: string | null;
            seoKeywords: string | null;
        }> = [];

        for (const lang of TARGET_LANGS) {
            if (lang === baseLang) {
                // Keep the original text for the base language
                translationsData.push({
                    langCode: lang,
                    name: name,
                    shortDesc: shortDesc || null,
                    detailDesc: detailDesc || null,
                    seoKeywords: seoKeywords || null,
                });
            } else {
                // Call Google Cloud Translate for the other languages
                try {
                    const [translatedName] = await translate.translate(name, lang);

                    let translatedShortDesc = shortDesc;
                    if (shortDesc) {
                        [translatedShortDesc] = await translate.translate(shortDesc, lang);
                    }

                    let translatedDetailDesc = detailDesc;
                    if (detailDesc) {
                        [translatedDetailDesc] = await translate.translate(detailDesc, lang);
                    }

                    let translatedSeoKeywords = seoKeywords;
                    if (seoKeywords) {
                        [translatedSeoKeywords] = await translate.translate(seoKeywords, lang);
                    }

                    translationsData.push({
                        langCode: lang,
                        name: translatedName,
                        shortDesc: translatedShortDesc || null,
                        detailDesc: translatedDetailDesc || null,
                        seoKeywords: translatedSeoKeywords || null,
                    });
                } catch (translationError) {
                    console.error(`Translation failed for language: ${lang}`, translationError);
                    // Fallback to English/Base text with a warning if translation fails
                    translationsData.push({
                        langCode: lang,
                        name: `[Auto-failed] ${name}`,
                        shortDesc: shortDesc || null,
                        detailDesc: detailDesc || null,
                        seoKeywords: seoKeywords || null,
                    });
                }
            }
        }

        // 3. Save to Database using Prisma Transaction
        const newProduct = await prisma.$transaction(async (tx) => {
            // Create root Product object
            const product = await tx.product.create({
                data: {
                    sku,
                    priceUsd: parseFloat(priceUsd),
                    stockQty: parseInt(stockQty) || 0,
                    categoryId: categoryId ? BigInt(categoryId) : null,
                    status: 'ACTIVE',
                }
            });

            // Make sure to attach the newly generated absolute productId
            const translationsToInsert = translationsData.map(t => ({
                ...t,
                productId: product.id
            }));

            // Create all ProductTranslation objects
            await tx.productTranslation.createMany({
                data: translationsToInsert
            });

            return product; // Return main product
        });

        // Convert BigInt to string for JSON serialization
        return NextResponse.json({
            success: true,
            productId: newProduct.id.toString(),
            message: 'Product registered and auto-translated successfully.',
            translations: translationsData
        });

    } catch (error: any) {
        console.error('Error creating product:', error);

        // Handle specific Prisma errors like Unique Constraint on SKU
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
