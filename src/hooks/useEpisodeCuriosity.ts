import { useCallback, useEffect, useRef, useState } from 'react';
import {
   normalizeCuriosityLocale,
   resolveEpisodeCuriosityUrl,
   type CuriosityLocale,
} from '../config/ai';

interface FetchCuriosityOptions {
   episodeId: number;
   locale: CuriosityLocale;
   question?: string;
}

async function requestEpisodeCuriosity({
   episodeId,
   locale,
   question,
}: FetchCuriosityOptions): Promise<string> {
   const apiUrl = resolveEpisodeCuriosityUrl();
   if (!apiUrl) {
      throw new Error('AI_NOT_CONFIGURED');
   }

   const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         episodeId,
         locale,
         ...(question ? { question } : {}),
      }),
   });

   if (!response.ok) {
      throw new Error('FETCH_FAILED');
   }

   const data = (await response.json()) as { text?: string };
   if (!data.text) {
      throw new Error('FETCH_FAILED');
   }

   return data.text;
}

export function useEpisodeCuriosity(episodeId: number, language: string) {
   const locale = normalizeCuriosityLocale(language);
   const isConfigured = Boolean(resolveEpisodeCuriosityUrl());
   const [text, setText] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(isConfigured);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const lastQuestionRef = useRef<string | undefined>(undefined);

   useEffect(() => {
      if (!isConfigured) {
         return;
      }

      let cancelled = false;
      lastQuestionRef.current = undefined;

      void (async () => {
         try {
            const result = await requestEpisodeCuriosity({ episodeId, locale });
            if (!cancelled) {
               setText(result);
               setErrorMessage(null);
            }
         } catch (err) {
            if (!cancelled) {
               const code = err instanceof Error ? err.message : '';
               setErrorMessage(code === 'AI_NOT_CONFIGURED' ? 'AI_NOT_CONFIGURED' : 'FETCH_FAILED');
            }
         } finally {
            if (!cancelled) {
               setIsLoading(false);
            }
         }
      })();

      return () => {
         cancelled = true;
      };
   }, [episodeId, isConfigured, locale]);

   const runRequest = useCallback(
      async (question?: string) => {
         setIsLoading(true);
         setErrorMessage(null);

         try {
            const result = await requestEpisodeCuriosity({
               episodeId,
               locale,
               question,
            });
            setText(result);
         } catch (err) {
            const code = err instanceof Error ? err.message : '';
            setErrorMessage(code === 'AI_NOT_CONFIGURED' ? 'AI_NOT_CONFIGURED' : 'FETCH_FAILED');
            throw err;
         } finally {
            setIsLoading(false);
         }
      },
      [episodeId, locale],
   );

   const askQuestion = useCallback(
      async (question: string) => {
         const trimmed = question.trim();
         if (!trimmed) {
            throw new Error('EMPTY_QUESTION');
         }

         lastQuestionRef.current = trimmed;
         await runRequest(trimmed);
      },
      [runRequest],
   );

   const retry = useCallback(async () => {
      await runRequest(lastQuestionRef.current);
   }, [runRequest]);

   return {
      text,
      isLoading,
      errorMessage,
      askQuestion,
      retry,
   };
}
