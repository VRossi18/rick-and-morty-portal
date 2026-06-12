import { z } from 'zod';
import { lookupCharacter } from './lookupCharacter.js';
import { lookupEpisode } from './lookupEpisode.js';
import { rollDice } from './rollDice.js';
import { RPG_GM_TOOL_NAMES, type RpgGmToolName } from './rpgGmTools.js';

const rollDiceArgsSchema = z.object({
   notation: z.string().trim().min(1),
});

const lookupCharacterArgsSchema = z.object({
   name: z.string().trim().min(1),
});

const lookupEpisodeArgsSchema = z.object({
   episodeId: z.number().int().positive(),
});

function isAllowedToolName(name: string): name is RpgGmToolName {
   return (RPG_GM_TOOL_NAMES as readonly string[]).includes(name);
}

function formatToolError(message: string): { error: string } {
   return { error: message };
}

export async function executeRpgTool(name: string, argsJson: string): Promise<unknown> {
   if (!isAllowedToolName(name)) {
      return formatToolError(`Unknown tool: ${name}`);
   }

   let parsedArgs: unknown;
   try {
      parsedArgs = JSON.parse(argsJson);
   } catch {
      return formatToolError('Invalid tool arguments JSON');
   }

   try {
      switch (name) {
         case 'roll_dice': {
            const args = rollDiceArgsSchema.safeParse(parsedArgs);
            if (!args.success) {
               return formatToolError('Invalid roll_dice arguments');
            }
            return rollDice(args.data.notation);
         }
         case 'lookup_character': {
            const args = lookupCharacterArgsSchema.safeParse(parsedArgs);
            if (!args.success) {
               return formatToolError('Invalid lookup_character arguments');
            }
            return await lookupCharacter(args.data.name);
         }
         case 'lookup_episode': {
            const args = lookupEpisodeArgsSchema.safeParse(parsedArgs);
            if (!args.success) {
               return formatToolError('Invalid lookup_episode arguments');
            }
            return await lookupEpisode(args.data.episodeId);
         }
         default:
            return formatToolError(`Unknown tool: ${name}`);
      }
   } catch (err) {
      const message = err instanceof Error ? err.message : 'Tool execution failed';
      return formatToolError(message);
   }
}
