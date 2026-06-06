import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CharacterSheetExportDocument } from '../components/rpg/buildCharacterSheetExport';
import {
   normalizeCuriosityLocale,
   resolveRpgChatApiUrl,
   type CuriosityLocale,
} from '../config/ai';

export interface RpgChatUiMessage {
   id: string;
   role: 'user' | 'assistant';
   text: string;
}

const MAX_HISTORY = 20;

interface RpgChatApiMessage {
   role: 'user' | 'assistant';
   content: string;
}

async function requestRpgChat(options: {
   locale: CuriosityLocale;
   characterSheet: CharacterSheetExportDocument;
   messages: RpgChatApiMessage[];
   opening?: boolean;
}): Promise<string> {
   const apiUrl = resolveRpgChatApiUrl();
   if (!apiUrl) {
      throw new Error('AI_NOT_CONFIGURED');
   }

   const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
   });

   if (response.status === 429) {
      throw new Error('RATE_LIMIT');
   }
   if (response.status === 503) {
      throw new Error('AI_NOT_CONFIGURED');
   }
   if (!response.ok) {
      throw new Error('FETCH_FAILED');
   }

   const data = (await response.json()) as { text?: string };
   if (!data.text) {
      throw new Error('FETCH_FAILED');
   }

   return data.text;
}

function toApiMessages(messages: RpgChatUiMessage[]): RpgChatApiMessage[] {
   return messages.map((m) => ({ role: m.role, content: m.text }));
}

export function useRpgChat(characterSheet: CharacterSheetExportDocument, language: string) {
   const locale = normalizeCuriosityLocale(language);
   const isConfigured = Boolean(resolveRpgChatApiUrl());
   const idPrefix = useId();
   const messageCounter = useRef(0);
   const [messages, setMessages] = useState<RpgChatUiMessage[]>([]);
   const [isLoading, setIsLoading] = useState(isConfigured);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const openingRequested = useRef(false);

   const nextId = useCallback(() => {
      messageCounter.current += 1;
      return `${idPrefix}-${messageCounter.current}`;
   }, [idPrefix]);

   const fetchOpening = useCallback(async () => {
      if (!isConfigured) {
         setErrorMessage('AI_NOT_CONFIGURED');
         setIsLoading(false);
         return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
         const text = await requestRpgChat({
            locale,
            characterSheet,
            messages: [],
            opening: true,
         });
         setMessages([{ id: nextId(), role: 'assistant', text }]);
      } catch (err) {
         const code = err instanceof Error ? err.message : 'FETCH_FAILED';
         setErrorMessage(code);
      } finally {
         setIsLoading(false);
      }
   }, [characterSheet, isConfigured, locale, nextId]);

   useEffect(() => {
      if (openingRequested.current) {
         return;
      }
      openingRequested.current = true;
      void fetchOpening();
   }, [fetchOpening]);

   const sendMessage = useCallback(
      async (rawText: string) => {
         const text = rawText.trim();
         if (!text || isLoading) {
            return;
         }
         if (!isConfigured) {
            setErrorMessage('AI_NOT_CONFIGURED');
            return;
         }

         const userMessage: RpgChatUiMessage = { id: nextId(), role: 'user', text };
         const history = [...messages, userMessage];
         setMessages(history);
         setIsLoading(true);
         setErrorMessage(null);

         try {
            const apiMessages = toApiMessages(history).slice(-MAX_HISTORY);
            const reply = await requestRpgChat({
               locale,
               characterSheet,
               messages: apiMessages,
            });
            setMessages((current) => [
               ...current,
               { id: nextId(), role: 'assistant', text: reply },
            ]);
         } catch (err) {
            const code = err instanceof Error ? err.message : 'FETCH_FAILED';
            setErrorMessage(code);
            setMessages((current) => current.filter((m) => m.id !== userMessage.id));
         } finally {
            setIsLoading(false);
         }
      },
      [characterSheet, isConfigured, isLoading, locale, messages, nextId],
   );

   const retry = useCallback(() => {
      if (messages.length === 0) {
         void fetchOpening();
         return;
      }
      setErrorMessage(null);
   }, [fetchOpening, messages.length]);

   return {
      messages,
      isLoading,
      errorMessage,
      isConfigured,
      sendMessage,
      retry,
   };
}
