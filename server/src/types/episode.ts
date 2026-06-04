export interface ApiEpisode {
   id: number;
   name: string;
   air_date: string;
   episode: string;
   characters: string[];
   url: string;
   created: string;
}

export type { CuriosityLocale } from './character.js';
