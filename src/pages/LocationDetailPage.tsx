import { isAxiosError } from 'axios';
import { m } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { EpisodeDetailLink } from '../components/shared/EpisodeDetailLink';
import { CharacterService } from '../services/characters';
import { LocationService } from '../services/locations';
import type { Character, Episode, Location } from '../types/api';
import type { LocationLocationState } from '../types/navigation';
import { characterUrlToId } from '../utils/episodeCharacters';
import { formatLocaleDate } from '../utils/formatLocaleDate';
import {
   fetchEpisodesByIds,
   uniqueEpisodeIdsFromCharacters,
} from '../utils/locationEpisodes';

type DetailErrorKey = 'invalidId' | 'notFound' | 'loadFailed';
type FetchErrorKey = Exclude<DetailErrorKey, 'invalidId'>;

export function LocationDetailPage() {
   const { t, i18n } = useTranslation('common');
   const { id: idParam } = useParams();
   const locationState = useLocation();
   const portal = (locationState.state as LocationLocationState | null)?.portal;

   const id = useMemo(() => {
      const n = Number(idParam);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : NaN;
   }, [idParam]);

   const invalidId = Number.isNaN(id);

   const [location, setLocation] = useState<Location | null>(null);
   const [residents, setResidents] = useState<Character[]>([]);
   const [episodes, setEpisodes] = useState<Episode[]>([]);
   const [loading, setLoading] = useState(() => !invalidId);
   const [residentsLoading, setResidentsLoading] = useState(false);
   const [episodesLoading, setEpisodesLoading] = useState(false);
   const [fetchErrorKey, setFetchErrorKey] = useState<FetchErrorKey | null>(null);

   const errorKey: DetailErrorKey | null = invalidId ? 'invalidId' : fetchErrorKey;

   const dateLocale = i18n.language.startsWith('en') ? 'en-US' : 'pt-BR';

   useEffect(() => {
      if (invalidId) {
         return;
      }

      let isMounted = true;

      const load = async () => {
         setLoading(true);
         setFetchErrorKey(null);
         setResidents([]);
         setEpisodes([]);

         try {
            const data = await LocationService.getLocationById(id);
            if (!isMounted) return;
            setLocation(data);
            setLoading(false);

            const residentIds = data.residents
               .map(characterUrlToId)
               .filter((charId): charId is number => charId !== null);

            if (residentIds.length === 0) {
               return;
            }

            setResidentsLoading(true);
            let chars: Character[] = [];
            try {
               chars = await CharacterService.getMultipleCharacters(residentIds);
               if (!isMounted) return;
               setResidents(chars);
            } finally {
               if (isMounted) setResidentsLoading(false);
            }

            const episodeIds = uniqueEpisodeIdsFromCharacters(chars);
            if (episodeIds.length === 0) {
               return;
            }

            setEpisodesLoading(true);
            try {
               const related = await fetchEpisodesByIds(episodeIds);
               if (!isMounted) return;
               setEpisodes(related);
            } finally {
               if (isMounted) setEpisodesLoading(false);
            }
         } catch (err) {
            if (!isMounted) return;
            if (isAxiosError(err) && err.response?.status === 404) {
               setFetchErrorKey('notFound');
            } else {
               setFetchErrorKey('loadFailed');
            }
            setLocation(null);
            setResidents([]);
            setEpisodes([]);
            setLoading(false);
         }
      };

      void load();

      return () => {
         isMounted = false;
      };
   }, [id, invalidId]);

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
                  to="/locations"
                  className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/40 px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
               >
                  {t('locationDetail.back')}
               </Link>
            </div>

            <div className="relative mx-auto max-w-5xl px-4 pb-24">
               {loading ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-24">
                     <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                     <p className="text-sm font-bold text-primary">{t('locationDetail.loading')}</p>
                  </div>
               ) : errorKey ? (
                  <p className="py-16 text-center text-sm font-bold text-red-500">
                     {errorKey === 'invalidId'
                        ? t('locationDetail.errorInvalidId')
                        : errorKey === 'notFound'
                          ? t('locationDetail.errorNotFound')
                          : t('locationDetail.errorLoadFailed')}
                  </p>
               ) : location ? (
                  <div className="space-y-10">
                     <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-[var(--portal-cyan)]/10 p-6 shadow-lg shadow-primary/10 md:p-8">
                        <span className="inline-block rounded-md border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                           {location.type || t('locationDetail.typeUnknown')}
                        </span>
                        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                           {location.name}
                        </h1>
                        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                           <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('locationDetail.fieldDimension')}
                              </dt>
                              <dd className="mt-1 font-medium text-foreground">
                                 {location.dimension}
                              </dd>
                           </div>
                           <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('locationDetail.fieldResidents')}
                              </dt>
                              <dd className="mt-1 font-medium text-foreground">
                                 {location.residents.length}
                              </dd>
                           </div>
                           <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:col-span-2">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('locationDetail.fieldCreated')}
                              </dt>
                              <dd className="mt-1 font-medium text-foreground">
                                 {formatLocaleDate(location.created, dateLocale)}
                              </dd>
                           </div>
                        </dl>
                     </div>

                     <section>
                        <h2 className="mb-4 text-xl font-bold text-foreground">
                           {t('locationDetail.residentsHeading')}
                        </h2>
                        {residentsLoading ? (
                           <p className="text-sm font-semibold text-primary">
                              {t('locationDetail.residentsLoading')}
                           </p>
                        ) : residents.length === 0 ? (
                           <p className="text-sm text-muted-foreground">
                              {t('locationDetail.residentsEmpty')}
                           </p>
                        ) : (
                           <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {residents.map((character) => (
                                 <li key={character.id}>
                                    <Link
                                       to={`/character/${character.id}`}
                                       className="glow-card flex items-center gap-3 p-3 outline-none ring-primary focus-visible:ring-2"
                                    >
                                       <img
                                          src={character.image}
                                          alt=""
                                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
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

                     <section>
                        <h2 className="mb-2 text-xl font-bold text-foreground">
                           {t('locationDetail.episodesHeading')}
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                           {t('locationDetail.episodesNote')}
                        </p>
                        {episodesLoading ? (
                           <p className="text-sm font-semibold text-primary">
                              {t('locationDetail.episodesLoading')}
                           </p>
                        ) : episodes.length === 0 ? (
                           <p className="text-sm text-muted-foreground">
                              {t('locationDetail.episodesEmpty')}
                           </p>
                        ) : (
                           <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {episodes.map((episode) => (
                                 <EpisodeDetailLink key={episode.id} episode={episode} />
                              ))}
                           </ul>
                        )}
                     </section>
                  </div>
               ) : null}
            </div>
         </div>
      </m.div>
   );
}
