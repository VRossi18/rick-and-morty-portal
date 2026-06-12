import { Hono } from 'hono';
import { z } from 'zod';
import { generateCharacterCuriosity } from '../services/openaiCharacterCuriosity.js';
import { generateEpisodeCuriosity } from '../services/openaiEpisodeCuriosity.js';
import { generateRpgGmReply } from '../services/openaiRpgGm.js';

const characterCuriosityBodySchema = z.object({
   characterId: z.number().int().positive(),
   locale: z.enum(['pt', 'en', 'es']),
   question: z.string().trim().max(400).optional(),
});

const episodeCuriosityBodySchema = z.object({
   episodeId: z.number().int().positive(),
   locale: z.enum(['pt', 'en', 'es']),
   question: z.string().trim().max(400).optional(),
});

const rpgChatMessageSchema = z.object({
   role: z.enum(['user', 'assistant']),
   content: z.string().trim().min(1).max(2000),
});

const rpgChatBodySchema = z.object({
   locale: z.enum(['pt', 'en', 'es']),
   characterSheet: z
      .object({
         meta: z.object({
            schemaVersion: z.number().int().positive(),
         }),
         character: z.object({
            name: z.string().trim().min(1).max(120),
         }),
      })
      .passthrough(),
   messages: z.array(rpgChatMessageSchema).max(40),
   opening: z.boolean().optional(),
});

export const aiRoutes = new Hono();

function mapLlmError(err: unknown) {
   const code = err instanceof Error ? err.message : '';
   if (code === 'LLM_NOT_CONFIGURED') {
      return { status: 503 as const, body: { error: 'AI service is not configured' } };
   }
   if (code === 'LLM_AUTH_FAILED') {
      return { status: 503 as const, body: { error: 'AI service misconfigured' } };
   }
   if (code === 'LLM_QUOTA_EXCEEDED') {
      return { status: 503 as const, body: { error: 'AI quota exceeded' } };
   }
   if (code === 'LLM_RATE_LIMIT') {
      return { status: 429 as const, body: { error: 'Rate limit exceeded' } };
   }
   if (code === 'INVALID_RPG_CHAT_REQUEST') {
      return { status: 400 as const, body: { error: 'Invalid RPG chat request' } };
   }
   if (code === 'TOOL_LOOP_EXCEEDED') {
      return { status: 502 as const, body: { error: 'Failed to generate RPG reply' } };
   }
   return null;
}

function mapCuriosityError(err: unknown, entity: 'character' | 'episode') {
   const code = err instanceof Error ? err.message : '';
   if (code === 'LLM_NOT_CONFIGURED') {
      return { status: 503 as const, body: { error: 'AI service is not configured' } };
   }
   if (code === 'LLM_AUTH_FAILED') {
      return { status: 503 as const, body: { error: 'AI service misconfigured' } };
   }
   if (code === 'LLM_QUOTA_EXCEEDED') {
      return { status: 503 as const, body: { error: 'AI quota exceeded' } };
   }
   if (code === 'LLM_RATE_LIMIT') {
      return { status: 429 as const, body: { error: 'Rate limit exceeded' } };
   }
   if (entity === 'character' && code === 'CHARACTER_NOT_FOUND') {
      return { status: 404 as const, body: { error: 'Character not found' } };
   }
   if (entity === 'episode' && code === 'EPISODE_NOT_FOUND') {
      return { status: 404 as const, body: { error: 'Episode not found' } };
   }
   if (entity === 'character' && code === 'CHARACTER_FETCH_FAILED') {
      return { status: 502 as const, body: { error: 'Failed to load character data' } };
   }
   if (entity === 'episode' && code === 'EPISODE_FETCH_FAILED') {
      return { status: 502 as const, body: { error: 'Failed to load episode data' } };
   }
   return null;
}

aiRoutes.post('/character-curiosity', async (c) => {
   let body: z.infer<typeof characterCuriosityBodySchema>;
   try {
      const json: unknown = await c.req.json();
      body = characterCuriosityBodySchema.parse(json);
   } catch {
      return c.json({ error: 'Invalid request body' }, 400);
   }

   try {
      const result = await generateCharacterCuriosity({
         characterId: body.characterId,
         locale: body.locale,
         question: body.question,
      });
      return c.json(result);
   } catch (err) {
      const mapped = mapCuriosityError(err, 'character');
      if (mapped) {
         return c.json(mapped.body, mapped.status);
      }
      console.error('[ai] character-curiosity failed', err);
      return c.json({ error: 'Failed to generate curiosity' }, 502);
   }
});

aiRoutes.post('/episode-curiosity', async (c) => {
   let body: z.infer<typeof episodeCuriosityBodySchema>;
   try {
      const json: unknown = await c.req.json();
      body = episodeCuriosityBodySchema.parse(json);
   } catch {
      return c.json({ error: 'Invalid request body' }, 400);
   }

   try {
      const result = await generateEpisodeCuriosity({
         episodeId: body.episodeId,
         locale: body.locale,
         question: body.question,
      });
      return c.json(result);
   } catch (err) {
      const mapped = mapCuriosityError(err, 'episode');
      if (mapped) {
         return c.json(mapped.body, mapped.status);
      }
      console.error('[ai] episode-curiosity failed', err);
      return c.json({ error: 'Failed to generate curiosity' }, 502);
   }
});

aiRoutes.post('/rpg-chat', async (c) => {
   let body: z.infer<typeof rpgChatBodySchema>;
   try {
      const json: unknown = await c.req.json();
      body = rpgChatBodySchema.parse(json);
   } catch {
      return c.json({ error: 'Invalid request body' }, 400);
   }

   if (!body.opening && body.messages.length === 0) {
      return c.json({ error: 'Invalid request body' }, 400);
   }

   try {
      const result = await generateRpgGmReply({
         locale: body.locale,
         characterSheet: body.characterSheet,
         messages: body.messages,
         opening: body.opening,
      });
      return c.json(result);
   } catch (err) {
      const mapped = mapLlmError(err);
      if (mapped) {
         return c.json(mapped.body, mapped.status);
      }
      console.error('[ai] rpg-chat failed', err);
      return c.json({ error: 'Failed to generate RPG reply' }, 502);
   }
});
