import { fetchCharactersByName } from '../services/rickAndMortyApi.js';

export interface LookupCharacterMatch {
   id: number;
   name: string;
   status: string;
   species: string;
   location: string;
}

export interface LookupCharacterResult {
   query: string;
   matches: LookupCharacterMatch[];
}

export async function lookupCharacter(name: string): Promise<LookupCharacterResult> {
   const trimmed = name.trim();
   if (!trimmed) {
      throw new Error('INVALID_CHARACTER_NAME');
   }

   const characters = await fetchCharactersByName(trimmed);
   const matches = characters.slice(0, 3).map((character) => ({
      id: character.id,
      name: character.name,
      status: character.status,
      species: character.species,
      location: character.location.name,
   }));

   return { query: trimmed, matches };
}
