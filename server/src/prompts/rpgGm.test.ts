import { describe, expect, it } from 'vitest';
import { buildRpgGmChatMessages, buildRpgGmSystemPrompt } from './rpgGm.js';

const sampleSheet = {
   meta: { schemaVersion: 3 },
   character: { name: 'Morty' },
};

describe('rpgGm prompts', () => {
   it('builds locale-specific system prompt', () => {
      expect(buildRpgGmSystemPrompt('pt', sampleSheet)).toContain('português do Brasil');
      expect(buildRpgGmSystemPrompt('en', sampleSheet)).toContain('English');
      expect(buildRpgGmSystemPrompt('pt', sampleSheet)).toContain('Morty');
   });

   it('builds opening messages with system and scene prompt', () => {
      const messages = buildRpgGmChatMessages({
         locale: 'pt',
         characterSheet: sampleSheet,
         messages: [],
         opening: true,
      });

      expect(messages).toHaveLength(2);
      expect(messages[0]?.role).toBe('system');
      expect(messages[1]?.role).toBe('user');
      expect(String(messages[1]?.content)).toContain('Begin the adventure');
   });

   it('passes chat history when not opening', () => {
      const messages = buildRpgGmChatMessages({
         locale: 'en',
         characterSheet: sampleSheet,
         messages: [
            { role: 'assistant', content: 'Welcome, Morty.' },
            { role: 'user', content: 'I look around.' },
         ],
      });

      expect(messages).toHaveLength(3);
      expect(messages[0]?.role).toBe('system');
      expect(messages[1]).toEqual({ role: 'assistant', content: 'Welcome, Morty.' });
      expect(messages[2]).toEqual({ role: 'user', content: 'I look around.' });
   });
});
