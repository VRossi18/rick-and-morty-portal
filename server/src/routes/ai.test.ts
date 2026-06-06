import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiRoutes } from './ai.js';

const mockGenerateCharacter = vi.fn();
const mockGenerateEpisode = vi.fn();
const mockGenerateRpgGm = vi.fn();

vi.mock('../services/openaiCharacterCuriosity.js', () => ({
   generateCharacterCuriosity: (...args: unknown[]) => mockGenerateCharacter(...args),
}));

vi.mock('../services/openaiEpisodeCuriosity.js', () => ({
   generateEpisodeCuriosity: (...args: unknown[]) => mockGenerateEpisode(...args),
}));

vi.mock('../services/openaiRpgGm.js', () => ({
   generateRpgGmReply: (...args: unknown[]) => mockGenerateRpgGm(...args),
}));

function createApp() {
   const app = new Hono();
   app.route('/api/ai', aiRoutes);
   return app;
}

describe('aiRoutes character-curiosity', () => {
   beforeEach(() => {
      mockGenerateCharacter.mockReset();
   });

   it('returns 400 for invalid body', async () => {
      const app = createApp();
      const response = await app.request('/api/ai/character-curiosity', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ characterId: -1, locale: 'pt' }),
      });
      expect(response.status).toBe(400);
   });

   it('returns curiosity text on success', async () => {
      mockGenerateCharacter.mockResolvedValue({ text: 'Fun fact', cached: false });
      const app = createApp();
      const response = await app.request('/api/ai/character-curiosity', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ characterId: 2, locale: 'pt' }),
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ text: 'Fun fact', cached: false });
   });

   it('returns 503 when LLM is not configured', async () => {
      mockGenerateCharacter.mockRejectedValue(new Error('LLM_NOT_CONFIGURED'));
      const app = createApp();
      const response = await app.request('/api/ai/character-curiosity', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ characterId: 2, locale: 'en' }),
      });
      expect(response.status).toBe(503);
   });

   it('returns 429 on rate limit', async () => {
      mockGenerateCharacter.mockRejectedValue(new Error('LLM_RATE_LIMIT'));
      const app = createApp();
      const response = await app.request('/api/ai/character-curiosity', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ characterId: 2, locale: 'en' }),
      });
      expect(response.status).toBe(429);
   });
});

describe('aiRoutes episode-curiosity', () => {
   beforeEach(() => {
      mockGenerateEpisode.mockReset();
   });

   it('returns 400 for invalid body', async () => {
      const app = createApp();
      const response = await app.request('/api/ai/episode-curiosity', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ episodeId: 0, locale: 'pt' }),
      });
      expect(response.status).toBe(400);
   });

   it('returns curiosity text on success', async () => {
      mockGenerateEpisode.mockResolvedValue({ text: 'Episode fact', cached: true });
      const app = createApp();
      const response = await app.request('/api/ai/episode-curiosity', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ episodeId: 1, locale: 'es' }),
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ text: 'Episode fact', cached: true });
   });

   it('returns 404 when episode is not found', async () => {
      mockGenerateEpisode.mockRejectedValue(new Error('EPISODE_NOT_FOUND'));
      const app = createApp();
      const response = await app.request('/api/ai/episode-curiosity', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ episodeId: 999, locale: 'en' }),
      });
      expect(response.status).toBe(404);
   });

   it('returns 503 when LLM is not configured', async () => {
      mockGenerateEpisode.mockRejectedValue(new Error('LLM_NOT_CONFIGURED'));
      const app = createApp();
      const response = await app.request('/api/ai/episode-curiosity', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ episodeId: 1, locale: 'pt' }),
      });
      expect(response.status).toBe(503);
   });
});

const sampleCharacterSheet = {
   meta: { schemaVersion: 3 },
   character: { name: 'Morty' },
};

describe('aiRoutes rpg-chat', () => {
   beforeEach(() => {
      mockGenerateRpgGm.mockReset();
   });

   it('returns 400 for invalid body', async () => {
      const app = createApp();
      const response = await app.request('/api/ai/rpg-chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ locale: 'pt', characterSheet: {}, messages: [] }),
      });
      expect(response.status).toBe(400);
   });

   it('returns GM text on opening success', async () => {
      mockGenerateRpgGm.mockResolvedValue({ text: 'Welcome to the Citadel.' });
      const app = createApp();
      const response = await app.request('/api/ai/rpg-chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            locale: 'en',
            characterSheet: sampleCharacterSheet,
            messages: [],
            opening: true,
         }),
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ text: 'Welcome to the Citadel.' });
   });

   it('returns 503 when LLM is not configured', async () => {
      mockGenerateRpgGm.mockRejectedValue(new Error('LLM_NOT_CONFIGURED'));
      const app = createApp();
      const response = await app.request('/api/ai/rpg-chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            locale: 'pt',
            characterSheet: sampleCharacterSheet,
            messages: [],
            opening: true,
         }),
      });
      expect(response.status).toBe(503);
   });
});
