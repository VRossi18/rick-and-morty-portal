import type { ApiCharacter } from '../types/character.js';
import type { ApiEpisode } from '../types/episode.js';

const API_BASE = 'https://rickandmortyapi.com/api';
const CHARACTER_BATCH_SIZE = 20;

export async function fetchCharacterById(characterId: number): Promise<ApiCharacter> {
   const response = await fetch(`${API_BASE}/character/${characterId}`);
   if (response.status === 404) {
      throw new Error('CHARACTER_NOT_FOUND');
   }
   if (!response.ok) {
      throw new Error('CHARACTER_FETCH_FAILED');
   }
   return (await response.json()) as ApiCharacter;
}

export async function fetchCharactersByName(name: string): Promise<ApiCharacter[]> {
   const params = new URLSearchParams({ name: name.trim() });
   const response = await fetch(`${API_BASE}/character/?${params.toString()}`);
   if (!response.ok) {
      throw new Error('CHARACTER_FETCH_FAILED');
   }

   const data = (await response.json()) as { results?: ApiCharacter[] };
   return data.results ?? [];
}

export async function fetchEpisodeById(episodeId: number): Promise<ApiEpisode> {
   const response = await fetch(`${API_BASE}/episode/${episodeId}`);
   if (response.status === 404) {
      throw new Error('EPISODE_NOT_FOUND');
   }
   if (!response.ok) {
      throw new Error('EPISODE_FETCH_FAILED');
   }
   return (await response.json()) as ApiEpisode;
}

export async function fetchCharacterNamesByIds(ids: number[]): Promise<string[]> {
   if (ids.length === 0) {
      return [];
   }

   const uniqueIds = [...new Set(ids)].slice(0, CHARACTER_BATCH_SIZE);
   const response = await fetch(`${API_BASE}/character/${uniqueIds.join(',')}`);
   if (!response.ok) {
      throw new Error('CHARACTER_FETCH_FAILED');
   }

   const data = (await response.json()) as ApiCharacter | ApiCharacter[];
   const characters = Array.isArray(data) ? data : [data];
   return characters.map((character) => character.name);
}
