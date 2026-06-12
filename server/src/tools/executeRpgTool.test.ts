import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeRpgTool } from './executeRpgTool.js';

const mockLookupCharacter = vi.fn();
const mockLookupEpisode = vi.fn();
const mockRollDice = vi.fn();

vi.mock('./lookupCharacter.js', () => ({
   lookupCharacter: (...args: unknown[]) => mockLookupCharacter(...args),
}));

vi.mock('./lookupEpisode.js', () => ({
   lookupEpisode: (...args: unknown[]) => mockLookupEpisode(...args),
}));

vi.mock('./rollDice.js', () => ({
   rollDice: (...args: unknown[]) => mockRollDice(...args),
}));

describe('executeRpgTool', () => {
   beforeEach(() => {
      mockLookupCharacter.mockReset();
      mockLookupEpisode.mockReset();
      mockRollDice.mockReset();
   });

   it('rejects unknown tools', async () => {
      await expect(executeRpgTool('apply_damage', '{}')).resolves.toEqual({
         error: 'Unknown tool: apply_damage',
      });
   });

   it('rejects invalid JSON', async () => {
      await expect(executeRpgTool('roll_dice', '{bad')).resolves.toEqual({
         error: 'Invalid tool arguments JSON',
      });
   });

   it('executes roll_dice', async () => {
      mockRollDice.mockReturnValue({ notation: '1d20', rolls: [15], modifier: 0, total: 15 });
      await expect(executeRpgTool('roll_dice', '{"notation":"1d20"}')).resolves.toEqual({
         notation: '1d20',
         rolls: [15],
         modifier: 0,
         total: 15,
      });
   });

   it('returns error for invalid roll_dice args', async () => {
      await expect(executeRpgTool('roll_dice', '{}')).resolves.toEqual({
         error: 'Invalid roll_dice arguments',
      });
   });

   it('executes lookup_character', async () => {
      mockLookupCharacter.mockResolvedValue({
         query: 'Rick',
         matches: [{ id: 1, name: 'Rick Sanchez', status: 'Alive', species: 'Human', location: 'Earth' }],
      });
      await expect(executeRpgTool('lookup_character', '{"name":"Rick"}')).resolves.toMatchObject({
         query: 'Rick',
      });
   });

   it('returns tool errors without throwing', async () => {
      mockLookupEpisode.mockRejectedValue(new Error('EPISODE_NOT_FOUND'));
      await expect(executeRpgTool('lookup_episode', '{"episodeId":999}')).resolves.toEqual({
         error: 'EPISODE_NOT_FOUND',
      });
   });
});
