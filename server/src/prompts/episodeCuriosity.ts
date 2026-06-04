import type { CuriosityLocale } from '../types/character.js';
import type { ApiEpisode } from '../types/episode.js';

const LOCALE_LABELS: Record<CuriosityLocale, string> = {
   pt: 'português do Brasil',
   en: 'English',
   es: 'español',
};

export function buildEpisodeContext(episode: ApiEpisode, characterNames: string[]): string {
   const lines = [
      `Title: ${episode.name}`,
      `Episode code: ${episode.episode}`,
      `Air date: ${episode.air_date}`,
      `Characters in episode (API count): ${episode.characters.length}`,
   ];

   if (characterNames.length > 0) {
      lines.push(`Featured characters (sample): ${characterNames.join(', ')}`);
   }

   return lines.join('\n');
}

export function buildSystemPrompt(locale: CuriosityLocale): string {
   const language = LOCALE_LABELS[locale];
   return [
      'You are a Rick and Morty fan guide for an educational portal.',
      `Always respond in ${language}.`,
      'Base answers on the Rick and Morty TV show and the episode context provided.',
      'If you are unsure, say so briefly instead of inventing canon facts.',
      'Keep answers concise (2-4 sentences), friendly, and spoiler-light.',
      'Do not mention that you are an AI.',
   ].join(' ');
}

export function buildUserPrompt(
   episode: ApiEpisode,
   characterNames: string[],
   locale: CuriosityLocale,
   question?: string,
): string {
   const context = buildEpisodeContext(episode, characterNames);

   if (question?.trim()) {
      return [
         'Episode context:',
         context,
         '',
         `User question about this episode: ${question.trim()}`,
         'Answer the question using the context and your knowledge of the show.',
      ].join('\n');
   }

   const introByLocale: Record<CuriosityLocale, string> = {
      pt: 'Escreva uma curiosidade curta e interessante sobre este episódio de Rick and Morty.',
      en: 'Write a short, interesting fun fact about this Rick and Morty episode.',
      es: 'Escribe una curiosidad breve e interesante sobre este episodio de Rick and Morty.',
   };

   return [introByLocale[locale], '', 'Episode context:', context].join('\n');
}

export function buildCacheKey(
   episodeId: number,
   locale: CuriosityLocale,
   question?: string,
): string {
   const normalizedQuestion = question?.trim().toLowerCase() || '__initial__';
   return `episode:${episodeId}:${locale}:${normalizedQuestion}`;
}
