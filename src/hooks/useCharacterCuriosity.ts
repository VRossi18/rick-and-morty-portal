import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import {
   CURIOSITY_CACHE_TTL_MS,
   normalizeCuriosityLocale,
   resolveAiApiUrl,
} from '../config/ai';
import { queryKeys } from './queries/queryKeys';
import {
   requestCharacterCuriosity,
   toCuriosityErrorMessage,
} from '../services/aiCuriosity';

const curiosityQueryOptions = {
   staleTime: CURIOSITY_CACHE_TTL_MS,
   gcTime: CURIOSITY_CACHE_TTL_MS,
   retry: 1,
} as const;

export function useCharacterCuriosity(characterId: number, language: string) {
   const queryClient = useQueryClient();
   const locale = normalizeCuriosityLocale(language);
   const isConfigured = Boolean(resolveAiApiUrl());
   const lastQuestionRef = useRef<string | undefined>(undefined);

   const initialQuery = useQuery({
      queryKey: queryKeys.curiosity.character.initial(characterId, locale),
      queryFn: () => requestCharacterCuriosity({ characterId, locale }),
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
         requestCharacterCuriosity({ characterId, locale, question }),
      onSuccess: (text, question) => {
         queryClient.setQueryData(
            queryKeys.curiosity.character.question(characterId, locale, question),
            text,
         );
      },
   });

   useEffect(() => {
      lastQuestionRef.current = undefined;
      resetAskMutation();
   }, [characterId, locale, resetAskMutation]);

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
