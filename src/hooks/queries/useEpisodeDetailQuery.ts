import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CharacterService } from '../../services/characters';
import { EpisodeService } from '../../services/episodes';
import { characterUrlToId } from '../../utils/episodeCharacters';
import { detailQueryOptions } from './detailQueryOptions';
import { queryKeys } from './queryKeys';

export function useEpisodeDetailQuery(id: number, enabled: boolean) {
   return useQuery({
      queryKey: queryKeys.episodes.detail(id),
      queryFn: () => EpisodeService.getEpisodeById(id),
      enabled,
      ...detailQueryOptions,
   });
}

export function useEpisodeCharactersQuery(
   characterUrls: string[] | undefined,
) {
   const characterIds = useMemo(
      () =>
         (characterUrls ?? [])
            .map(characterUrlToId)
            .filter((charId): charId is number => charId !== null),
      [characterUrls],
   );

   return useQuery({
      queryKey: ['characters', 'byIds', characterIds] as const,
      queryFn: () => CharacterService.getMultipleCharacters(characterIds),
      enabled: characterIds.length > 0,
      ...detailQueryOptions,
   });
}
