import { startTransition, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SelectedCharacter } from '../components/episodes/CharacterMultiSelect';
import { EpisodeCard } from '../components/episodes/EpisodeCard';
import { EpisodeFiltersBar } from '../components/episodes/EpisodeFiltersBar';
import { EpisodesHero } from '../components/episodes/EpisodesHero';
import { PageMotionShell } from '../components/layout/PageMotionShell';
import {
   mergeEpisodesQueryResults,
   useEpisodesCharacterFilterQuery,
   useEpisodesListQuery,
} from '../hooks/queries/useEpisodesQuery';
import { useDebouncedName } from '../hooks/useDebouncedName';
import { usePortalTransitionFocus } from '../hooks/usePortalTransitionFocus';
import type { EpisodeListFilters } from '../services/episodes';
import { seasonToApiFilter } from '../utils/episodeSeason';

const DEFAULT_SEASON = 1;

export function EpisodesPage() {
   const { t } = useTranslation('common');
   const [page, setPage] = useState(1);
   const [season, setSeason] = useState(DEFAULT_SEASON);
   const resetPage = useCallback(() => setPage(1), []);
   const { nameDraft, setNameDraft, appliedName, resetName } = useDebouncedName({
      onApply: resetPage,
   });
   const { handleBeforeNavigate, cardInteraction } = usePortalTransitionFocus();
   const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);

   const selectedCharacterIds = useMemo(
      () => selectedCharacters.map((c) => c.id),
      [selectedCharacters],
   );

   const useCharacterFilter = selectedCharacterIds.length > 0;

   const hasActiveFilters = useMemo(
      () => nameDraft.trim() !== '' || selectedCharacters.length > 0,
      [nameDraft, selectedCharacters.length],
   );

   const listFilters: EpisodeListFilters = useMemo(
      () => ({
         episode: seasonToApiFilter(season),
         ...(appliedName ? { name: appliedName } : {}),
      }),
      [appliedName, season],
   );

   const listQuery = useEpisodesListQuery(page, listFilters, !useCharacterFilter);
   const filterQuery = useEpisodesCharacterFilterQuery({
      page,
      season,
      appliedName,
      characterIds: selectedCharacterIds,
      enabled: useCharacterFilter,
   });

   const activeQuery = useCharacterFilter ? filterQuery : listQuery;
   const merged = mergeEpisodesQueryResults(filterQuery.data, listQuery.data, useCharacterFilter);

   const episodes = merged.results;
   const pageInfo = merged.info;
   const loading = activeQuery.isLoading || activeQuery.isFetching;
   const error = activeQuery.isError ? t('episodes.errorLoad') : null;

   const clearAllFilters = useCallback(() => {
      resetName();
      setSelectedCharacters([]);
      setPage(1);
   }, [resetName]);

   const handleSeasonChange = useCallback((value: number) => {
      setSeason(value);
      setPage(1);
   }, []);

   const handleSelectedCharactersChange = useCallback((next: SelectedCharacter[]) => {
      setSelectedCharacters(next);
      setPage(1);
   }, []);

   const canGoPrevious = Boolean(pageInfo?.prev);
   const canGoNext = Boolean(pageInfo?.next);

   const goToPreviousPage = useCallback(() => {
      if (!canGoPrevious) {
         return;
      }
      startTransition(() => {
         setPage((currentPage) => currentPage - 1);
      });
   }, [canGoPrevious]);

   const goToNextPage = useCallback(() => {
      if (!canGoNext) {
         return;
      }
      startTransition(() => {
         setPage((currentPage) => currentPage + 1);
      });
   }, [canGoNext]);

   const showEmptyResults = !loading && !error && episodes.length === 0;

   return (
      <PageMotionShell>
         <EpisodesHero />
         <main className="mx-auto max-w-[1400px] px-6 pb-20">
            <EpisodeFiltersBar
               season={season}
               onSeasonChange={handleSeasonChange}
               nameDraft={nameDraft}
               onNameDraftChange={setNameDraft}
               selectedCharacters={selectedCharacters}
               onSelectedCharactersChange={handleSelectedCharactersChange}
               hasActiveFilters={hasActiveFilters}
               onClearFilters={clearAllFilters}
            />

            <div className="relative min-h-[20rem]">
               {error ? (
                  <div className="flex h-80 items-center justify-center">
                     <p className="text-sm font-bold text-red-500">{error}</p>
                  </div>
               ) : showEmptyResults ? (
                  <div className="flex min-h-[16rem] flex-col items-center justify-center gap-2 px-4 text-center">
                     <p className="text-base font-semibold text-[var(--text-color)]">
                        {t('episodes.empty.title')}
                     </p>
                     <p className="max-w-md text-sm text-muted-foreground">
                        {t('episodes.empty.hint')}
                     </p>
                  </div>
               ) : (
                  <div
                     className={`character-grid grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'pointer-events-none opacity-45' : ''}`}
                  >
                     {episodes.map((ep) => (
                        <EpisodeCard
                           key={ep.id}
                           episode={ep}
                           interaction={cardInteraction(ep.id)}
                           onBeforeNavigate={handleBeforeNavigate}
                        />
                     ))}
                  </div>
               )}

               {loading ? (
                  <div
                     className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-[var(--bg-color)]/75 backdrop-blur-[2px]"
                     aria-busy="true"
                     aria-live="polite"
                  >
                     <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                     <p className="animate-pulse text-sm font-bold text-primary">
                        {t('episodes.loading')}
                     </p>
                  </div>
               ) : null}
            </div>
         </main>
         <footer className="flex items-center justify-center gap-4 pb-8">
            <button
               type="button"
               onClick={goToPreviousPage}
               disabled={!pageInfo?.prev || loading}
               className="rounded-md border border-primary/40 px-4 py-2 text-sm font-semibold text-[var(--text-color)] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
               {t('episodes.pagination.prev')}
            </button>

            <span className="text-sm font-semibold text-[var(--text-color)]">
               {t('episodes.pagination.pageOfSeason', {
                  season,
                  current: page,
                  total: pageInfo?.pages ?? 1,
               })}
            </span>

            <button
               type="button"
               onClick={goToNextPage}
               disabled={!pageInfo?.next || loading}
               className="rounded-md border border-primary/40 px-4 py-2 text-sm font-semibold text-[var(--text-color)] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
               {t('episodes.pagination.next')}
            </button>
         </footer>
      </PageMotionShell>
   );
}
