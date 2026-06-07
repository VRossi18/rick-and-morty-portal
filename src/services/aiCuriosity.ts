import {
   resolveAiApiUrl,
   resolveEpisodeCuriosityUrl,
   type CuriosityLocale,
} from '../config/ai';

export type CuriosityErrorCode = 'AI_NOT_CONFIGURED' | 'FETCH_FAILED';

interface CharacterCuriosityRequest {
   characterId: number;
   locale: CuriosityLocale;
   question?: string;
}

interface EpisodeCuriosityRequest {
   episodeId: number;
   locale: CuriosityLocale;
   question?: string;
}

export function toCuriosityErrorMessage(err: unknown): CuriosityErrorCode {
   const code = err instanceof Error ? err.message : '';
   return code === 'AI_NOT_CONFIGURED' ? 'AI_NOT_CONFIGURED' : 'FETCH_FAILED';
}

async function postCuriosity(
   apiUrl: string | null,
   body: Record<string, unknown>,
): Promise<string> {
   if (!apiUrl) {
      throw new Error('AI_NOT_CONFIGURED');
   }

   const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
   });

   if (!response.ok) {
      throw new Error('FETCH_FAILED');
   }

   const data = (await response.json()) as { text?: string };
   if (!data.text) {
      throw new Error('FETCH_FAILED');
   }

   return data.text;
}

export function requestCharacterCuriosity({
   characterId,
   locale,
   question,
}: CharacterCuriosityRequest): Promise<string> {
   return postCuriosity(resolveAiApiUrl(), {
      characterId,
      locale,
      ...(question ? { question } : {}),
   });
}

export function requestEpisodeCuriosity({
   episodeId,
   locale,
   question,
}: EpisodeCuriosityRequest): Promise<string> {
   return postCuriosity(resolveEpisodeCuriosityUrl(), {
      episodeId,
      locale,
      ...(question ? { question } : {}),
   });
}
