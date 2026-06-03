import { m } from 'framer-motion';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Character } from '../../types/api';
import type { CharacterLocationState } from '../../types/navigation';

export type CardInteraction = 'normal' | 'source' | 'dimmed';

interface Props {
   character: Character;
   interaction?: CardInteraction;
   onBeforeNavigate?: (id: number) => void;
}

function CharacterCardInner({ character, interaction = 'normal', onBeforeNavigate }: Props) {
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
      const state: CharacterLocationState = {
         portal: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      };
      onBeforeNavigate?.(character.id);
      navigate(`/character/${character.id}`, { state });
   };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         openDetail();
      }
   };

   const statusColor =
      character.status === 'Alive'
         ? 'var(--portal-green)'
         : character.status === 'Dead'
           ? 'var(--destructive)'
           : 'var(--muted-foreground)';

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
         aria-label={t('card.ariaViewDetails', { name: character.name })}
         animate={interactionMotion}
         transition={{ duration: 0.22, ease: 'easeOut' }}
         onMouseMove={handleMove}
         onClick={openDetail}
         onKeyDown={handleKeyDown}
         className="character-card-item glow-card group cursor-pointer outline-none ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-color)]"
      >
         <div className="aspect-square overflow-hidden">
            <img
               src={character.image}
               alt={character.name}
               loading="lazy"
               className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
         </div>
         <div className="p-4 space-y-2">
            <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-1">
               {character.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <span
                  className="status-dot"
                  style={{ color: statusColor, backgroundColor: statusColor }}
               />
               <span>
                  {character.status} — {character.species}
               </span>
            </div>
            <div className="text-xs text-muted-foreground">
               <p className="truncate">
                  <span className="opacity-60">{t('card.origin')}</span> {character.origin.name}
               </p>
               <p className="truncate">
                  <span className="opacity-60">{t('card.location')}</span> {character.location.name}
               </p>
            </div>
         </div>
      </m.div>
   );
}

export const CharacterCard = memo(CharacterCardInner);
