import { afterEach, describe, expect, it, vi } from 'vitest';
import { rollDice } from './rollDice.js';

describe('rollDice', () => {
   afterEach(() => {
      vi.restoreAllMocks();
   });
   it('rolls a single die', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = rollDice('1d20');
      expect(result.notation).toBe('1d20');
      expect(result.rolls).toEqual([11]);
      expect(result.modifier).toBe(0);
      expect(result.total).toBe(11);
   });

   it('rolls multiple dice with modifier', () => {
      vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99);
      const result = rollDice('2d6+3');
      expect(result.rolls).toEqual([1, 6]);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(10);
   });

   it('rejects invalid notation', () => {
      expect(() => rollDice('d20')).toThrow('INVALID_DICE_NOTATION');
      expect(() => rollDice('1d1')).toThrow('INVALID_DICE_NOTATION');
   });
});
