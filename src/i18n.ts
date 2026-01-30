import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import de from './locales/de.json';

const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
  pt: { translation: ptBR }, // Fallback for generic 'pt' to Brazilian Portuguese
  es: { translation: es },
  fr: { translation: fr },
  it: { translation: it },
  de: { translation: de },
};

i18n
  .use(LanguageDetector) // Detect browser language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language if browser language is not supported
    supportedLngs: ['en', 'pt-BR', 'pt', 'es', 'fr', 'it', 'de'],
    
    detection: {
      order: ['navigator', 'localStorage', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
