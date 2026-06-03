import { isAxiosError } from 'axios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CharacterService, type CharacterListFilters } from '../../services/characters';
import type { ApiResponse, Character } from '../../types/api';
import { queryKeys } from './queryKeys';

const emptyList: ApiResponse<Character> = {
   info: { count: 0, pages: 1, next: null, prev: null },
   results: [],
};

export function useCharactersQuery(page: number, filters: CharacterListFilters) {
   return useQuery({
      queryKey: queryKeys.characters.list(page, filters),
      queryFn: async ({ signal }) => {
         try {
            return await CharacterService.getCharacters(page, filters, signal);
         } catch (err) {
            if (isAxiosError(err) && err.response?.status === 404) {
               return emptyList;
            }
            throw err;
         }
      },
      placeholderData: keepPreviousData,
   });
}
