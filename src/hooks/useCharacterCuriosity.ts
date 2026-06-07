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

   const askMutation = useMutation({
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
      askMutation.reset();
   }, [characterId, locale]);

   const askQuestion = useCallback(
      async (question: string) => {
         const trimmed = question.trim();
         if (!trimmed) {
            throw new Error('EMPTY_QUESTION');
         }

         lastQuestionRef.current = trimmed;
         await askMutation.mutateAsync(trimmed);
      },
      [askMutation],
   );

   const retry = useCallback(async () => {
      if (lastQuestionRef.current) {
         await askMutation.mutateAsync(lastQuestionRef.current);
      } else {
         await initialQuery.refetch();
      }
   }, [askMutation, initialQuery]);

   const text = askMutation.data ?? initialQuery.data ?? null;
   const isLoading =
      isConfigured &&
      ((initialQuery.isPending && !initialQuery.data) || askMutation.isPending);
   const errorMessage =
      askMutation.isError
         ? toCuriosityErrorMessage(askMutation.error)
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
