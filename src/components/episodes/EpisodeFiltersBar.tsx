import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canGoToNextSeason, canGoToPreviousSeason, stepSeason } from '../../utils/episodeSeason';
import { CharacterMultiSelect, type SelectedCharacter } from './CharacterMultiSelect';

interface EpisodeFiltersBarProps {
   season: number;
   onSeasonChange: (value: number) => void;
   nameDraft: string;
   onNameDraftChange: (value: string) => void;
   selectedCharacters: SelectedCharacter[];
   onSelectedCharactersChange: (value: SelectedCharacter[]) => void;
   onClearFilters: () => void;
   hasActiveFilters: boolean;
}

const seasonNavButtonClass =
   'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-[var(--bg-color)] text-lg font-bold text-primary transition cursor-pointer hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-primary/40 disabled:hover:bg-[var(--bg-color)]';

const seasonLabelVariants = {
   enter: (dir: number) => ({
      x: dir > 0 ? 48 : -48,
      opacity: 0,
   }),
   center: {
      x: 0,
      opacity: 1,
   },
   exit: (dir: number) => ({
      x: dir > 0 ? -48 : 48,
      opacity: 0,
   }),
};

export function EpisodeFiltersBar({
   season,
   onSeasonChange,
   nameDraft,
   onNameDraftChange,
   selectedCharacters,
   onSelectedCharactersChange,
   onClearFilters,
   hasActiveFilters,
}: EpisodeFiltersBarProps) {
   const { t } = useTranslation('common');
   const prefersReducedMotion = useReducedMotion();
   const [seasonDirection, setSeasonDirection] = useState(0);

   const seasonTransition = prefersReducedMotion
      ? { duration: 0 }
      : { duration: 0.22, ease: 'easeOut' as const };

   const goPrevious = () => {
      if (canGoToPreviousSeason(season)) {
         setSeasonDirection(-1);
         onSeasonChange(stepSeason(season, -1));
      }
   };

   const goNext = () => {
      if (canGoToNextSeason(season)) {
         setSeasonDirection(1);
         onSeasonChange(stepSeason(season, 1));
      }
   };

   return (
      <div className="mx-auto mb-10 max-w-5xl space-y-4">
         <div
            className="flex items-center justify-center gap-3"
            role="group"
            aria-label={t('episodes.filters.seasonLabel')}
         >
            <button
               type="button"
               className={seasonNavButtonClass}
               onClick={goPrevious}
               disabled={!canGoToPreviousSeason(season)}
               aria-label={t('episodes.filters.seasonPrev')}
            >
               <span aria-hidden>←</span>
            </button>

            <div
               id="episode-season-display"
               aria-live="polite"
               aria-atomic="true"
               className="relative min-h-[1.5rem] min-w-[10rem] overflow-hidden sm:min-h-[1.75rem]"
            >
               <AnimatePresence mode="popLayout" initial={false} custom={seasonDirection}>
                  <m.span
                     key={season}
                     custom={seasonDirection}
                     variants={seasonLabelVariants}
                     initial="enter"
                     animate="center"
                     exit="exit"
                     transition={seasonTransition}
                     className="block text-center text-sm font-bold uppercase tracking-wide text-[var(--text-color)] sm:text-base"
                  >
                     {t('episodes.filters.seasonCurrent', { season })}
                  </m.span>
               </AnimatePresence>
            </div>

            <button
               type="button"
               className={seasonNavButtonClass}
               onClick={goNext}
               disabled={!canGoToNextSeason(season)}
               aria-label={t('episodes.filters.seasonNext')}
            >
               <span aria-hidden>→</span>
            </button>
         </div>

         <div className="space-y-2">
            <label htmlFor="episode-search" className="sr-only">
               {t('episodes.filters.searchLabel')}
            </label>
            <input
               id="episode-search"
               type="search"
               value={nameDraft}
               onChange={(e) => onNameDraftChange(e.target.value)}
               placeholder={t('episodes.filters.searchPlaceholder')}
               autoComplete="off"
               className="w-full rounded-xl border border-primary/40 bg-[var(--bg-color)] px-4 py-3 text-sm font-medium text-[var(--text-color)] shadow-sm outline-none ring-primary/30 transition placeholder:text-muted-foreground focus:border-primary focus:ring-2"
            />
         </div>

         <CharacterMultiSelect
            selected={selectedCharacters}
            onChange={onSelectedCharactersChange}
         />

         {hasActiveFilters ? (
            <div className="flex justify-end">
               <button
                  type="button"
                  onClick={onClearFilters}
                  className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
               >
                  {t('episodes.filters.clear')}
               </button>
            </div>
         ) : null}
      </div>
   );
}
