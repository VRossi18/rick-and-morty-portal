import { isAxiosError } from 'axios';

export const DETAIL_QUERY_STALE_MS = 10 * 60 * 1000;

export function shouldRetryDetailQuery(failureCount: number, error: unknown): boolean {
   if (isAxiosError(error) && error.response?.status === 404) {
      return false;
   }
   return failureCount < 1;
}

export const detailQueryOptions = {
   staleTime: DETAIL_QUERY_STALE_MS,
   gcTime: DETAIL_QUERY_STALE_MS,
   retry: shouldRetryDetailQuery,
} as const;
