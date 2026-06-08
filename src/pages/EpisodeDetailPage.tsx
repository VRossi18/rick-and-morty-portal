import { m } from 'framer-motion';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { EpisodeCuriosityPanel } from '../components/episodes/EpisodeCuriosityPanel';
import {
   useEpisodeCharactersQuery,
   useEpisodeDetailQuery,
} from '../hooks/queries/useEpisodeDetailQuery';
import { mapDetailQueryError } from '../hooks/queries/mapDetailQueryError';
import type { EpisodeLocationState } from '../types/navigation';
import { formatLocaleDate } from '../utils/formatLocaleDate';

type DetailErrorKey = 'invalidId' | 'notFound' | 'loadFailed';

export function EpisodeDetailPage() {
   const { t, i18n } = useTranslation('common');
   const { id: idParam } = useParams();
   const location = useLocation();
   const portal = (location.state as EpisodeLocationState | null)?.portal;

   const id = useMemo(() => {
      const n = Number(idParam);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : NaN;
   }, [idParam]);

   const invalidId = Number.isNaN(id);
   const canFetch = !invalidId;

   const episodeQuery = useEpisodeDetailQuery(id, canFetch);
   const charactersQuery = useEpisodeCharactersQuery(episodeQuery.data?.characters);

   const episode = episodeQuery.data;
   const characters = charactersQuery.data ?? [];
   const loading = canFetch && episodeQuery.isPending && !episode;

   const fetchErrorKey = episodeQuery.isError ? mapDetailQueryError(episodeQuery.error) : null;
   const errorKey: DetailErrorKey | null = invalidId ? 'invalidId' : fetchErrorKey;

   const dateLocale = i18n.language.startsWith('en') ? 'en-US' : 'pt-BR';

   return (
      <m.div
         className="relative min-h-screen overflow-x-hidden bg-[var(--bg-color)] text-[var(--text-color)]"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.25, ease: 'easeOut' }}
      >
         {portal ? (
            <m.div
               aria-hidden
               className="pointer-events-none fixed inset-0 z-0 mix-blend-screen"
               style={{
                  backgroundImage: `radial-gradient(circle at ${portal.x}px ${portal.y}px, color-mix(in oklch, var(--portal-green) 65%, transparent) 0%, color-mix(in oklch, var(--portal-cyan) 35%, transparent) 22%, transparent 52%)`,
               }}
               initial={{ opacity: 1, scale: 0.45 }}
               animate={{ opacity: 0.25, scale: 1.35 }}
               transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            />
         ) : null}

         <div className="relative z-10">
            <div className="mx-auto max-w-5xl px-4 pb-6 pt-10 md:pt-14">
               <Link
                  to="/episodes"
                  className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/40 px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
               >
                  {t('episodeDetail.back')}
               </Link>
            </div>

            <div className="relative mx-auto max-w-5xl px-4 pb-24">
               {errorKey ? (
                  <p className="py-16 text-center text-sm font-bold text-red-500">
                     {errorKey === 'invalidId'
                        ? t('episodeDetail.errorInvalidId')
                        : errorKey === 'notFound'
                          ? t('episodeDetail.errorNotFound')
                          : t('episodeDetail.errorLoadFailed')}
                  </p>
               ) : canFetch ? (
                  <div className="space-y-10">
                     {loading ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-24">
                           <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                           <p className="text-sm font-bold text-primary">
                              {t('episodeDetail.loading')}
                           </p>
                        </div>
                     ) : episode ? (
                        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-[var(--portal-cyan)]/10 p-6 shadow-lg shadow-primary/10 md:p-8">
                           <span className="inline-block rounded-md border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-sm font-bold tracking-wider text-primary">
                              {episode.episode}
                           </span>
                           <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                              {episode.name}
                           </h1>
                           <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                              <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                                 <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t('episodeDetail.fieldAirDate')}
                                 </dt>
                                 <dd className="mt-1 font-medium text-foreground">
                                    {episode.air_date}
                                 </dd>
                              </div>
                              <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                                 <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t('episodeDetail.fieldCreated')}
                                 </dt>
                                 <dd className="mt-1 font-medium text-foreground">
                                    {formatLocaleDate(episode.created, dateLocale)}
                                 </dd>
                              </div>
                           </dl>
                        </div>
                     ) : null}

                     <EpisodeCuriosityPanel episodeId={id} />

                     {episode ? (
                        <section>
                           <h2 className="mb-4 text-xl font-bold text-foreground">
                              {t('episodeDetail.charactersHeading')}
                           </h2>
                           {charactersQuery.isFetching && characters.length === 0 ? (
                              <p className="text-sm font-semibold text-primary">
                                 {t('episodeDetail.loading')}
                              </p>
                           ) : characters.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                 {t('episodeDetail.charactersEmpty')}
                              </p>
                           ) : (
                              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                 {characters.map((character) => (
                                    <li key={character.id}>
                                       <Link
                                          to={`/character/${character.id}`}
                                          className="glow-card flex items-center gap-3 p-3 outline-none ring-primary focus-visible:ring-2"
                                       >
                                          <img
                                             src={character.image}
                                             alt=""
                                             className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                             loading="lazy"
                                          />
                                          <span className="min-w-0 font-semibold text-foreground line-clamp-2">
                                             {character.name}
                                          </span>
                                       </Link>
                                    </li>
                                 ))}
                              </ul>
                           )}
                        </section>
                     ) : null}
                  </div>
               ) : null}
            </div>
         </div>
      </m.div>
   );
}
