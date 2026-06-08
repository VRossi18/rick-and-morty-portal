import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const LOCALE_STORAGE_KEY = 'portal.locale';

export type PortalLocale = 'pt' | 'en' | 'es';

const localeLoaders: Record<PortalLocale, () => Promise<{ default: Record<string, unknown> }>> = {
   pt: () => import('./locales/pt/common.json'),
   en: () => import('./locales/en/common.json'),
   es: () => import('./locales/es/common.json'),
};

export function readStoredLocale(): PortalLocale {
   if (typeof window === 'undefined') {
      return 'pt';
   }
   const v = window.localStorage.getItem(LOCALE_STORAGE_KEY);
   if (v === 'en' || v === 'es') {
      return v;
   }
   return 'pt';
}

function syncDocument(lang: string) {
   if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
   }
   if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, lang);
   }
}

export async function ensureLocaleBundle(locale: PortalLocale): Promise<void> {
   if (i18n.hasResourceBundle(locale, 'common')) {
      return;
   }
   const mod = await localeLoaders[locale]();
   i18n.addResourceBundle(locale, 'common', mod.default, true, true);
}

let initPromise: Promise<void> | null = null;

export function initI18n(): Promise<void> {
   if (!initPromise) {
      const locale = readStoredLocale();
      initPromise = (async () => {
         await i18n.use(initReactI18next).init({
            resources: {},
            lng: locale,
            fallbackLng: 'pt',
            defaultNS: 'common',
            ns: ['common'],
            interpolation: { escapeValue: false },
         });

         await ensureLocaleBundle(locale);
         await i18n.changeLanguage(locale);
         syncDocument(i18n.language);
      })();
   }
   return initPromise;
}

export async function changePortalLanguage(locale: PortalLocale): Promise<void> {
   await ensureLocaleBundle(locale);
   await i18n.changeLanguage(locale);
   syncDocument(locale);
}

export default i18n;
