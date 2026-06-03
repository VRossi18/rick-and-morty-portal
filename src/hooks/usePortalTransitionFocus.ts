import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import type { CardInteraction } from '../components/characters/CharacterCard';

export function usePortalTransitionFocus() {
   const [focusId, setFocusId] = useState<number | null>(null);

   const handleBeforeNavigate = useCallback((id: number) => {
      flushSync(() => {
         setFocusId(id);
      });
   }, []);

   const cardInteraction = useCallback(
      (id: number): CardInteraction => {
         if (focusId === null) {
            return 'normal';
         }
         return focusId === id ? 'source' : 'dimmed';
      },
      [focusId],
   );

   return { handleBeforeNavigate, cardInteraction };
}
