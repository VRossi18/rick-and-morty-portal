import { isAxiosError } from 'axios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EpisodeService, type EpisodeListFilters } from '../../services/episodes';
import type { Episode, Info } from '../../types/api';
import {
   episodeIncludesAllCharacters,
   fetchAllEpisodes,
   paginateEpisodes,
} from '../../utils/episodeCharacters';
import { filterEpisodesBySeason, sortEpisodesByCode } from '../../utils/episodeSeason';
import { queryKeys } from './queryKeys';

const emptyInfo: Info = { count: 0, pages: 1, next: null, prev: null };

export function useEpisodesListQuery(page: number, filters: EpisodeListFilters, enabled: boolean) {
   return useQuery({
      queryKey: queryKeys.episodes.list(page, filters),
      enabled,
      queryFn: async ({ signal }) => {
         try {
            const data = await EpisodeService.getEpisodes(page, filters, signal);
            return {
               results: sortEpisodesByCode(data.results),
               info: data.info,
            };
         } catch (err) {
            if (isAxiosError(err) && err.response?.status === 404) {
               return { results: [], info: emptyInfo };
            }
            throw err;
         }
      },
      placeholderData: keepPreviousData,
   });
}

export function useEpisodesCharacterFilterQuery(options: {
   page: number;
   season: number;
   appliedName: string;
   characterIds: number[];
   enabled: boolean;
}) {
   const { page, season, appliedName, characterIds, enabled } = options;

   return useQuery({
      queryKey: queryKeys.episodes.filtered(page, season, appliedName, characterIds),
      enabled: enabled && characterIds.length > 0,
      queryFn: async ({ signal }) => {
         try {
            const all = await fetchAllEpisodes(appliedName ? { name: appliedName } : {}, signal);
            const forSeason = filterEpisodesBySeason(all, season);
            const filtered = forSeason.filter((episode) =>
               episodeIncludesAllCharacters(episode, characterIds),
            );
            const sorted = sortEpisodesByCode(filtered);
            return paginateEpisodes(sorted, page);
         } catch (err) {
            if (isAxiosError(err) && err.response?.status === 404) {
               return { results: [], info: emptyInfo };
            }
            throw err;
         }
      },
      placeholderData: keepPreviousData,
   });
}

export type EpisodesQueryResult = {
   results: Episode[];
   info: Info;
};

export function mergeEpisodesQueryResults(
   filtered: EpisodesQueryResult | undefined,
   listed: EpisodesQueryResult | undefined,
   useCharacterFilter: boolean,
): EpisodesQueryResult {
   if (useCharacterFilter) {
      return filtered ?? { results: [], info: emptyInfo };
   }
   return listed ?? { results: [], info: emptyInfo };
}
