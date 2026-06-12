import type OpenAI from 'openai';
import type { CuriosityLocale } from '../types/character.js';

const LOCALE_LABELS: Record<CuriosityLocale, string> = {
   pt: 'português do Brasil',
   en: 'English',
   es: 'español',
};

export interface RpgChatMessage {
   role: 'user' | 'assistant';
   content: string;
}

const TOOL_INSTRUCTIONS = [
   'Use roll_dice for any die roll; never invent random numbers.',
   'Use lookup_character and lookup_episode for canon facts from the Rick and Morty API when relevant.',
   'After tool results, narrate outcomes in character as the GM.',
];

export function buildRpgGmSystemPrompt(locale: CuriosityLocale, characterSheet: unknown): string {
   const language = LOCALE_LABELS[locale];
   return [
      'You are the Game Master (GM) for a Rick and Morty inspired tabletop RPG session.',
      `Always respond in ${language}.`,
      'Use the character sheet JSON for stats, skills, race, and derived values — stay consistent with those numbers.',
      'Keep replies short (2-5 sentences) suitable for a chat UI unless the player asks for detail.',
      'Lean into Rick and Morty tone: sci-fi chaos, dark humor, multiverse weirdness — but keep it playable and fair.',
      'Never break character as the GM. Do not mention being an AI.',
      'When the player acts, describe outcomes and ask what they do next when appropriate.',
      ...TOOL_INSTRUCTIONS,
      '',
      'Character sheet (JSON):',
      JSON.stringify(characterSheet),
   ].join('\n');
}

export function buildRpgGmChatMessages(options: {
   locale: CuriosityLocale;
   characterSheet: unknown;
   messages: RpgChatMessage[];
   opening?: boolean;
}): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
   const system = buildRpgGmSystemPrompt(options.locale, options.characterSheet);

   if (options.opening) {
      return [
         { role: 'system', content: system },
         {
            role: 'user',
            content:
               'Begin the adventure: set an opening scene, introduce the character by name, mention one hook tied to their race/skills, and invite the player to respond.',
         },
      ];
   }

   return [
      { role: 'system', content: system },
      ...options.messages.map((msg) => ({
         role: msg.role,
         content: msg.content,
      })),
   ];
}
