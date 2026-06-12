import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateRpgGmReply } from './openaiRpgGm.js';

const mockRunLlmWithTools = vi.fn();
const mockCreate = vi.fn();

vi.mock('./runLlmWithTools.js', () => ({
   runLlmWithTools: (...args: unknown[]) => mockRunLlmWithTools(...args),
}));

vi.mock('openai', () => {
   return {
      default: class MockOpenAI {
         chat = {
            completions: {
               create: (...args: unknown[]) => mockCreate(...args),
            },
         };
      },
   };
});

describe('generateRpgGmReply', () => {
   beforeEach(() => {
      mockRunLlmWithTools.mockReset();
      mockCreate.mockReset();
      vi.stubEnv('LLM_API_KEY', 'test-key');
      vi.stubEnv('LLM_BASE_URL', 'https://api.groq.com/openai/v1');
   });

   afterEach(() => {
      vi.unstubAllEnvs();
   });

   const baseOptions = {
      locale: 'en' as const,
      characterSheet: { meta: { schemaVersion: 3 }, character: { name: 'Morty' } },
      messages: [] as { role: 'user' | 'assistant'; content: string }[],
      opening: true,
   };

   it('uses runLlmWithTools when LLM_TOOLS_ENABLED', async () => {
      vi.stubEnv('LLM_TOOLS_ENABLED', 'true');
      mockRunLlmWithTools.mockResolvedValue('Welcome, Morty.');

      const result = await generateRpgGmReply(baseOptions);

      expect(result).toEqual({ text: 'Welcome, Morty.' });
      expect(mockRunLlmWithTools).toHaveBeenCalledOnce();
      expect(mockCreate).not.toHaveBeenCalled();
   });

   it('uses single completion when tools disabled', async () => {
      vi.stubEnv('LLM_TOOLS_ENABLED', 'false');
      mockCreate.mockResolvedValue({
         choices: [{ message: { content: 'Classic reply.' } }],
      });

      const result = await generateRpgGmReply(baseOptions);

      expect(result).toEqual({ text: 'Classic reply.' });
      expect(mockRunLlmWithTools).not.toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledOnce();
   });
});
