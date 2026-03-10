import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Language = 'ko' | 'en' | 'km' | 'zh';

interface AppState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const useInternalStore = create<AppState>()(
    persist(
        (set) => ({
            language: 'en',
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'kkshop-lang',
            storage: createJSONStorage(() => {
                // SSR-safe: return a no-op storage when window is unavailable
                if (typeof window === 'undefined') {
                    return {
                        getItem: () => null,
                        setItem: () => {},
                        removeItem: () => {},
                    } as unknown as Storage;
                }
                return localStorage;
            }),
            // Skip auto-hydration to prevent SSR/client mismatch flash.
            // Components call rehydrateLanguageStore() after mount.
            skipHydration: true,
        }
    )
);

/**
 * Call this once on client mount (e.g. in GNB's useEffect).
 * Reads language from localStorage and updates the store.
 */
export function rehydrateLanguageStore() {
    if (typeof window !== 'undefined') {
        useInternalStore.persist.rehydrate();
    }
}

/**
 * Universal Store Safety Layer.
 * Returns valid state even during SSR/Pre-rendering.
 */
export function useSafeMarketStore(): AppState {
    const fallback: AppState = {
        language: 'en',
        setLanguage: () => {},
    };

    if (typeof window === 'undefined') {
        try {
            return useInternalStore.getState() || fallback;
        } catch {
            return fallback;
        }
    }

    try {
        return useInternalStore() || fallback;
    } catch {
        try {
            return useInternalStore.getState() || fallback;
        } catch {
            return fallback;
        }
    }
}

// Support both naming conventions used throughout the project
export const useAppStore = useSafeMarketStore;
export const useSafeAppStore = useSafeMarketStore;
