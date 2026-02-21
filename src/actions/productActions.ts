'use server';

import { PrismaClient } from '@prisma/client';
import { Translate } from '@google-cloud/translate/build/src/v2';

const prisma = new PrismaClient();

// Initialize Google Cloud Translation API client
// IMPORTANT: Assumes GOOGLE_APPLICATION_CREDENTIALS env var is set 
// or deployed within GCP environment (Cloud Run, Compute Engine)
const translate = new Translate();

interface ProductInput {
    sku: string;
    priceUsd: number;
    stockQty: number;
    categoryId?: number;
    status: string;
    // Source text (English or Korean)
    sourceLang: 'en' | 'ko';
    name: string;
    shortDesc?: string;
    detailDesc?: string;
    seoKeywords?: string;
}

const TARGET_LANGUAGES = ['ko', 'en', 'km', 'zh'];

/**
 * Parses and runs Google Translate API for a given text to a target language
 */
async function translateText(text: string | null | undefined, targetLang: string, sourceLang: string, isHtml: boolean = false): Promise<string | null> {
    if (!text) return null;
    if (targetLang === sourceLang) return text; // No need to translate source text

    try {
        const [translation] = await translate.translate(text, {
            from: sourceLang,
            to: targetLang,
            format: isHtml ? 'html' : 'text',
        });
        return translation;
    } catch (error) {
        console.error(`Translation failed for ${targetLang}:`, error);
        // Fallback to original text on translation failure to prevent transaction abort
        return text;
    }
}

/**
 * Creates a product and automatically translates its details into supported languages.
 * Uses Prisma Transaction to ensure atomic database writes.
 */
export async function createProductWithTranslations(input: ProductInput) {
    try {
        // 1. Prepare target languages (excluding the source language)
        const languagesToTranslate = TARGET_LANGUAGES.filter(lang => lang !== input.sourceLang);

        // 2. Perform translations in parallel using Promise.all for optimized speed
        const [
            names,
            shortDescs,
            detailDescs,
            seoKeywords
        ] = await Promise.all([
            // Name translations (Text)
            Promise.all(languagesToTranslate.map(lang => translateText(input.name, lang, input.sourceLang))),
            // Short Desc translations (Text)
            Promise.all(languagesToTranslate.map(lang => translateText(input.shortDesc, lang, input.sourceLang))),
            // Detail Desc translations (HTML format preserved)
            Promise.all(languagesToTranslate.map(lang => translateText(input.detailDesc, lang, input.sourceLang, true))),
            // SEO Keywords translations (Text)
            Promise.all(languagesToTranslate.map(lang => translateText(input.seoKeywords, lang, input.sourceLang)))
        ]);

        // 3. Map translated results back to their language codes
        type TranslatedFields = { name: string; shortDesc?: string | null; detailDesc?: string | null; seoKeywords?: string | null };

        // Initialize mapping with source language
        const translationMap: Record<string, TranslatedFields> = {
            [input.sourceLang]: {
                name: input.name,
                shortDesc: input.shortDesc || null,
                detailDesc: input.detailDesc || null,
                seoKeywords: input.seoKeywords || null
            }
        };

        // Populate translated fields
        languagesToTranslate.forEach((lang, index) => {
            translationMap[lang] = {
                name: names[index] || input.name,
                shortDesc: shortDescs[index] || null,
                detailDesc: detailDescs[index] || null,
                seoKeywords: seoKeywords[index] || null
            };
        });

        // 4. Save to Database using Prisma Transaction 
        const result = await prisma.$transaction(async (tx) => {
            // 4.1. Create the core Product entity (Master data)
            const newProduct = await tx.product.create({
                data: {
                    sku: input.sku,
                    priceUsd: input.priceUsd,
                    stockQty: input.stockQty,
                    categoryId: input.categoryId ?? null,
                    status: input.status,
                }
            });

            const translationRecords = TARGET_LANGUAGES.map(lang => {
                const t = translationMap[lang]!;
                return {
                    productId: newProduct.id,
                    langCode: lang,
                    name: t.name,
                    shortDesc: t.shortDesc ?? null,
                    detailDesc: t.detailDesc ?? null,
                    seoKeywords: t.seoKeywords ?? null,
                };
            });

            // 4.3. Bulk insert translations
            await tx.productTranslation.createMany({
                data: translationRecords,
            });

            return newProduct;
        });

        return {
            success: true,
            productId: result.id.toString(), // BigInt to string mapping for JSON serialization
            message: 'Product created and translated successfully.'
        };

    } catch (error) {
        console.error('Failed to create product:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown database error occurred.'
        };
    }
}
