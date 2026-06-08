import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedName } from '../../hooks/useDebouncedName';
import { queryKeys } from '../../hooks/queries/queryKeys';
import { CharacterService } from '../../services/characters';
import type { Character } from '../../types/api';

export type SelectedCharacter = {
   id: number;
   name: string;
};

interface CharacterMultiSelectProps {
   selected: SelectedCharacter[];
   onChange: (next: SelectedCharacter[]) => void;
}

export function CharacterMultiSelect({ selected, onChange }: CharacterMultiSelectProps) {
   const { t } = useTranslation('common');
   const listId = useId();
   const rootRef = useRef<HTMLDivElement>(null);
   const [open, setOpen] = useState(false);
   const { nameDraft: queryDraft, setNameDraft: setQueryDraft, appliedName: appliedQuery } =
      useDebouncedName();

   const selectedIds = useMemo(() => new Set(selected.map((c) => c.id)), [selected]);

   const { data, isFetching } = useQuery({
      queryKey: queryKeys.characters.multiselect(appliedQuery),
      enabled: open,
      queryFn: ({ signal }) =>
         CharacterService.getCharacters(1, appliedQuery ? { name: appliedQuery } : {}, signal),
   });

   const options: Character[] = data?.results ?? [];
   const loading = isFetching;

   useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
         if (!rootRef.current?.contains(e.target as Node)) {
            setOpen(false);
         }
      };
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
   }, []);

   const toggleCharacter = useCallback(
      (character: Character) => {
         if (selectedIds.has(character.id)) {
            onChange(selected.filter((c) => c.id !== character.id));
         } else {
            onChange([...selected, { id: character.id, name: character.name }]);
         }
      },
      [onChange, selected, selectedIds],
   );

   const removeChip = useCallback(
      (id: number) => {
         onChange(selected.filter((c) => c.id !== id));
      },
      [onChange, selected],
   );

   return (
      <div ref={rootRef} className="relative w-full">
         <label htmlFor={`${listId}-trigger`} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('episodes.filters.charactersLabel')}
         </label>

         {selected.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
               {selected.map((c) => (
                  <span
                     key={c.id}
                     className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-[var(--text-color)]"
                  >
                     {c.name}
                     <button
                        type="button"
                        className="rounded-full px-1 text-primary hover:bg-primary/20"
                        aria-label={t('episodes.filters.removeCharacter', { name: c.name })}
                        onClick={() => removeChip(c.id)}
                     >
                        ×
                     </button>
                  </span>
               ))}
            </div>
         ) : null}

         <button
            id={`${listId}-trigger`}
            type="button"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={`${listId}-listbox`}
            className="flex w-full items-center justify-between rounded-xl border border-primary/40 bg-[var(--bg-color)] px-4 py-3 text-left text-sm font-medium text-[var(--text-color)] outline-none ring-primary/30 transition focus:border-primary focus:ring-2"
            onClick={() => setOpen((v) => !v)}
         >
            <span className={selected.length === 0 ? 'text-muted-foreground' : ''}>
               {selected.length === 0
                  ? t('episodes.filters.charactersPlaceholder')
                  : t('episodes.filters.charactersSelected', { count: selected.length })}
            </span>
            <span aria-hidden className="text-primary">
               {open ? '▲' : '▼'}
            </span>
         </button>

         {open ? (
            <div
               id={`${listId}-listbox`}
               role="listbox"
               aria-multiselectable="true"
               className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-primary/30 bg-[var(--bg-color)] shadow-lg shadow-primary/10"
            >
               <div className="border-b border-border/60 p-2">
                  <input
                     type="search"
                     value={queryDraft}
                     onChange={(e) => setQueryDraft(e.target.value)}
                     placeholder={t('episodes.filters.characterSearchPlaceholder')}
                     aria-label={t('episodes.filters.characterSearchPlaceholder')}
                     autoComplete="off"
                     className="w-full rounded-lg border border-primary/30 bg-[var(--bg-color)] px-3 py-2 text-sm outline-none ring-primary/30 focus:border-primary focus:ring-2"
                  />
               </div>
               <ul className="max-h-56 overflow-y-auto py-1">
                  {loading ? (
                     <li className="px-4 py-3 text-sm text-muted-foreground">
                        {t('episodes.filters.characterSearchLoading')}
                     </li>
                  ) : options.length === 0 ? (
                     <li className="px-4 py-3 text-sm text-muted-foreground">
                        {t('episodes.filters.characterSearchEmpty')}
                     </li>
                  ) : (
                     options.map((character) => {
                        const checked = selectedIds.has(character.id);
                        return (
                           <li key={character.id}>
                              <button
                                 type="button"
                                 role="option"
                                 aria-selected={checked}
                                 className={clsx(
                                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-primary/10',
                                    checked && 'bg-primary/15 font-semibold text-primary',
                                 )}
                                 onClick={() => toggleCharacter(character)}
                              >
                                 <span
                                    className={clsx(
                                       'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary/50 text-xs',
                                       checked && 'border-primary bg-primary text-[var(--bg-color)]',
                                    )}
                                    aria-hidden
                                 >
                                    {checked ? '✓' : ''}
                                 </span>
                                 <span className="truncate">{character.name}</span>
                                 <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                    {character.species}
                                 </span>
                              </button>
                           </li>
                        );
                     })
                  )}
               </ul>
            </div>
         ) : null}
      </div>
   );
}
