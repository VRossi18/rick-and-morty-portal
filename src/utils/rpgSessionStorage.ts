import {
   CHARACTER_SHEET_EXPORT_SCHEMA_VERSION,
   type CharacterSheetExportDocument,
} from '../components/rpg/buildCharacterSheetExport';

const SESSION_KEY = 'rpg.session.character';

function isCharacterSheetExportDocument(value: unknown): value is CharacterSheetExportDocument {
   if (!value || typeof value !== 'object') {
      return false;
   }
   const doc = value as CharacterSheetExportDocument;
   return (
      doc.meta?.schemaVersion === CHARACTER_SHEET_EXPORT_SCHEMA_VERSION &&
      typeof doc.character?.name === 'string' &&
      doc.character.name.trim().length > 0
   );
}

export function saveRpgSession(sheet: CharacterSheetExportDocument): void {
   sessionStorage.setItem(SESSION_KEY, JSON.stringify(sheet));
}

export function loadRpgSession(): CharacterSheetExportDocument | null {
   const raw = sessionStorage.getItem(SESSION_KEY);
   if (!raw) {
      return null;
   }
   try {
      const parsed: unknown = JSON.parse(raw);
      return isCharacterSheetExportDocument(parsed) ? parsed : null;
   } catch {
      return null;
   }
}

export function clearRpgSession(): void {
   sessionStorage.removeItem(SESSION_KEY);
}
