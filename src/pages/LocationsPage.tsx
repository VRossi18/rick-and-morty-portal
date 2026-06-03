import { startTransition, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocationCard } from '../components/locations/LocationCard';
import { LocationFiltersBar } from '../components/locations/LocationFiltersBar';
import { LocationsHero } from '../components/locations/LocationsHero';
import { PageMotionShell } from '../components/layout/PageMotionShell';
import { useLocationsQuery } from '../hooks/queries/useLocationsQuery';
import { useDebouncedName } from '../hooks/useDebouncedName';
import { usePortalTransitionFocus } from '../hooks/usePortalTransitionFocus';
import type { LocationListFilters } from '../services/locations';

export function LocationsPage() {
   const { t } = useTranslation('common');
   const [page, setPage] = useState(1);
   const resetPage = useCallback(() => setPage(1), []);
   const { nameDraft, setNameDraft, appliedName, resetName } = useDebouncedName({
      onApply: resetPage,
   });
   const { handleBeforeNavigate, cardInteraction } = usePortalTransitionFocus();

   const [type, setType] = useState('');
   const [dimension, setDimension] = useState('');

   const hasActiveFilters = useMemo(
      () => nameDraft.trim() !== '' || type !== '' || dimension !== '',
      [nameDraft, type, dimension],
   );

   const listFilters: LocationListFilters = useMemo(
      () => ({
         ...(appliedName ? { name: appliedName } : {}),
         ...(type ? { type } : {}),
         ...(dimension ? { dimension } : {}),
      }),
      [appliedName, type, dimension],
   );

   const { data, isLoading, isFetching, isError } = useLocationsQuery(page, listFilters);

   const locations = data?.results ?? [];
   const pageInfo = data?.info ?? null;
   const loading = isLoading || isFetching;
   const error = isError ? t('locations.errorLoad') : null;

   const clearAllFilters = useCallback(() => {
      resetName();
      setType('');
      setDimension('');
      setPage(1);
   }, [resetName]);

   const handleTypeChange = useCallback((value: string) => {
      setType(value);
      setPage(1);
   }, []);

   const handleDimensionChange = useCallback((value: string) => {
      setDimension(value);
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

   const showEmptyResults = !loading && !error && locations.length === 0;

   return (
      <PageMotionShell>
         <LocationsHero />
         <main className="mx-auto max-w-[1400px] px-6 pb-20">
            <LocationFiltersBar
               nameDraft={nameDraft}
               onNameDraftChange={setNameDraft}
               type={type}
               onTypeChange={handleTypeChange}
               dimension={dimension}
               onDimensionChange={handleDimensionChange}
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
                        {t('locations.empty.title')}
                     </p>
                     <p className="max-w-md text-sm text-muted-foreground">
                        {t('locations.empty.hint')}
                     </p>
                  </div>
               ) : (
                  <div
                     className={`character-grid grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'pointer-events-none opacity-45' : ''}`}
                  >
                     {locations.map((loc) => (
                        <LocationCard
                           key={loc.id}
                           location={loc}
                           interaction={cardInteraction(loc.id)}
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
                        {t('locations.loading')}
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
               {t('locations.pagination.prev')}
            </button>

            <span className="text-sm font-semibold text-[var(--text-color)]">
               {t('locations.pagination.pageOf', { current: page, total: pageInfo?.pages ?? 1 })}
            </span>

            <button
               type="button"
               onClick={goToNextPage}
               disabled={!pageInfo?.next || loading}
               className="rounded-md border border-primary/40 px-4 py-2 text-sm font-semibold text-[var(--text-color)] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
               {t('locations.pagination.next')}
            </button>
         </footer>
      </PageMotionShell>
   );
}
