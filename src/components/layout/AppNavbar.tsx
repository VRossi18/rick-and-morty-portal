import clsx from 'clsx';
import { Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { preloadRoute, type PreloadableRoute } from '../../utils/preloadRoute';
import { LazyDonationModal, preloadDonationModal } from '../donations/lazyDonationModal';
import { LanguageSwitcher } from './LanguageSwitcher';

const navPreloadRoutes: Record<string, PreloadableRoute> = {
   '/about': 'about',
   '/characters': 'characters',
   '/episodes': 'episodes',
   '/locations': 'locations',
   '/rpg': 'rpg',
};

const tabClass = ({ isActive }: { isActive: boolean }) =>
   clsx(
      'inline-flex shrink-0 items-center whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-semibold transition-colors md:px-4',
      isActive
         ? 'border-primary text-primary'
         : 'text-muted-foreground hover:text-foreground',
   );

export function AppNavbar() {
   const { t } = useTranslation('common');
   const [donationOpen, setDonationOpen] = useState(false);
   const closeDonationModal = useCallback(() => setDonationOpen(false), []);

   return (
      <header
         className="sticky top-0 z-40 border-b border-border bg-[var(--bg-color)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-color)]/80"
         role="navigation"
         aria-label={t('nav.ariaMain')}
      >
         <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:gap-2 md:overflow-x-visible">
               {(
                  [
                     ['/about', 'nav.about'],
                     ['/characters', 'nav.characters'],
                     ['/episodes', 'nav.episodes'],
                     ['/locations', 'nav.locations'],
                     ['/rpg', 'nav.rpg'],
                  ] as const
               ).map(([path, labelKey]) => (
                  <NavLink
                     key={path}
                     to={path}
                     className={tabClass}
                     onMouseEnter={() => {
                        const route = navPreloadRoutes[path];
                        if (route) {
                           preloadRoute(route);
                        }
                     }}
                     onFocus={() => {
                        const route = navPreloadRoutes[path];
                        if (route) {
                           preloadRoute(route);
                        }
                     }}
                  >
                     {t(labelKey)}
                  </NavLink>
               ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
               <button
                  type="button"
                  onClick={() => setDonationOpen(true)}
                  onMouseEnter={preloadDonationModal}
                  onFocus={preloadDonationModal}
                  className="rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
               >
                  {t('nav.support')}
               </button>
               <LanguageSwitcher />
            </div>
         </div>
         {donationOpen ? (
            <Suspense fallback={null}>
               <LazyDonationModal open={donationOpen} onClose={closeDonationModal} />
            </Suspense>
         ) : null}
      </header>
   );
}
