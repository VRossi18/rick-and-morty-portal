import OpenAI from 'openai';
import {
   CACHE_TTL_MS,
   getLlmBaseUrl,
   getLlmModel,
   isLlmConfigured,
   resolveLlmApiKey,
} from '../config.js';
import { MemoryCache } from '../cache/memoryCache.js';
import {
   buildCacheKey,
   buildSystemPrompt,
   buildUserPrompt,
} from '../prompts/episodeCuriosity.js';
import type { CuriosityLocale } from '../types/character.js';
import {
   fetchCharacterNamesByIds,
   fetchEpisodeById,
} from './rickAndMortyApi.js';
import { characterUrlToId, MAX_CHARACTER_NAMES_IN_PROMPT } from '../utils/characterUrl.js';

const cache = new MemoryCache<string>(CACHE_TTL_MS);

export interface CuriosityResult {
   text: string;
   cached: boolean;
}

function mapLlmApiError(err: unknown): never {
   if (err instanceof OpenAI.APIError) {
      if (err.status === 429) {
         throw new Error('LLM_RATE_LIMIT');
      }
      if (err.status === 401) {
         throw new Error('LLM_AUTH_FAILED');
      }
      const message = err.message?.toLowerCase() ?? '';
      if (
         err.status === 403 ||
         message.includes('quota') ||
         message.includes('insufficient')
      ) {
         throw new Error('LLM_QUOTA_EXCEEDED');
      }
      throw new Error('LLM_REQUEST_FAILED');
   }
   throw err;
}

async function loadEpisodeCharacterNames(episode: Awaited<ReturnType<typeof fetchEpisodeById>>) {
   const ids = episode.characters
      .map(characterUrlToId)
      .filter((id): id is number => id !== null)
      .slice(0, MAX_CHARACTER_NAMES_IN_PROMPT);

   try {
      return await fetchCharacterNamesByIds(ids);
   } catch {
      return [];
   }
}

export async function generateEpisodeCuriosity(options: {
   episodeId: number;
   locale: CuriosityLocale;
   question?: string;
}): Promise<CuriosityResult> {
   const apiKey = resolveLlmApiKey();
   if (!isLlmConfigured()) {
      throw new Error('LLM_NOT_CONFIGURED');
   }

   const cacheKey = buildCacheKey(options.episodeId, options.locale, options.question);
   const cachedText = cache.get(cacheKey);
   if (cachedText) {
      return { text: cachedText, cached: true };
   }

   const episode = await fetchEpisodeById(options.episodeId);
   const characterNames = await loadEpisodeCharacterNames(episode);
   const client = new OpenAI({ apiKey: apiKey!, baseURL: getLlmBaseUrl() });

   let completion: OpenAI.Chat.Completions.ChatCompletion;
   try {
      completion = await client.chat.completions.create({
         model: getLlmModel(),
         temperature: 0.7,
         max_tokens: 220,
         messages: [
            { role: 'system', content: buildSystemPrompt(options.locale) },
            {
               role: 'user',
               content: buildUserPrompt(
                  episode,
                  characterNames,
                  options.locale,
                  options.question,
               ),
            },
         ],
      });
   } catch (err) {
      mapLlmApiError(err);
   }

   const text = completion.choices[0]?.message?.content?.trim();
   if (!text) {
      throw new Error('LLM_EMPTY_RESPONSE');
   }

   cache.set(cacheKey, text);
   return { text, cached: false };
}

export function __resetEpisodeCuriosityCacheForTests(): void {
   cache.set('__test_reset__', '');
}
