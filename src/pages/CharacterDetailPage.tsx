import { isAxiosError } from 'axios';
import { m } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { EpisodeDetailLink } from '../components/shared/EpisodeDetailLink';
import { CharacterCuriosityPanel } from '../components/characters/CharacterCuriosityPanel';
import { CharacterService } from '../services/characters';
import type { Character, Episode, ResourceBase } from '../types/api';
import type { CharacterLocationState } from '../types/navigation';
import { formatLocaleDate } from '../utils/formatLocaleDate';
import { fetchEpisodesByIds } from '../utils/locationEpisodes';
import { episodeUrlToId, locationUrlToId } from '../utils/locationUrls';

function LocationFieldLink({ place }: { place: ResourceBase }) {
   const locationId = locationUrlToId(place.url);
   if (locationId === null) {
      return <>{place.name}</>;
   }
   return (
      <Link
         to={`/location/${locationId}`}
         className="text-primary underline-offset-2 transition hover:underline"
      >
         {place.name}
      </Link>
   );
}

type DetailErrorKey = 'invalidId' | 'notFound' | 'loadFailed';
type FetchErrorKey = Exclude<DetailErrorKey, 'invalidId'>;

export function CharacterDetailPage() {
   const { t, i18n } = useTranslation('common');
   const { id: idParam } = useParams();
   const location = useLocation();
   const portal = (location.state as CharacterLocationState | null)?.portal;

   const id = useMemo(() => {
      const n = Number(idParam);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : NaN;
   }, [idParam]);

   const invalidId = Number.isNaN(id);

   const [character, setCharacter] = useState<Character | null>(null);
   const [episodes, setEpisodes] = useState<Episode[]>([]);
   const [loading, setLoading] = useState(() => !invalidId);
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
         setEpisodes([]);
         try {
            const data = await CharacterService.getCharacterById(id);
            if (!isMounted) return;
            setCharacter(data);
            setLoading(false);

            const episodeIds = data.episode
               .map(episodeUrlToId)
               .filter((episodeId): episodeId is number => episodeId !== null);

            if (episodeIds.length === 0) {
               setEpisodes([]);
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
            setCharacter(null);
            setEpisodes([]);
            setLoading(false);
         }
      };

      void load();

      return () => {
         isMounted = false;
      };
   }, [id, invalidId]);

   const statusColor =
      character?.status === 'Alive'
         ? 'var(--portal-green)'
         : character?.status === 'Dead'
           ? 'var(--destructive)'
           : 'var(--muted-foreground)';

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
                  to="/characters"
                  className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/40 px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
               >
                  {t('characterDetail.back')}
               </Link>
            </div>

            <div className="relative mx-auto max-w-5xl px-4 pb-24">
               {loading ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-24">
                     <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                     <p className="text-sm font-bold text-primary">{t('characterDetail.loading')}</p>
                  </div>
               ) : errorKey ? (
                  <p className="py-16 text-center text-sm font-bold text-red-500">
                     {errorKey === 'invalidId'
                        ? t('characterDetail.errorInvalidId')
                        : errorKey === 'notFound'
                          ? t('characterDetail.errorNotFound')
                          : t('characterDetail.errorLoadFailed')}
                  </p>
               ) : character ? (
                  <div className="flex flex-col gap-10 md:flex-row md:items-start">
                     <div className="mx-auto w-full max-w-sm shrink-0 space-y-4 md:mx-0">
                     <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-lg shadow-primary/10">
                        <img
                           src={character.image}
                           alt={character.name}
                           className="aspect-square w-full object-cover"
                        />
                     </div>
                     <CharacterCuriosityPanel
                        key={`${character.id}-${i18n.language}`}
                        characterId={character.id}
                     />
                  </div>

                     <div className="min-w-0 flex-1 space-y-6">
                        <div>
                           <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                              {character.name}
                           </h1>
                           <div className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground">
                              <span
                                 className="status-dot"
                                 style={{ color: statusColor, backgroundColor: statusColor }}
                              />
                              <span className="text-sm font-medium">
                                 {character.status} — {character.species}
                              </span>
                           </div>
                        </div>

                        <dl className="grid gap-4 text-sm sm:grid-cols-2">
                           <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('characterDetail.fieldType')}
                              </dt>
                              <dd className="mt-1 font-medium text-foreground">
                                 {character.type || '—'}
                              </dd>
                           </div>
                           <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('characterDetail.fieldGender')}
                              </dt>
                              <dd className="mt-1 font-medium text-foreground">
                                 {character.gender}
                              </dd>
                           </div>
                           <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:col-span-2">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('characterDetail.fieldOrigin')}
                              </dt>
                              <dd className="mt-1 font-medium text-foreground">
                                 <LocationFieldLink place={character.origin} />
                              </dd>
                           </div>
                           <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:col-span-2">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('characterDetail.fieldLocation')}
                              </dt>
                              <dd className="mt-1 font-medium text-foreground">
                                 <LocationFieldLink place={character.location} />
                              </dd>
                           </div>
                           <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:col-span-2">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('characterDetail.fieldCreated')}
                              </dt>
                              <dd className="mt-1 font-medium text-foreground">
                                 {formatLocaleDate(character.created, dateLocale)}
                              </dd>
                           </div>
                        </dl>

                        <section>
                           <h2 className="mb-4 text-xl font-bold text-foreground">
                              {t('characterDetail.episodesHeading')}
                              {episodes.length > 0 ? (
                                 <span className="ml-2 text-sm font-semibold text-muted-foreground">
                                    {t('characterDetail.episodeCount', { count: episodes.length })}
                                 </span>
                              ) : null}
                           </h2>
                           {episodesLoading ? (
                              <p className="text-sm font-semibold text-primary">
                                 {t('characterDetail.episodesLoading')}
                              </p>
                           ) : episodes.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                 {t('characterDetail.episodesEmpty')}
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
                  </div>
               ) : null}
            </div>
         </div>
      </m.div>
   );
}
