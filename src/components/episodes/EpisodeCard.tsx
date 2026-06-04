import { m } from 'framer-motion';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Episode } from '../../types/api';
import type { EpisodeLocationState } from '../../types/navigation';
import type { CardInteraction } from '../characters/CharacterCard';

interface Props {
   episode: Episode;
   interaction?: CardInteraction;
   onBeforeNavigate?: (id: number) => void;
}

function EpisodeCardInner({ episode, interaction = 'normal', onBeforeNavigate }: Props) {
   const ref = useRef<HTMLDivElement>(null);
   const navigate = useNavigate();
   const { t } = useTranslation('common');

   const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
   };

   const openDetail = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const state: EpisodeLocationState = {
         portal: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      };
      onBeforeNavigate?.(episode.id);
      navigate(`/episode/${episode.id}`, { state });
   };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         openDetail();
      }
   };

   const interactionMotion =
      interaction === 'dimmed'
         ? { opacity: 0.32, scale: 0.92, filter: 'blur(2px)' as const }
         : interaction === 'source'
           ? { opacity: 1, scale: 1.04, filter: 'blur(0px)' as const, zIndex: 2 }
           : { opacity: 1, scale: 1, filter: 'blur(0px)' as const, zIndex: 0 };

   return (
      <m.div
         ref={ref}
         role="link"
         tabIndex={0}
         aria-label={t('episodes.card.ariaViewDetails', { name: episode.name })}
         animate={interactionMotion}
         transition={{ duration: 0.22, ease: 'easeOut' }}
         onMouseMove={handleMove}
         onClick={openDetail}
         onKeyDown={handleKeyDown}
         className="episode-card-item glow-card group h-full cursor-pointer outline-none ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-color)]"
      >
         <div className="border-b border-primary/20 bg-gradient-to-br from-primary/15 via-transparent to-[var(--portal-cyan)]/10 px-4 py-5">
            <span className="inline-block rounded-md border border-primary/50 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-primary">
               {episode.episode}
            </span>
            <h3 className="mt-3 text-lg font-semibold leading-tight text-foreground line-clamp-2">
               {episode.name}
            </h3>
         </div>
         <div className="space-y-2 p-4 text-sm text-muted-foreground">
            <p>
               <span className="opacity-60">{t('episodes.card.airDate')}</span> {episode.air_date}
            </p>
            <p>{t('episodes.card.characterCount', { count: episode.characters.length })}</p>
         </div>
      </m.div>
   );
}

export const EpisodeCard = memo(EpisodeCardInner);
