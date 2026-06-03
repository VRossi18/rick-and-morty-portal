import { isAxiosError } from 'axios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LocationService, type LocationListFilters } from '../../services/locations';
import type { ApiResponse, Location } from '../../types/api';
import { queryKeys } from './queryKeys';

const emptyList: ApiResponse<Location> = {
   info: { count: 0, pages: 1, next: null, prev: null },
   results: [],
};

export function useLocationsQuery(page: number, filters: LocationListFilters) {
   return useQuery({
      queryKey: queryKeys.locations.list(page, filters),
      queryFn: async ({ signal }) => {
         try {
            return await LocationService.getLocations(page, filters, signal);
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
