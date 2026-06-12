import type OpenAI from 'openai';

export const RPG_GM_TOOL_NAMES = [
   'roll_dice',
   'lookup_character',
   'lookup_episode',
] as const;

export type RpgGmToolName = (typeof RPG_GM_TOOL_NAMES)[number];

export const RPG_GM_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
   {
      type: 'function',
      function: {
         name: 'roll_dice',
         description: 'Roll RPG dice using standard notation (e.g. 1d20, 2d6+3, 1d20-2).',
         parameters: {
            type: 'object',
            properties: {
               notation: {
                  type: 'string',
                  description: 'Dice notation such as 1d20 or 2d6+3',
               },
            },
            required: ['notation'],
         },
      },
   },
   {
      type: 'function',
      function: {
         name: 'lookup_character',
         description:
            'Look up Rick and Morty characters by name from the official API for canon facts.',
         parameters: {
            type: 'object',
            properties: {
               name: {
                  type: 'string',
                  description: 'Character name or partial name to search',
               },
            },
            required: ['name'],
         },
      },
   },
   {
      type: 'function',
      function: {
         name: 'lookup_episode',
         description: 'Look up a Rick and Morty episode by numeric id from the official API.',
         parameters: {
            type: 'object',
            properties: {
               episodeId: {
                  type: 'integer',
                  description: 'Episode id from the Rick and Morty API',
               },
            },
            required: ['episodeId'],
         },
      },
   },
];
