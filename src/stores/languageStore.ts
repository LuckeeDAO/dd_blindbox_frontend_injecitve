import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Locale, getTranslation, getLanguage, Language } from '@/i18n';

interface LanguageState {
  locale: Locale;
  language: Language;
  translations: ReturnType<typeof getTranslation>;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      locale: 'zh',
      language: getLanguage('zh'),
      translations: getTranslation('zh'),
      
      setLocale: (locale: Locale) => {
        const language = getLanguage(locale);
        const translations = getTranslation(locale);
        set({ locale, language, translations });
      },
      
      t: (key: string) => {
        const { translations } = get();
        const keys = key.split('.');
        let value: unknown = translations as unknown;
        
        for (const k of keys) {
          if (
            value !== null &&
            typeof value === 'object' &&
            Object.prototype.hasOwnProperty.call(value as Record<string, unknown>, k)
          ) {
            value = (value as Record<string, unknown>)[k];
          } else {
            console.warn(`Translation key not found: ${key}`);
            return key;
          }
        }
        
        return typeof value === 'string' ? value : key;
      },
    }),
    {
      name: 'language-storage',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

