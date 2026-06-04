import { describe, expect, it } from 'vitest';
import {
   buildCacheKey,
   buildEpisodeContext,
   buildSystemPrompt,
   buildUserPrompt,
} from './episodeCuriosity.js';
import type { ApiEpisode } from '../types/episode.js';

const mockEpisode: ApiEpisode = {
   id: 1,
   name: 'Pilot',
   air_date: 'December 2, 2013',
   episode: 'S01E01',
   characters: [
      'https://rickandmortyapi.com/api/character/1',
      'https://rickandmortyapi.com/api/character/2',
   ],
   url: 'https://rickandmortyapi.com/api/episode/1',
   created: '2017-11-10T12:56:33.798Z',
};

describe('episodeCuriosity prompts', () => {
   it('builds episode context with character names', () => {
      const context = buildEpisodeContext(mockEpisode, ['Rick Sanchez', 'Morty Smith']);
      expect(context).toContain('Pilot');
      expect(context).toContain('S01E01');
      expect(context).toContain('Rick Sanchez');
   });

   it('builds locale-specific system prompt', () => {
      expect(buildSystemPrompt('pt')).toContain('português do Brasil');
      expect(buildSystemPrompt('en')).toContain('episode context');
   });

   it('builds initial curiosity prompt without question', () => {
      const prompt = buildUserPrompt(mockEpisode, [], 'pt');
      expect(prompt).toContain('Pilot');
      expect(prompt).toContain('curiosidade');
      expect(prompt).not.toContain('User question');
   });

   it('builds follow-up prompt with question', () => {
      const prompt = buildUserPrompt(mockEpisode, ['Rick Sanchez'], 'en', 'Who appears first?');
      expect(prompt).toContain('User question about this episode');
      expect(prompt).toContain('Who appears first?');
   });

   it('builds stable cache keys', () => {
      expect(buildCacheKey(1, 'pt')).toBe('episode:1:pt:__initial__');
      expect(buildCacheKey(1, 'pt', '  Hello  ')).toBe('episode:1:pt:hello');
   });
});
