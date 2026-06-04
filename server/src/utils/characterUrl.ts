const CHARACTER_URL_PATTERN = /\/character\/(\d+)$/;

export function characterUrlToId(url: string): number | null {
   const match = url.match(CHARACTER_URL_PATTERN);
   if (!match) {
      return null;
   }
   const id = Number(match[1]);
   return Number.isFinite(id) && id > 0 ? id : null;
}

export const MAX_CHARACTER_NAMES_IN_PROMPT = 20;
