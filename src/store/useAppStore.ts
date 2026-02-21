import { create } from 'zustand';

type Language = 'ko' | 'en' | 'km' | 'zh';

interface AppState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const useAppStore = create<AppState>((set) => ({
    language: 'ko', // Default language
    setLanguage: (lang) => set({ language: lang }),
}));
