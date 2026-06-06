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
} from '../prompts/characterCuriosity.js';
import type { ApiCharacter, CuriosityLocale } from '../types/character.js';
import { fetchCharacterById } from './rickAndMortyApi.js';

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

export async function generateCharacterCuriosity(options: {
   characterId: number;
   locale: CuriosityLocale;
   question?: string;
}): Promise<CuriosityResult> {
   const apiKey = resolveLlmApiKey();
   if (!isLlmConfigured()) {
      throw new Error('LLM_NOT_CONFIGURED');
   }

   const cacheKey = buildCacheKey(options.characterId, options.locale, options.question);
   const cachedText = cache.get(cacheKey);
   if (cachedText) {
      return { text: cachedText, cached: true };
   }

   const character = await fetchCharacterById(options.characterId);
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
               content: buildUserPrompt(character, options.locale, options.question),
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

export function __resetCuriosityCacheForTests(): void {
   cache.set('__test_reset__', '');
}

export { fetchCharacterById };
export type { ApiCharacter, CuriosityLocale };
