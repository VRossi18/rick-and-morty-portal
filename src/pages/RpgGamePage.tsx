import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { RpgGameChat } from '../components/rpg/RpgGameChat';
import { loadRpgSession } from '../utils/rpgSessionStorage';

export function RpgGamePage() {
   const { t } = useTranslation('common');
   const characterSheet = loadRpgSession();

   if (!characterSheet) {
      return <Navigate to="/rpg" replace />;
   }

   const characterName = characterSheet.character.name.trim();

   return (
      <m.div
         className="flex min-h-[calc(100vh-4rem)] flex-col bg-[var(--bg-color)] text-[var(--text-color)]"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.25, ease: 'easeOut' }}
      >
         <header className="border-b border-border px-4 py-4 md:px-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <h1 className="text-xl font-bold text-foreground">{t('rpg.game.title')}</h1>
                  <p className="text-sm text-muted-foreground">
                     {t('rpg.game.playingAs', { name: characterName })}
                  </p>
               </div>
               <Link
                  to="/rpg"
                  className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
               >
                  {t('rpg.game.backToCreator')}
               </Link>
            </div>
         </header>

         <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 md:px-6 md:py-6">
            <RpgGameChat characterSheet={characterSheet} />
         </main>
      </m.div>
   );
}
