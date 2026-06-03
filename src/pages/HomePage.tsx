import { startTransition, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CharacterCard } from '../components/characters/CharacterCard';
import { CharacterFiltersBar } from '../components/characters/CharacterFiltersBar';
import { HomeHero } from '../components/characters/HomeHero';
import { PageMotionShell } from '../components/layout/PageMotionShell';
import { useCharactersQuery } from '../hooks/queries/useCharactersQuery';
import { useDebouncedName } from '../hooks/useDebouncedName';
import { usePortalTransitionFocus } from '../hooks/usePortalTransitionFocus';
import type { CharacterListFilters } from '../services/characters';

export function HomePage() {
   const { t } = useTranslation('common');
   const [page, setPage] = useState(1);
   const resetPage = useCallback(() => setPage(1), []);
   const { nameDraft, setNameDraft, appliedName, resetName } = useDebouncedName({
      onApply: resetPage,
   });
   const { handleBeforeNavigate, cardInteraction } = usePortalTransitionFocus();

   const [status, setStatus] = useState('');
   const [gender, setGender] = useState('');
   const [species, setSpecies] = useState('');
   const [type, setType] = useState('');

   const hasActiveFilters = useMemo(
      () =>
         nameDraft.trim() !== '' ||
         status !== '' ||
         gender !== '' ||
         species.trim() !== '' ||
         type.trim() !== '',
      [nameDraft, status, gender, species, type],
   );

   const listFilters: CharacterListFilters = useMemo(
      () => ({
         ...(appliedName ? { name: appliedName } : {}),
         ...(status ? { status } : {}),
         ...(gender ? { gender } : {}),
         ...(species.trim() ? { species: species.trim() } : {}),
         ...(type.trim() ? { type: type.trim() } : {}),
      }),
      [appliedName, status, gender, species, type],
   );

   const { data, isLoading, isFetching, isError } = useCharactersQuery(page, listFilters);

   const characters = data?.results ?? [];
   const pageInfo = data?.info ?? null;
   const loading = isLoading || isFetching;
   const error = isError ? t('home.errorLoad') : null;

   const clearAllFilters = useCallback(() => {
      resetName();
      setStatus('');
      setGender('');
      setSpecies('');
      setType('');
      setPage(1);
   }, [resetName]);

   const handleStatusChange = useCallback((v: string) => {
      setStatus(v);
      setPage(1);
   }, []);

   const handleGenderChange = useCallback((v: string) => {
      setGender(v);
      setPage(1);
   }, []);

   const handleSpeciesChange = useCallback((v: string) => {
      setSpecies(v);
      setPage(1);
   }, []);

   const handleTypeChange = useCallback((v: string) => {
      setType(v);
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

   const showEmptyResults = !loading && !error && characters.length === 0;

   return (
      <PageMotionShell>
         <HomeHero />
         <main className="mx-auto max-w-[1400px] px-6 pb-20">
            <CharacterFiltersBar
               nameDraft={nameDraft}
               onNameDraftChange={setNameDraft}
               status={status}
               onStatusChange={handleStatusChange}
               gender={gender}
               onGenderChange={handleGenderChange}
               species={species}
               onSpeciesChange={handleSpeciesChange}
               type={type}
               onTypeChange={handleTypeChange}
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
                        {t('home.empty.title')}
                     </p>
                     <p className="max-w-md text-sm text-muted-foreground">
                        {t('home.empty.hint')}
                     </p>
                  </div>
               ) : (
                  <div
                     className={`character-grid grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 ${loading ? 'pointer-events-none opacity-45' : ''}`}
                  >
                     {characters.map((char) => (
                        <CharacterCard
                           key={char.id}
                           character={char}
                           interaction={cardInteraction(char.id)}
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
                        {t('home.loading')}
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
               {t('home.pagination.prev')}
            </button>

            <span className="text-sm font-semibold text-[var(--text-color)]">
               {t('home.pagination.pageOf', { current: page, total: pageInfo?.pages ?? 1 })}
            </span>

            <button
               type="button"
               onClick={goToNextPage}
               disabled={!pageInfo?.next || loading}
               className="rounded-md border border-primary/40 px-4 py-2 text-sm font-semibold text-[var(--text-color)] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
               {t('home.pagination.next')}
            </button>
         </footer>
      </PageMotionShell>
   );
}
