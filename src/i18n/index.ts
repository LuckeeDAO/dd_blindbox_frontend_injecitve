import { zh } from './locales/zh';
import { en } from './locales/en';

export type Locale = 'zh' | 'en';

export interface Language {
  code: Locale;
  name: string;
  flag: string;
}

export const languages: Language[] = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

const translations = {
  zh,
  en,
};

export type TranslationKey = keyof typeof zh;

export const getTranslation = (locale: Locale) => {
  return translations[locale] || translations.zh;
};

export const getLanguage = (code: Locale): Language => {
  return languages.find(lang => lang.code === code) || languages[0];
};

export { zh, en };

