import { Translate } from '@google-cloud/translate/build/src/v2';

const client = new Translate();

export const TARGET_LANGS = ['ko', 'en', 'km', 'zh'] as const;
export type LangCode = typeof TARGET_LANGS[number];

export interface ProductFields {
    name: string;
    shortDesc?: string | null;
    detailDesc?: string | null;
    seoKeywords?: string | null;
    ingredients?: string | null;
    howToUse?: string | null;
    benefits?: string | null;
}

/**
 * Translate a single text to a target language.
 * Returns the original text if translation fails.
 */
export async function translate(text: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) return text;
    try {
        const [result] = await client.translate(text, targetLang);
        return result;
    } catch (err) {
        console.warn(`[translate] Failed to translate to ${targetLang}:`, err);
        return text;
    }
}

/**
 * Detect the language of a given text.
 * Returns the detected language code if it is one of our 4 supported langs (ko/en/km/zh),
 * otherwise falls back to 'ko'.
 */
export async function detectLanguage(text: string): Promise<LangCode> {
    if (!text?.trim()) return 'ko';
    try {
        const [detection] = await client.detect(text);
        const lang = (Array.isArray(detection) ? detection[0]?.language : (detection as any).language) as string;
        return (TARGET_LANGS as readonly string[]).includes(lang) ? (lang as LangCode) : 'ko';
    } catch {
        return 'ko';
    }
}

/**
 * Translate all product text fields to all 4 target languages.
 * baseLang is the source language (skip translation for this lang).
 * If baseLang is omitted, the source language is auto-detected from fields.name.
 * Returns array of { langCode, ...translated fields } for upsert.
 */
export async function translateProductFields(
    fields: ProductFields,
    baseLang?: string
): Promise<Array<{ langCode: string } & ProductFields>> {
    const results: Array<{ langCode: string } & ProductFields> = [];

    // If no baseLang provided, auto-detect from the product name
    const srcLang: string = baseLang ?? await detectLanguage(fields.name);

    for (const lang of TARGET_LANGS) {
        if (lang === srcLang) {
            results.push({ langCode: lang, ...fields });
            continue;
        }
        try {
            const [
                translatedName,
                translatedShortDesc,
                translatedDetailDesc,
                translatedSeoKeywords,
                translatedIngredients,
                translatedHowToUse,
                translatedBenefits,
            ] = await Promise.all([
                translate(fields.name, lang),
                fields.shortDesc ? translate(fields.shortDesc, lang) : Promise.resolve(null),
                fields.detailDesc ? translate(fields.detailDesc, lang) : Promise.resolve(null),
                fields.seoKeywords ? translate(fields.seoKeywords, lang) : Promise.resolve(null),
                fields.ingredients ? translate(fields.ingredients, lang) : Promise.resolve(null),
                fields.howToUse ? translate(fields.howToUse, lang) : Promise.resolve(null),
                fields.benefits ? translate(fields.benefits, lang) : Promise.resolve(null),
            ]);

            results.push({
                langCode: lang,
                name: translatedName,
                shortDesc: translatedShortDesc,
                detailDesc: translatedDetailDesc,
                seoKeywords: translatedSeoKeywords,
                ingredients: translatedIngredients,
                howToUse: translatedHowToUse,
                benefits: translatedBenefits,
            });
        } catch (err) {
            console.error(`[translateProductFields] Failed for lang ${lang}:`, err);
            // fallback: same as base
            results.push({ langCode: lang, ...fields });
        }
    }

    return results;
}
