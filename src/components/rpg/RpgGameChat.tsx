import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CharacterSheetExportDocument } from './buildCharacterSheetExport';
import { useRpgChat } from '../../hooks/useRpgChat';

interface RpgGameChatProps {
   characterSheet: CharacterSheetExportDocument;
}

export function RpgGameChat({ characterSheet }: RpgGameChatProps) {
   const { t, i18n } = useTranslation('common');
   const [draft, setDraft] = useState('');
   const listRef = useRef<HTMLDivElement>(null);
   const { messages, isLoading, errorMessage, isConfigured, sendMessage, retry } = useRpgChat(
      characterSheet,
      i18n.language,
   );

   const handleSubmit = useCallback(
      (event: React.FormEvent) => {
         event.preventDefault();
         const text = draft.trim();
         if (!text) {
            return;
         }
         void sendMessage(text);
         setDraft('');
      },
      [draft, sendMessage],
   );

   const errorText =
      errorMessage === 'AI_NOT_CONFIGURED'
         ? t('rpg.game.notConfigured')
         : errorMessage === 'RATE_LIMIT'
           ? t('rpg.game.rateLimit')
           : errorMessage
             ? t('rpg.game.error')
             : null;

   return (
      <section
         aria-label={t('rpg.game.chatLabel')}
         className="flex min-h-[24rem] flex-1 flex-col rounded-lg border border-border bg-card"
      >
         <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto p-4"
            aria-live="polite"
            aria-busy={isLoading}
         >
            {!isConfigured ? (
               <p className="text-sm text-muted-foreground">{t('rpg.game.notConfigured')}</p>
            ) : null}

            {messages.map((message) => (
               <div
                  key={message.id}
                  className={
                     message.role === 'user'
                        ? 'ml-8 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground'
                        : 'mr-8 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground'
                  }
               >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                     {message.role === 'user' ? t('rpg.game.playerLabel') : t('rpg.game.gmLabel')}
                  </p>
                  <p className="whitespace-pre-wrap">{message.text}</p>
               </div>
            ))}

            {isLoading && messages.length === 0 ? (
               <p className="text-sm font-semibold text-primary">{t('rpg.game.openingLoading')}</p>
            ) : null}

            {isLoading && messages.length > 0 ? (
               <p className="text-sm text-muted-foreground">{t('rpg.game.loading')}</p>
            ) : null}
         </div>

         {errorText ? (
            <div className="border-t border-border px-4 py-2">
               <p className="text-sm text-destructive">{errorText}</p>
               <button
                  type="button"
                  onClick={retry}
                  className="mt-2 text-sm font-semibold text-primary underline"
               >
                  {t('rpg.game.retry')}
               </button>
            </div>
         ) : null}

         <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-4">
            <label htmlFor="rpg-game-input" className="sr-only">
               {t('rpg.game.inputPlaceholder')}
            </label>
            <input
               id="rpg-game-input"
               type="text"
               value={draft}
               onChange={(event) => setDraft(event.target.value)}
               placeholder={t('rpg.game.inputPlaceholder')}
               disabled={!isConfigured || isLoading}
               maxLength={2000}
               className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
            <button
               type="submit"
               disabled={!isConfigured || isLoading || draft.trim().length === 0}
               className="rounded-lg border border-primary/60 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
               {isLoading ? t('rpg.game.loading') : t('rpg.game.send')}
            </button>
         </form>
      </section>
   );
}
