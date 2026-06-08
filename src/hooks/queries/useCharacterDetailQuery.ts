import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CharacterService } from '../../services/characters';
import { fetchEpisodesByIds } from '../../utils/locationEpisodes';
import { episodeUrlToId } from '../../utils/locationUrls';
import { detailQueryOptions } from './detailQueryOptions';
import { queryKeys } from './queryKeys';

export function useCharacterDetailQuery(id: number, enabled: boolean) {
   return useQuery({
      queryKey: queryKeys.characters.detail(id),
      queryFn: () => CharacterService.getCharacterById(id),
      enabled,
      ...detailQueryOptions,
   });
}

export function useCharacterEpisodesQuery(episodeUrls: string[] | undefined) {
   const episodeIds = useMemo(
      () =>
         (episodeUrls ?? [])
            .map(episodeUrlToId)
            .filter((episodeId): episodeId is number => episodeId !== null),
      [episodeUrls],
   );

   return useQuery({
      queryKey: queryKeys.episodes.byIds(episodeIds),
      queryFn: () => fetchEpisodesByIds(episodeIds),
      enabled: episodeIds.length > 0,
      ...detailQueryOptions,
   });
}
