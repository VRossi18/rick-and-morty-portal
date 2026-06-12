import { fetchEpisodeById } from '../services/rickAndMortyApi.js';

export interface LookupEpisodeResult {
   id: number;
   name: string;
   episode: string;
   air_date: string;
   characterCount: number;
}

export async function lookupEpisode(episodeId: number): Promise<LookupEpisodeResult> {
   const episode = await fetchEpisodeById(episodeId);
   return {
      id: episode.id,
      name: episode.name,
      episode: episode.episode,
      air_date: episode.air_date,
      characterCount: episode.characters.length,
   };
}
