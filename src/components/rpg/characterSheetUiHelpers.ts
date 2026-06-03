import { ABILITY_IDS } from './types';
import type { AbilityId, RaceId } from './types';

export function totalToD20Mod(total: number): number {
   return Math.floor((total - 10) / 2);
}

export function formatBonus(n: number): string {
   if (n === 0) {
      return '—';
   }
   return n > 0 ? `+${n}` : String(n);
}

/** Non-empty localized lines for each ability with a negative drawback on the sheet. */
export function mechanicalDrawbackParts(
   sheetDrawback: Record<AbilityId, number>,
   translate: (key: string) => string,
): string[] {
   const parts: string[] = [];
   for (const id of ABILITY_IDS) {
      const v = sheetDrawback[id];
      if (v < 0) {
         parts.push(`${translate(`rpg.abilities.${id}` as 'rpg.title')} ${formatBonus(v)}`);
      }
   }
   return parts;
}

export function downloadJsonFile(filename: string, data: unknown) {
   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
   const url = URL.createObjectURL(blob);
   const anchor = document.createElement('a');
   anchor.href = url;
   anchor.download = filename;
   anchor.rel = 'noopener';
   anchor.click();
   URL.revokeObjectURL(url);
}

export function raceSkillName(
   t: (key: string) => string,
   raceId: RaceId,
   slot: 'attack1' | 'attack2' | 'support' | 'item',
): string {
   return t(`rpg.races.${raceId}.skills.${slot}.name` as 'rpg.title');
}

export function raceSkillSummary(
   t: (key: string) => string,
   raceId: RaceId,
   slot: 'attack1' | 'attack2' | 'support' | 'item',
): string {
   return t(`rpg.races.${raceId}.skills.${slot}.summary` as 'rpg.title');
}

export function slugForFilename(name: string): string {
   const s = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
   return s.slice(0, 48) || 'character';
}
