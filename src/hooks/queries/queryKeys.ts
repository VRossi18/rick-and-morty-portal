import type { CharacterListFilters } from '../../services/characters';
import type { EpisodeListFilters } from '../../services/episodes';
import type { LocationListFilters } from '../../services/locations';

export const queryKeys = {
   curiosity: {
      character: {
         initial: (id: number, locale: string) =>
            ['curiosity', 'character', id, locale, 'initial'] as const,
         question: (id: number, locale: string, question: string) =>
            ['curiosity', 'character', id, locale, question] as const,
      },
      episode: {
         initial: (id: number, locale: string) =>
            ['curiosity', 'episode', id, locale, 'initial'] as const,
         question: (id: number, locale: string, question: string) =>
            ['curiosity', 'episode', id, locale, question] as const,
      },
   },
   characters: {
      list: (page: number, filters: CharacterListFilters) =>
         ['characters', 'list', page, filters] as const,
      detail: (id: number) => ['characters', 'detail', id] as const,
      multiselect: (query: string) => ['characters', 'multiselect', query] as const,
   },
   locations: {
      list: (page: number, filters: LocationListFilters) =>
         ['locations', 'list', page, filters] as const,
      detail: (id: number) => ['locations', 'detail', id] as const,
      residents: (locationId: number) => ['locations', 'residents', locationId] as const,
   },
   episodes: {
      list: (page: number, filters: EpisodeListFilters) =>
         ['episodes', 'list', page, filters] as const,
      detail: (id: number) => ['episodes', 'detail', id] as const,
      byIds: (ids: number[]) => ['episodes', 'byIds', ids] as const,
      filtered: (
         page: number,
         season: number,
         appliedName: string,
         characterIds: number[],
      ) => ['episodes', 'filtered', page, season, appliedName, characterIds] as const,
   },
};
