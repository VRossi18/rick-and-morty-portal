import { isAxiosError } from 'axios';

export type FetchErrorKey = 'notFound' | 'loadFailed';

export function mapDetailQueryError(error: unknown): FetchErrorKey {
   if (isAxiosError(error) && error.response?.status === 404) {
      return 'notFound';
   }
   return 'loadFailed';
}
