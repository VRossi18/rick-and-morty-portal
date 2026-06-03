import type { CharacterListFilters } from '../../services/characters';
import type { EpisodeListFilters } from '../../services/episodes';
import type { LocationListFilters } from '../../services/locations';

export const queryKeys = {
   characters: {
      list: (page: number, filters: CharacterListFilters) =>
         ['characters', 'list', page, filters] as const,
   },
   locations: {
      list: (page: number, filters: LocationListFilters) =>
         ['locations', 'list', page, filters] as const,
   },
   episodes: {
      list: (page: number, filters: EpisodeListFilters) =>
         ['episodes', 'list', page, filters] as const,
      filtered: (
         page: number,
         season: number,
         appliedName: string,
         characterIds: number[],
      ) => ['episodes', 'filtered', page, season, appliedName, characterIds] as const,
   },
};
