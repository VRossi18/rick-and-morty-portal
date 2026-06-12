import { describe, expect, it, vi } from 'vitest';
import type OpenAI from 'openai';
import { runLlmWithTools } from './runLlmWithTools.js';

function createMockClient(
   responses: OpenAI.Chat.Completions.ChatCompletion[],
): OpenAI {
   const create = vi.fn();
   responses.forEach((response) => {
      create.mockResolvedValueOnce(response);
   });

   return {
      chat: {
         completions: { create },
      },
   } as unknown as OpenAI;
}

describe('runLlmWithTools', () => {
   it('returns text when model responds without tool calls', async () => {
      const client = createMockClient([
         {
            choices: [{ message: { role: 'assistant', content: '  Hello GM  ' } }],
         } as OpenAI.Chat.Completions.ChatCompletion,
      ]);

      const text = await runLlmWithTools({
         client,
         model: 'test-model',
         messages: [{ role: 'user', content: 'Hi' }],
         tools: [],
         executeTool: vi.fn(),
      });

      expect(text).toBe('Hello GM');
   });

   it('runs tool calls then returns final text', async () => {
      const executeTool = vi.fn().mockResolvedValue({ total: 17 });
      const client = createMockClient([
         {
            choices: [
               {
                  message: {
                     role: 'assistant',
                     content: null,
                     tool_calls: [
                        {
                           id: 'call_1',
                           type: 'function',
                           function: { name: 'roll_dice', arguments: '{"notation":"1d20"}' },
                        },
                     ],
                  },
               },
            ],
         } as OpenAI.Chat.Completions.ChatCompletion,
         {
            choices: [{ message: { role: 'assistant', content: 'You rolled 17.' } }],
         } as OpenAI.Chat.Completions.ChatCompletion,
      ]);

      const text = await runLlmWithTools({
         client,
         model: 'test-model',
         messages: [{ role: 'user', content: 'Roll' }],
         tools: [],
         executeTool,
      });

      expect(executeTool).toHaveBeenCalledWith('roll_dice', '{"notation":"1d20"}');
      expect(text).toBe('You rolled 17.');
   });

   it('throws TOOL_LOOP_EXCEEDED when max steps exceeded', async () => {
      const executeTool = vi.fn().mockResolvedValue({ total: 1 });
      const client = createMockClient([
         {
            choices: [
               {
                  message: {
                     role: 'assistant',
                     content: null,
                     tool_calls: [
                        {
                           id: 'call_1',
                           type: 'function',
                           function: { name: 'roll_dice', arguments: '{"notation":"1d20"}' },
                        },
                     ],
                  },
               },
            ],
         } as OpenAI.Chat.Completions.ChatCompletion,
      ]);

      await expect(
         runLlmWithTools({
            client,
            model: 'test-model',
            messages: [{ role: 'user', content: 'Roll forever' }],
            tools: [],
            executeTool,
            maxSteps: 1,
         }),
      ).rejects.toThrow('TOOL_LOOP_EXCEEDED');
   });
});
