export interface RollDiceResult {
   notation: string;
   rolls: number[];
   modifier: number;
   total: number;
}

const DICE_NOTATION = /^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i;

export function rollDice(notation: string): RollDiceResult {
   const trimmed = notation.trim().replace(/\s+/g, '');
   const match = trimmed.match(DICE_NOTATION);
   if (!match) {
      throw new Error('INVALID_DICE_NOTATION');
   }

   const count = Number(match[1]);
   const sides = Number(match[2]);
   if (!Number.isInteger(count) || !Number.isInteger(sides) || count < 1 || sides < 2) {
      throw new Error('INVALID_DICE_NOTATION');
   }
   if (count > 100) {
      throw new Error('TOO_MANY_DICE');
   }

   let modifier = 0;
   if (match[3] && match[4]) {
      const value = Number(match[4]);
      if (!Number.isInteger(value)) {
         throw new Error('INVALID_DICE_NOTATION');
      }
      modifier = match[3] === '-' ? -value : value;
   }

   const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
   const total = rolls.reduce((sum, value) => sum + value, 0) + modifier;

   return {
      notation: trimmed,
      rolls,
      modifier,
      total,
   };
}
