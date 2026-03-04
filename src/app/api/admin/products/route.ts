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
            baseLang,
            name,
            shortDesc,
            detailDesc,
            ingredients,
            howToUse,
            benefits,
            seoKeywords,
            imageUrls = [],
            supplierId = null,
            // Non-translatable spec fields
            brandName = null,
            volume = null,
            skinType = null,
            origin = null,
            expiryMonths = null,
            certifications = null,
        } = body;

        if (!sku || !priceUsd || !name || !baseLang) {
            return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
        }

        // 2. Perform Translations
        const translationsData: Array<{
            langCode: string;
            name: string;
            shortDesc: string | null;
            detailDesc: string | null;
            seoKeywords: string | null;
            ingredients: string | null;
            howToUse: string | null;
            benefits: string | null;
        }> = [];

        for (const lang of TARGET_LANGS) {
            if (lang === baseLang) {
                translationsData.push({
                    langCode: lang,
                    name: name,
                    shortDesc: shortDesc || null,
                    detailDesc: detailDesc || null,
                    seoKeywords: seoKeywords || null,
                    ingredients: ingredients || null,
                    howToUse: howToUse || null,
                    benefits: benefits || null,
                });
            } else {
                try {
                    const [translatedName] = await translate.translate(name, lang);

                    let translatedShortDesc = shortDesc;
                    if (shortDesc) { [translatedShortDesc] = await translate.translate(shortDesc, lang); }

                    let translatedDetailDesc = detailDesc;
                    if (detailDesc) { [translatedDetailDesc] = await translate.translate(detailDesc, lang); }

                    let translatedSeoKeywords = seoKeywords;
                    if (seoKeywords) { [translatedSeoKeywords] = await translate.translate(seoKeywords, lang); }

                    let translatedIngredients = ingredients;
                    if (ingredients) { [translatedIngredients] = await translate.translate(ingredients, lang); }

                    let translatedHowToUse = howToUse;
                    if (howToUse) { [translatedHowToUse] = await translate.translate(howToUse, lang); }

                    let translatedBenefits = benefits;
                    if (benefits) { [translatedBenefits] = await translate.translate(benefits, lang); }

                    translationsData.push({
                        langCode: lang,
                        name: translatedName,
                        shortDesc: translatedShortDesc || null,
                        detailDesc: translatedDetailDesc || null,
                        seoKeywords: translatedSeoKeywords || null,
                        ingredients: translatedIngredients || null,
                        howToUse: translatedHowToUse || null,
                        benefits: translatedBenefits || null,
                    });
                } catch (translationError) {
                    console.error(`Translation failed for language: ${lang}`, translationError);
                    translationsData.push({
                        langCode: lang,
                        name: `[Auto-failed] ${name}`,
                        shortDesc: shortDesc || null,
                        detailDesc: detailDesc || null,
                        seoKeywords: seoKeywords || null,
                        ingredients: ingredients || null,
                        howToUse: howToUse || null,
                        benefits: benefits || null,
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
                    imageUrl: imageUrls[0] || null,
                    supplierId: supplierId || null,
                    brandName: brandName || null,
                    volume: volume || null,
                    skinType: skinType || null,
                    origin: origin || null,
                    expiryMonths: expiryMonths ? parseInt(expiryMonths) : null,
                    certifications: certifications || null,
                }
            });

            // Save all images to ProductImage table
            if (imageUrls.length > 0) {
                await tx.productImage.createMany({
                    data: imageUrls.map((url: string, idx: number) => ({
                        productId: product.id,
                        url,
                        sortOrder: idx,
                    })),
                });
            }

            // Create all ProductTranslation objects
            await tx.productTranslation.createMany({
                data: translationsData.map(t => ({ ...t, productId: product.id }))
            });

            return product;
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
