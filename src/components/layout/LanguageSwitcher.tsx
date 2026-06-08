import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { changePortalLanguage } from '../../i18n';

function FlagBr() {
   return (
      <svg
         viewBox="0 0 30 20"
         className="pointer-events-none h-[18px] w-[27px] overflow-hidden rounded-[3px] shadow-sm cursor-pointer"
         aria-hidden
      >
         <rect width="30" height="20" fill="#009b3a" />
         <path d="M15 3.5 L26 10 15 16.5 4 10 Z" fill="#ffdf00" />
         <circle cx="15" cy="10" r="4.2" fill="#002776" />
         <path d="M15 7.2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="#fff" opacity="0.35" />
      </svg>
   );
}

function FlagEs() {
   return (
      <svg
         viewBox="0 0 30 20"
         className="pointer-events-none h-[18px] w-[27px] overflow-hidden rounded-[3px] shadow-sm cursor-pointer"
         aria-hidden
      >
         <rect width="30" height="7" y="0" fill="#aa151b" />
         <rect width="30" height="6" y="7" fill="#f1bf00" />
         <rect width="30" height="7" y="13" fill="#aa151b" />
      </svg>
   );
}

function FlagUs() {
   return (
      <svg
         viewBox="0 0 30 20"
         className="pointer-events-none h-[18px] w-[27px] overflow-hidden rounded-[3px] shadow-sm cursor-pointer"
         aria-hidden
      >
         <rect width="30" height="20" fill="#b22234" />
         <path
            fill="#fff"
            d="M0 2.3h30M0 5.5h30M0 8.7h30M0 11.9h30M0 15.1h30M0 18.3h30"
            stroke="#fff"
            strokeWidth="1.54"
         />
         <rect width="12" height="10.8" fill="#3c3b6e" />
         <g fill="#fff">
            <circle cx="2.2" cy="1.4" r="0.55" />
            <circle cx="4.4" cy="1.4" r="0.55" />
            <circle cx="6.6" cy="1.4" r="0.55" />
            <circle cx="8.8" cy="1.4" r="0.55" />
            <circle cx="10.6" cy="1.4" r="0.55" />
            <circle cx="3.3" cy="2.8" r="0.55" />
            <circle cx="5.5" cy="2.8" r="0.55" />
            <circle cx="7.7" cy="2.8" r="0.55" />
            <circle cx="9.9" cy="2.8" r="0.55" />
            <circle cx="2.2" cy="4.2" r="0.55" />
            <circle cx="4.4" cy="4.2" r="0.55" />
            <circle cx="6.6" cy="4.2" r="0.55" />
            <circle cx="8.8" cy="4.2" r="0.55" />
            <circle cx="10.6" cy="4.2" r="0.55" />
            <circle cx="3.3" cy="5.6" r="0.55" />
            <circle cx="5.5" cy="5.6" r="0.55" />
            <circle cx="7.7" cy="5.6" r="0.55" />
            <circle cx="9.9" cy="5.6" r="0.55" />
            <circle cx="2.2" cy="7" r="0.55" />
            <circle cx="4.4" cy="7" r="0.55" />
            <circle cx="6.6" cy="7" r="0.55" />
            <circle cx="8.8" cy="7" r="0.55" />
            <circle cx="10.6" cy="7" r="0.55" />
            <circle cx="3.3" cy="8.4" r="0.55" />
            <circle cx="5.5" cy="8.4" r="0.55" />
            <circle cx="7.7" cy="8.4" r="0.55" />
            <circle cx="9.9" cy="8.4" r="0.55" />
         </g>
      </svg>
   );
}

function resolvePortalLocale(language: string | undefined): 'pt' | 'en' | 'es' {
   if (language?.startsWith('es')) {
      return 'es';
   }
   if (language?.startsWith('en')) {
      return 'en';
   }
   return 'pt';
}

export function LanguageSwitcher() {
   const { i18n, t } = useTranslation('common');
   const lng = resolvePortalLocale(i18n.resolvedLanguage ?? i18n.language);

   const btnClass = (active: boolean) =>
      clsx(
         'rounded-md p-0.5 transition outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-color)] cursor-pointer',
         active
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-[var(--bg-color)]'
            : 'opacity-75 hover:opacity-100',
      );

   return (
      <div className="flex shrink-0 items-center gap-2 px-2 rounded-lg border border-border/80 bg-card/50 p-0.5 sm:gap-3">
         <button
            type="button"
            className={btnClass(lng === 'pt')}
            aria-pressed={lng === 'pt'}
            aria-label={t('language.switchToPt')}
            onClick={() => void changePortalLanguage('pt')}
         >
            <FlagBr />
         </button>
         <button
            type="button"
            className={btnClass(lng === 'en')}
            aria-pressed={lng === 'en'}
            aria-label={t('language.switchToEn')}
            onClick={() => void changePortalLanguage('en')}
         >
            <FlagUs />
         </button>
         <button
            type="button"
            className={btnClass(lng === 'es')}
            aria-pressed={lng === 'es'}
            aria-label={t('language.switchToEs')}
            onClick={() => void changePortalLanguage('es')}
         >
            <FlagEs />
         </button>
      </div>
   );
}
