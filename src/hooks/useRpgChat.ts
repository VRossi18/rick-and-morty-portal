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

type SendMutationVariables = {
   userMessage: RpgChatUiMessage;
   history: RpgChatApiMessage[];
   sheet: CharacterSheetExportDocument;
};

type LastFailedRequest = { type: 'opening' } | ({ type: 'send' } & SendMutationVariables);

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
   const lastFailedRequestRef = useRef<LastFailedRequest | null>(null);
   const [messages, setMessages] = useState<RpgChatUiMessage[]>([]);
   const [runtimeError, setRuntimeError] = useState<string | null>(null);

   const errorMessage = !isConfigured ? 'AI_NOT_CONFIGURED' : runtimeError;

   const nextId = useCallback(() => {
      messageCounter.current += 1;
      return `${idPrefix}-${messageCounter.current}`;
   }, [idPrefix]);

   const openingMutation = useMutation({
      mutationFn: () =>
         requestRpgChat({
            locale,
            characterSheet,
            messages: [],
            opening: true,
         }),
      onSuccess: (text) => {
         lastFailedRequestRef.current = null;
         setMessages([{ id: nextId(), role: 'assistant', text }]);
         setRuntimeError(null);
      },
      onError: (err) => {
         lastFailedRequestRef.current = { type: 'opening' };
         setRuntimeError(toRpgErrorMessage(err));
      },
   });

   useEffect(() => {
      if (!isConfigured || openingRequested.current) {
         return;
      }
      openingRequested.current = true;
      openingMutation.mutate();
   }, [isConfigured, openingMutation]);

   const sendMutation = useMutation({
      mutationFn: async ({ userMessage, history, sheet }: SendMutationVariables) => {
         const reply = await requestRpgChat({
            locale,
            characterSheet: sheet,
            messages: history,
         });
         return { userMessage, reply };
      },
      onMutate: ({ userMessage }) => {
         setMessages((current) => [...current, userMessage]);
         setRuntimeError(null);
      },
      onSuccess: ({ reply }) => {
         lastFailedRequestRef.current = null;
         setMessages((current) => [
            ...current,
            { id: nextId(), role: 'assistant', text: reply },
         ]);
      },
      onError: (err, variables) => {
         lastFailedRequestRef.current = { type: 'send', ...variables };
         setRuntimeError(toRpgErrorMessage(err));
         setMessages((current) =>
            current.filter((message) => message.id !== variables.userMessage.id),
         );
      },
   });

   const sendMessage = useCallback(
      async (rawText: string) => {
         const text = rawText.trim();
         if (!text || !isConfigured) {
            return;
         }
         if (openingMutation.isPending || sendMutation.isPending) {
            return;
         }

         const userMessage: RpgChatUiMessage = { id: nextId(), role: 'user', text };
         const history = toApiMessages([...messages, userMessage]).slice(-MAX_HISTORY);
         await sendMutation.mutateAsync({
            userMessage,
            history,
            sheet: characterSheet,
         });
      },
      [
         characterSheet,
         isConfigured,
         messages,
         nextId,
         openingMutation.isPending,
         sendMutation,
      ],
   );

   const retry = useCallback(() => {
      setRuntimeError(null);
      const failed = lastFailedRequestRef.current;

      if (failed?.type === 'send') {
         void sendMutation.mutateAsync({
            userMessage: failed.userMessage,
            history: failed.history,
            sheet: failed.sheet,
         });
         return;
      }

      openingMutation.mutate();
   }, [openingMutation, sendMutation]);

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
