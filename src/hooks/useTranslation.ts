import { useLanguageStore } from '@/stores/languageStore';

export const useTranslation = () => {
  const { locale, language, translations, setLocale, t } = useLanguageStore();
  
  return {
    locale,
    language,
    translations,
    setLocale,
    t,
  };
};

