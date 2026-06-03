import { m } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const PORTAL_SRC = `${import.meta.env.BASE_URL}404/portal.png`;

export function NotFoundPage() {
   const { t, i18n } = useTranslation('common');

   useEffect(() => {
      document.title = t('notFound.title');
   }, [t, i18n.language]);

   return (
      <m.section
         aria-label={t('notFound.sectionAria')}
         className="not-found-page relative flex w-full flex-1 items-center justify-center overflow-hidden px-4"
         style={{ '--not-found-portal-url': `url('${PORTAL_SRC}')` } as React.CSSProperties}
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.28, ease: 'easeOut' }}
      >
         <div className="not-found-space" aria-hidden />
         <m.div
            className="not-found-wrapper"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
         >
            <span className="not-found-code" aria-hidden>
               44
            </span>
            <p>{t('notFound.message')}</p>
            <Link className="not-found-home" to="/characters">
               {t('notFound.home')}
            </Link>
         </m.div>
      </m.section>
   );
}
