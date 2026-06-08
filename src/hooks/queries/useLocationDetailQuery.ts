import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CharacterService } from '../../services/characters';
import { LocationService } from '../../services/locations';
import { characterUrlToId } from '../../utils/episodeCharacters';
import {
   fetchEpisodesByIds,
   uniqueEpisodeIdsFromCharacters,
} from '../../utils/locationEpisodes';
import { detailQueryOptions } from './detailQueryOptions';
import { queryKeys } from './queryKeys';

export function useLocationDetailQuery(id: number, enabled: boolean) {
   return useQuery({
      queryKey: queryKeys.locations.detail(id),
      queryFn: () => LocationService.getLocationById(id),
      enabled,
      ...detailQueryOptions,
   });
}

export function useLocationResidentsQuery(
   locationId: number,
   residentUrls: string[] | undefined,
) {
   const residentIds = useMemo(
      () =>
         (residentUrls ?? [])
            .map(characterUrlToId)
            .filter((charId): charId is number => charId !== null),
      [residentUrls],
   );

   return useQuery({
      queryKey: queryKeys.locations.residents(locationId),
      queryFn: () => CharacterService.getMultipleCharacters(residentIds),
      enabled: residentIds.length > 0,
      ...detailQueryOptions,
   });
}

export function useLocationEpisodesQuery(residents: { episode: string[] }[] | undefined) {
   const episodeIds = useMemo(
      () => (residents ? uniqueEpisodeIdsFromCharacters(residents) : []),
      [residents],
   );

   return useQuery({
      queryKey: queryKeys.episodes.byIds(episodeIds),
      queryFn: () => fetchEpisodesByIds(episodeIds),
      enabled: episodeIds.length > 0,
      ...detailQueryOptions,
   });
}
