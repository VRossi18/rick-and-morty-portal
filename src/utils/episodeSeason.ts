import type { Episode } from '../types/api';

export const EPISODE_SEASONS = [1, 2, 3, 4, 5] as const;

export type EpisodeSeason = (typeof EPISODE_SEASONS)[number];

export const MIN_EPISODE_SEASON = EPISODE_SEASONS[0];
export const MAX_EPISODE_SEASON = EPISODE_SEASONS[EPISODE_SEASONS.length - 1];

export function canGoToPreviousSeason(season: number): boolean {
   return season > MIN_EPISODE_SEASON;
}

export function canGoToNextSeason(season: number): boolean {
   return season < MAX_EPISODE_SEASON;
}

export function stepSeason(season: number, delta: -1 | 1): number {
   const next = season + delta;
   return Math.min(MAX_EPISODE_SEASON, Math.max(MIN_EPISODE_SEASON, next));
}

export function parseSeasonFromCode(code: string): number | null {
   const match = code.trim().match(/^S(\d{2})/i);
   if (!match) {
      return null;
   }
   const season = Number(match[1]);
   return Number.isFinite(season) && season > 0 ? season : null;
}

export function seasonToApiFilter(season: number): string {
   return `S${String(season).padStart(2, '0')}`;
}

export function filterEpisodesBySeason(episodes: Episode[], season: number): Episode[] {
   return episodes.filter((ep) => parseSeasonFromCode(ep.episode) === season);
}

export function compareEpisodeCodes(a: string, b: string): number {
   const seasonA = parseSeasonFromCode(a);
   const seasonB = parseSeasonFromCode(b);
   if (seasonA !== seasonB) {
      return (seasonA ?? 0) - (seasonB ?? 0);
   }
   const epA = a.match(/E(\d+)/i)?.[1];
   const epB = b.match(/E(\d+)/i)?.[1];
   const numA = epA ? Number(epA) : 0;
   const numB = epB ? Number(epB) : 0;
   return numA - numB;
}

export function sortEpisodesByCode(episodes: Episode[]): Episode[] {
   return episodes.toSorted((a, b) => compareEpisodeCodes(a.episode, b.episode));
}
