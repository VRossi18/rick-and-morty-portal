import api from './api';
import type { ApiResponse, Episode } from '../types/api';
import { API_CHUNK_SIZE, chunkArray } from '../utils/apiChunks';

export type EpisodeListFilters = {
   name?: string;
   episode?: string;
};

function toApiParams(page: number, filters: EpisodeListFilters): Record<string, string | number> {
   const params: Record<string, string | number> = { page };

   const name = filters.name?.trim();
   if (name) {
      params.name = name;
   }

   const episode = filters.episode?.trim();
   if (episode) {
      params.episode = episode;
   }

   return params;
}

export const EpisodeService = {
   getEpisodes: async (
      page: number,
      filters: EpisodeListFilters = {},
      signal?: AbortSignal,
   ): Promise<ApiResponse<Episode>> => {
      const params = toApiParams(page, filters);
      const { data } = await api.get<ApiResponse<Episode>>('/episode', {
         params,
         ...(signal ? { signal } : {}),
      });
      return data;
   },

   getEpisodeById: async (id: number, signal?: AbortSignal): Promise<Episode> => {
      const { data } = signal
         ? await api.get<Episode>(`/episode/${id}`, { signal })
         : await api.get<Episode>(`/episode/${id}`);
      return data;
   },

   getMultipleEpisodes: async (ids: number[], signal?: AbortSignal): Promise<Episode[]> => {
      if (ids.length === 0) {
         return [];
      }

      const chunks = chunkArray(ids, API_CHUNK_SIZE);
      const batches = await Promise.all(
         chunks.map(async (chunk) => {
            const path = `/episode/${chunk.join(',')}`;
            const { data } = signal
               ? await api.get<Episode | Episode[]>(path, { signal })
               : await api.get<Episode | Episode[]>(path);
            return Array.isArray(data) ? data : [data];
         }),
      );

      return batches.flat();
   },
};
