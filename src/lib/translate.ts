import { Translate } from '@google-cloud/translate/build/src/v2';

const client = new Translate();

/**
 * Translate text to a target language using Google Cloud Translation API.
 * Returns the original text if translation fails.
 */
export async function translate(text: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) return text;
    try {
        const [result] = await client.translate(text, targetLang);
        return result;
    } catch (err) {
        console.warn(`[translate] Failed to translate to ${targetLang}:`, err);
        return text; // fallback to original
    }
}
