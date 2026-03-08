import { create } from 'zustand';

type Language = 'ko' | 'en' | 'km' | 'zh';

interface AppState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const useInternalStore = create<AppState>((set) => ({
    language: 'en',
    setLanguage: (lang) => set({ language: lang }),
}));

/**
 * Universal Store Safety Layer.
 * Guarantees a valid state object is returned even during SSR/Pre-rendering.
 * This prevents "Cannot destructure property 'language' of 'useAppStore(...)' as it is undefined" errors.
 */
export function useSafeMarketStore(): AppState {
    const fallback: AppState = {
        language: 'en',
        setLanguage: (l: Language) => { },
    };

    // 1. SSR / Pre-rendering detection
    if (typeof window === 'undefined') {
        try {
            // Direct state access is safer during build time than calling the hook
            const state = useInternalStore.getState();
            if (!state) {
                console.error('[BUILD-DEBUG] useInternalStore.getState() returned null/undefined during SSR');
                return fallback;
            }
            return state;
        } catch (e) {
            console.error('[BUILD-DEBUG] useInternalStore.getState() threw error during SSR:', e);
            return fallback;
        }
    }

    // 2. Client-side execution
    try {
        const store = useInternalStore();
        return store || fallback;
    } catch {
        // Hydration or hook failure fallback
        try {
            return useInternalStore.getState() || fallback;
        } catch {
            return fallback;
        }
    }
}

// Support both naming conventions used in the project
export const useAppStore = useSafeMarketStore;
export const useSafeAppStore = useSafeMarketStore;
