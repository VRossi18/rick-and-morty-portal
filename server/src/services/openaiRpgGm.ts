import OpenAI from 'openai';
import {
   getLlmBaseUrl,
   getLlmModel,
   getLlmToolMaxSteps,
   isLlmConfigured,
   isLlmToolsEnabled,
   resolveLlmApiKey,
} from '../config.js';
import { buildRpgGmChatMessages, type RpgChatMessage } from '../prompts/rpgGm.js';
import type { CuriosityLocale } from '../types/character.js';
import { runLlmWithTools } from './runLlmWithTools.js';
import { executeRpgTool } from '../tools/executeRpgTool.js';
import { RPG_GM_TOOLS } from '../tools/rpgGmTools.js';

export interface RpgChatResult {
   text: string;
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

export async function generateRpgGmReply(options: {
   locale: CuriosityLocale;
   characterSheet: unknown;
   messages: RpgChatMessage[];
   opening?: boolean;
}): Promise<RpgChatResult> {
   const apiKey = resolveLlmApiKey();
   if (!isLlmConfigured()) {
      throw new Error('LLM_NOT_CONFIGURED');
   }

   if (!options.opening && options.messages.length === 0) {
      throw new Error('INVALID_RPG_CHAT_REQUEST');
   }

   const client = new OpenAI({ apiKey: apiKey!, baseURL: getLlmBaseUrl() });
   const chatMessages = buildRpgGmChatMessages(options);

   if (isLlmToolsEnabled()) {
      let text: string;
      try {
         text = await runLlmWithTools({
            client,
            model: getLlmModel(),
            messages: chatMessages,
            tools: RPG_GM_TOOLS,
            executeTool: executeRpgTool,
            maxSteps: getLlmToolMaxSteps(),
            temperature: 0.75,
            maxTokens: 400,
         });
      } catch (err) {
         mapLlmApiError(err);
      }
      return { text };
   }

   let completion: OpenAI.Chat.Completions.ChatCompletion;
   try {
      completion = await client.chat.completions.create({
         model: getLlmModel(),
         temperature: 0.75,
         max_tokens: 400,
         messages: chatMessages,
      });
   } catch (err) {
      mapLlmApiError(err);
   }

   const text = completion.choices[0]?.message?.content?.trim();
   if (!text) {
      throw new Error('LLM_EMPTY_RESPONSE');
   }

   return { text };
}

export type { RpgChatMessage };
