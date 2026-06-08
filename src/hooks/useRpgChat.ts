import { useMutation } from '@tanstack/react-query';
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

function toRpgErrorMessage(err: unknown): string {
   return err instanceof Error ? err.message : 'FETCH_FAILED';
}

export function useRpgChat(characterSheet: CharacterSheetExportDocument, language: string) {
   const locale = normalizeCuriosityLocale(language);
   const isConfigured = Boolean(resolveRpgChatApiUrl());
   const idPrefix = useId();
   const messageCounter = useRef(0);
   const openingRequested = useRef(false);
   const [messages, setMessages] = useState<RpgChatUiMessage[]>([]);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const messagesRef = useRef(messages);
   const characterSheetRef = useRef(characterSheet);

   messagesRef.current = messages;
   characterSheetRef.current = characterSheet;

   const nextId = useCallback(() => {
      messageCounter.current += 1;
      return `${idPrefix}-${messageCounter.current}`;
   }, [idPrefix]);

   const openingMutation = useMutation({
      mutationFn: () =>
         requestRpgChat({
            locale,
            characterSheet: characterSheetRef.current,
            messages: [],
            opening: true,
         }),
      onSuccess: (text) => {
         setMessages([{ id: nextId(), role: 'assistant', text }]);
         setErrorMessage(null);
      },
      onError: (err) => {
         setErrorMessage(toRpgErrorMessage(err));
      },
   });

   useEffect(() => {
      if (!isConfigured) {
         setErrorMessage('AI_NOT_CONFIGURED');
         return;
      }
      if (openingRequested.current) {
         return;
      }
      openingRequested.current = true;
      openingMutation.mutate();
   }, [isConfigured, openingMutation]);

   const sendMutation = useMutation({
      mutationFn: async ({
         userMessage,
         history,
      }: {
         userMessage: RpgChatUiMessage;
         history: RpgChatApiMessage[];
      }) => {
         const reply = await requestRpgChat({
            locale,
            characterSheet: characterSheetRef.current,
            messages: history,
         });
         return { userMessage, reply };
      },
      onMutate: ({ userMessage }) => {
         setMessages((current) => [...current, userMessage]);
         setErrorMessage(null);
      },
      onSuccess: ({ reply }) => {
         setMessages((current) => [
            ...current,
            { id: nextId(), role: 'assistant', text: reply },
         ]);
      },
      onError: (err, { userMessage }) => {
         setErrorMessage(toRpgErrorMessage(err));
         setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      },
   });

   const sendMessage = useCallback(
      async (rawText: string) => {
         const text = rawText.trim();
         if (!text) {
            return;
         }
         if (!isConfigured) {
            setErrorMessage('AI_NOT_CONFIGURED');
            return;
         }
         if (openingMutation.isPending || sendMutation.isPending) {
            return;
         }

         const userMessage: RpgChatUiMessage = { id: nextId(), role: 'user', text };
         const history = toApiMessages([...messagesRef.current, userMessage]).slice(-MAX_HISTORY);
         await sendMutation.mutateAsync({ userMessage, history });
      },
      [isConfigured, nextId, openingMutation.isPending, sendMutation],
   );

   const retry = useCallback(() => {
      if (messagesRef.current.length === 0) {
         setErrorMessage(null);
         openingMutation.mutate();
         return;
      }
      setErrorMessage(null);
   }, [openingMutation]);

   const isLoading =
      isConfigured && (openingMutation.isPending || sendMutation.isPending);

   return {
      messages,
      isLoading,
      errorMessage,
      isConfigured,
      sendMessage,
      retry,
   };
}
