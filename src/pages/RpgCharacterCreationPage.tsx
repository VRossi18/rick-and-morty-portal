import { m } from 'framer-motion';
import { CharacterSheetContainer } from '../components/rpg/CharacterSheetContainer';

export function RpgCharacterCreationPage() {
   return (
      <m.div
         className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.25, ease: 'easeOut' }}
      >
         <CharacterSheetContainer />
      </m.div>
   );
}
