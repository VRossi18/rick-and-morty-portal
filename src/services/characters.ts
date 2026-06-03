import api from './api';
import type { ApiResponse, Character } from '../types/api';
import { API_CHUNK_SIZE, chunkArray } from '../utils/apiChunks';

/**
 * Filtros da listagem (UI). `status` e `gender` são enviados em minúsculas à API,
 * conforme https://rickandmortyapi.com/documentation/#character-schema
 */
export type CharacterListFilters = {
   name?: string;
   status?: string;
   gender?: string;
   species?: string;
   type?: string;
};

function toApiParams(page: number, filters: CharacterListFilters): Record<string, string | number> {
   const params: Record<string, string | number> = { page };

   const name = filters.name?.trim();
   if (name) {
      params.name = name;
   }

   const species = filters.species?.trim();
   if (species) {
      params.species = species;
   }

   const type = filters.type?.trim();
   if (type) {
      params.type = type;
   }

   const status = filters.status?.trim();
   if (status) {
      params.status = status.toLowerCase();
   }

   const gender = filters.gender?.trim();
   if (gender) {
      params.gender = gender.toLowerCase();
   }

   return params;
}

export const CharacterService = {
   /**
    * Lista paginada de personagens com filtros opcionais da API oficial.
    */
   getCharacters: async (
      page: number,
      filters: CharacterListFilters = {},
      signal?: AbortSignal,
   ): Promise<ApiResponse<Character>> => {
      const params = toApiParams(page, filters);
      const { data } = await api.get<ApiResponse<Character>>('/character', {
         params,
         ...(signal ? { signal } : {}),
      });
      return data;
   },

   /**
    * Obtém os detalhes de um único personagem pelo ID.
    */
   getCharacterById: async (id: number, signal?: AbortSignal): Promise<Character> => {
      const { data } = signal
         ? await api.get<Character>(`/character/${id}`, { signal })
         : await api.get<Character>(`/character/${id}`);
      return data;
   },

   /**
    * Obtém múltiplos personagens simultaneamente através de um array de IDs.
    */
   getMultipleCharacters: async (ids: number[], signal?: AbortSignal): Promise<Character[]> => {
      if (ids.length === 0) {
         return [];
      }

      const chunks = chunkArray(ids, API_CHUNK_SIZE);
      const batches = await Promise.all(
         chunks.map(async (chunk) => {
            const path = `/character/${chunk.join(',')}`;
            const { data } = signal
               ? await api.get<Character | Character[]>(path, { signal })
               : await api.get<Character | Character[]>(path);
            return Array.isArray(data) ? data : [data];
         }),
      );

      return batches.flat();
   },
};
