'use client';

import { useAppStore } from '@/store/useAppStore';
import type { Translations, Language } from '@/i18n';
import ko from '@/i18n/ko';
import en from '@/i18n/en';
import km from '@/i18n/km';
import zh from '@/i18n/zh';

const translations: Record<Language, Translations> = { ko, en, km, zh };

/**
 * React hook for accessing i18n translations.
 * Uses the current language from Zustand store.
 *
 * @example
 * const t = useTranslations();
 * return <span>{t.common.loading}</span>;
 */
export function useTranslations(): Translations {
    const { language } = useAppStore();
    return translations[language] ?? translations.en;
}
