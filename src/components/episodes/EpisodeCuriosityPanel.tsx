import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEpisodeAiCuriosityConfigured } from '../../config/ai';
import { useEpisodeCuriosity } from '../../hooks/useEpisodeCuriosity';

interface EpisodeCuriosityPanelProps {
   episodeId: number;
}

export function EpisodeCuriosityPanel({ episodeId }: EpisodeCuriosityPanelProps) {
   const { t, i18n } = useTranslation('common');
   const { text, isLoading, errorMessage, askQuestion, retry } = useEpisodeCuriosity(
      episodeId,
      i18n.language,
   );
   const [question, setQuestion] = useState('');
   const [localError, setLocalError] = useState<string | null>(null);

   const handleAsk = useCallback(async () => {
      setLocalError(null);
      if (!question.trim()) {
         setLocalError(t('episodeDetail.curiosity.emptyQuestion'));
         return;
      }

      try {
         await askQuestion(question);
      } catch (err) {
         const code = err instanceof Error ? err.message : '';
         if (code === 'EMPTY_QUESTION') {
            setLocalError(t('episodeDetail.curiosity.emptyQuestion'));
         }
      }
   }, [askQuestion, question, t]);

   if (!isEpisodeAiCuriosityConfigured) {
      return (
         <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {t('episodeDetail.curiosity.notConfigured')}
         </p>
      );
   }

   const resolvedError =
      localError ??
      (errorMessage === 'AI_NOT_CONFIGURED'
         ? t('episodeDetail.curiosity.notConfigured')
         : errorMessage
           ? t('episodeDetail.curiosity.error')
           : null);

   return (
      <section
         aria-labelledby={`episode-curiosity-${episodeId}`}
         className="rounded-2xl border border-primary/25 bg-card/60 p-4 shadow-lg shadow-primary/5"
      >
         <h2
            id={`episode-curiosity-${episodeId}`}
            className="text-sm font-bold uppercase tracking-wide text-primary"
         >
            {t('episodeDetail.curiosity.title')}
         </h2>

         <div className="mt-3 min-h-[4.5rem] rounded-xl border border-border/60 bg-[var(--bg-color)]/70 px-3 py-3 text-sm leading-relaxed text-foreground">
            {isLoading ? (
               <div className="flex items-center gap-2 text-primary">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>{t('episodeDetail.curiosity.loading')}</span>
               </div>
            ) : text ? (
               <p>{text}</p>
            ) : resolvedError ? (
               <p className="text-red-500">{resolvedError}</p>
            ) : null}
         </div>

         {resolvedError && !isLoading ? (
            <button
               type="button"
               onClick={() => void retry()}
               className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
               {t('episodeDetail.curiosity.retry')}
            </button>
         ) : null}

         <div className="mt-4 space-y-2">
            <label htmlFor={`episode-curiosity-question-${episodeId}`} className="sr-only">
               {t('episodeDetail.curiosity.askPlaceholder')}
            </label>
            <textarea
               id={`episode-curiosity-question-${episodeId}`}
               value={question}
               onChange={(event) => setQuestion(event.target.value)}
               rows={2}
               placeholder={t('episodeDetail.curiosity.askPlaceholder')}
               disabled={isLoading}
               className="w-full resize-none rounded-lg border border-primary/40 bg-[var(--bg-color)] px-3 py-2 text-sm disabled:opacity-60"
            />
            <button
               type="button"
               onClick={() => void handleAsk()}
               disabled={isLoading || !question.trim()}
               className={clsx(
                  'w-full rounded-lg border border-primary/60 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50',
               )}
            >
               {isLoading
                  ? t('episodeDetail.curiosity.loading')
                  : t('episodeDetail.curiosity.askButton')}
            </button>
         </div>
      </section>
   );
}
