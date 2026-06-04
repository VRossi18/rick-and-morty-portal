const aiApiUrlRaw = import.meta.env.VITE_AI_API_URL?.trim() ?? '';
const episodeAiApiUrlRaw = import.meta.env.VITE_AI_EPISODE_API_URL?.trim() ?? '';

function looksLikeApiKey(value: string): boolean {
   return /^(sk-(proj-)?|gsk_)[A-Za-z0-9_-]+/.test(value);
}

if (import.meta.env.DEV && aiApiUrlRaw && looksLikeApiKey(aiApiUrlRaw)) {
   console.error(
      '[ai] VITE_AI_API_URL looks like an API key. Use /api/ai/character-curiosity and set LLM_API_KEY in .env for the server.',
   );
}

if (import.meta.env.DEV && episodeAiApiUrlRaw && looksLikeApiKey(episodeAiApiUrlRaw)) {
   console.error(
      '[ai] VITE_AI_EPISODE_API_URL looks like an API key. Use /api/ai/episode-curiosity and set LLM_API_KEY in .env for the server.',
   );
}

export const aiApiUrl = aiApiUrlRaw;

export const isAiCuriosityConfigured =
   aiApiUrlRaw.length > 0 && !looksLikeApiKey(aiApiUrlRaw);

function resolveConfiguredUrl(raw: string): string | null {
   if (!raw || looksLikeApiKey(raw)) {
      return null;
   }

   if (/^https?:\/\//i.test(raw)) {
      return raw;
   }

   if (typeof window !== 'undefined') {
      return new URL(raw, window.location.origin).href;
   }

   return raw;
}

export function resolveAiApiUrl(): string | null {
   return resolveConfiguredUrl(aiApiUrlRaw);
}

function deriveEpisodeUrlFromCharacterUrl(characterUrl: string): string | null {
   if (!characterUrl.includes('character-curiosity')) {
      return null;
   }
   return characterUrl.replace('character-curiosity', 'episode-curiosity');
}

export function resolveEpisodeCuriosityUrl(): string | null {
   const explicit = resolveConfiguredUrl(episodeAiApiUrlRaw);
   if (explicit) {
      return explicit;
   }

   const derived = deriveEpisodeUrlFromCharacterUrl(aiApiUrlRaw);
   if (derived) {
      return resolveConfiguredUrl(derived);
   }

   return null;
}

export const isEpisodeAiCuriosityConfigured = Boolean(resolveEpisodeCuriosityUrl());

export type CuriosityLocale = 'pt' | 'en' | 'es';

export function normalizeCuriosityLocale(language: string): CuriosityLocale {
   const base = language.split('-')[0];
   if (base === 'en' || base === 'es' || base === 'pt') {
      return base;
   }
   return 'pt';
}
