import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

const savedLanguage = typeof window !== 'undefined'
  ? localStorage.getItem('totalcorp_lang') || 'pt-BR'
  : 'pt-BR';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      en: { translation: en },
      es: { translation: es },
    },
    lng: savedLanguage,
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('totalcorp_lang', lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
