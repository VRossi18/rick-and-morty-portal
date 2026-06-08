import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import {
   CURIOSITY_CACHE_TTL_MS,
   normalizeCuriosityLocale,
   resolveEpisodeCuriosityUrl,
} from '../config/ai';
import { queryKeys } from './queries/queryKeys';
import {
   requestEpisodeCuriosity,
   toCuriosityErrorMessage,
} from '../services/aiCuriosity';

const curiosityQueryOptions = {
   staleTime: CURIOSITY_CACHE_TTL_MS,
   gcTime: CURIOSITY_CACHE_TTL_MS,
   retry: 1,
} as const;

export function useEpisodeCuriosity(episodeId: number, language: string) {
   const queryClient = useQueryClient();
   const locale = normalizeCuriosityLocale(language);
   const isConfigured = Boolean(resolveEpisodeCuriosityUrl());
   const lastQuestionRef = useRef<string | undefined>(undefined);

   const initialQuery = useQuery({
      queryKey: queryKeys.curiosity.episode.initial(episodeId, locale),
      queryFn: () => requestEpisodeCuriosity({ episodeId, locale }),
      enabled: isConfigured,
      ...curiosityQueryOptions,
   });

   const {
      mutateAsync: askMutateAsync,
      reset: resetAskMutation,
      data: askData,
      isPending: isAskPending,
      isError: isAskError,
      error: askError,
   } = useMutation({
      mutationFn: (question: string) =>
         requestEpisodeCuriosity({ episodeId, locale, question }),
      onSuccess: (text, question) => {
         queryClient.setQueryData(
            queryKeys.curiosity.episode.question(episodeId, locale, question),
            text,
         );
      },
   });

   useEffect(() => {
      lastQuestionRef.current = undefined;
      resetAskMutation();
   }, [episodeId, locale, resetAskMutation]);

   const askQuestion = useCallback(
      async (question: string) => {
         const trimmed = question.trim();
         if (!trimmed) {
            throw new Error('EMPTY_QUESTION');
         }

         lastQuestionRef.current = trimmed;
         await askMutateAsync(trimmed);
      },
      [askMutateAsync],
   );

   const retry = useCallback(async () => {
      if (lastQuestionRef.current) {
         await askMutateAsync(lastQuestionRef.current);
      } else {
         await initialQuery.refetch();
      }
   }, [askMutateAsync, initialQuery]);

   const text = askData ?? initialQuery.data ?? null;
   const isLoading =
      isConfigured &&
      ((initialQuery.isPending && !initialQuery.data) || isAskPending);
   const errorMessage =
      isAskError
         ? toCuriosityErrorMessage(askError)
         : initialQuery.isError
           ? toCuriosityErrorMessage(initialQuery.error)
           : null;

   return {
      text,
      isLoading,
      errorMessage,
      askQuestion,
      retry,
   };
}
