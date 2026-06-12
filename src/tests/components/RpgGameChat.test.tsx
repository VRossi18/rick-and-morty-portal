import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
   CHARACTER_SHEET_EXPORT_SCHEMA_VERSION,
   type CharacterSheetExportDocument,
} from '../../components/rpg/buildCharacterSheetExport';
import { RpgGameChat } from '../../components/rpg/RpgGameChat';
import i18n from '../../i18n';
import { TestQueryProvider } from '../TestQueryProvider';

const aiMocks = vi.hoisted(() => ({
   isConfigured: true,
}));

const sampleSheet: CharacterSheetExportDocument = {
   meta: {
      schemaVersion: CHARACTER_SHEET_EXPORT_SCHEMA_VERSION,
      exportedAt: '2026-01-01T00:00:00.000Z',
      locale: 'pt',
      app: 'rick-morty-portal',
      llmInstructions: 'test',
   },
   character: { name: 'Morty' },
   rules: {
      summary: '',
      baseScore: 8,
      minScoreBeforeRace: 8,
      maxScoreBeforeRace: 15,
      pointPoolMax: 27,
      finalScoreWarningThreshold: 18,
      derivedFormulas: {
         hitPoints: '',
         physicalAttack: '',
         magicalAttack: '',
         socialPool: '',
         dexSpeed: '',
         stealth: '',
      },
   },
   pointPool: { max: 27, spent: 27, remaining: 0 },
   race: {
      id: 'humans',
      name: 'Human',
      visualDescription: '',
      drawbackDescription: '',
      portraitUrl: '',
      racialModifiers: { str: 0, dex: 0, con: 0, int: 0, cha: 0 },
      drawbackModifiers: { str: 0, dex: 0, con: 0, int: 0, cha: 0 },
      skills: {
         attacks: [
            { id: 'attack1', name: 'A1', summary: '' },
            { id: 'attack2', name: 'A2', summary: '' },
            { id: 'attack3', name: 'A3', summary: '' },
         ],
         defenses: [
            { id: 'defense1', name: 'D1', summary: '' },
            { id: 'defense2', name: 'D2', summary: '' },
            { id: 'defense3', name: 'D3', summary: '' },
         ],
         knowledge: [
            { id: 'knowledge1', name: 'K1', summary: '' },
            { id: 'knowledge2', name: 'K2', summary: '' },
            { id: 'knowledge3', name: 'K3', summary: '' },
         ],
      },
   },
   abilities: {
      scores: { str: 8, dex: 8, con: 8, int: 8, cha: 8 },
      racialBonus: { str: 0, dex: 0, con: 0, int: 0, cha: 0 },
      totals: { str: 8, dex: 8, con: 8, int: 8, cha: 8 },
      highTotalFlags: { str: false, dex: false, con: false, int: false, cha: false },
   },
   derived: {
      hitPoints: 0,
      physicalAttack: 0,
      magicalAttack: 0,
      socialPool: 0,
      dexSpeed: 0,
      stealth: 0,
   },
};

vi.mock('../../config/ai', async (importOriginal) => {
   const actual = await importOriginal<typeof import('../../config/ai')>();
   return {
      ...actual,
      get isRpgChatConfigured() {
         return aiMocks.isConfigured;
      },
      resolveRpgChatApiUrl: () =>
         aiMocks.isConfigured ? 'http://localhost:8080/api/ai/rpg-chat' : null,
   };
});

function renderChat() {
   return render(
      <TestQueryProvider>
         <RpgGameChat characterSheet={sampleSheet} />
      </TestQueryProvider>,
   );
}

describe('RpgGameChat', () => {
   beforeEach(() => {
      aiMocks.isConfigured = true;
      vi.stubGlobal('fetch', vi.fn());
   });

   it('shows not configured message when AI URL is missing', () => {
      aiMocks.isConfigured = false;
      renderChat();
      expect(screen.getAllByText(i18n.t('rpg.game.notConfigured')).length).toBeGreaterThan(0);
   });

   it('loads opening GM message on mount', async () => {
      vi.mocked(fetch).mockResolvedValue({
         ok: true,
         json: async () => ({ text: 'You wake up in the Citadel of Ricks.' }),
      } as Response);

      renderChat();

      expect(
         await screen.findByText('You wake up in the Citadel of Ricks.'),
      ).toBeInTheDocument();
   });

   it('sends a player message and shows GM reply', async () => {
      vi.mocked(fetch)
         .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ text: 'Opening scene.' }),
         } as Response)
         .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ text: 'Rick sighs and grabs his portal gun.' }),
         } as Response);

      renderChat();
      expect(await screen.findByText('Opening scene.')).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(i18n.t('rpg.game.inputPlaceholder')), {
         target: { value: 'Where are we?' },
      });
      fireEvent.click(screen.getByRole('button', { name: i18n.t('rpg.game.send') }));

      await waitFor(() => {
         expect(screen.getByText('Where are we?')).toBeInTheDocument();
         expect(screen.getByText('Rick sighs and grabs his portal gun.')).toBeInTheDocument();
      });
   });

   it('shows not configured on 503 and retries opening', async () => {
      vi.mocked(fetch)
         .mockResolvedValueOnce({
            ok: false,
            status: 503,
         } as Response)
         .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ text: 'Second try works.' }),
         } as Response);

      renderChat();

      expect(await screen.findByText(i18n.t('rpg.game.notConfigured'))).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: i18n.t('rpg.game.retry') }));

      expect(await screen.findByText('Second try works.')).toBeInTheDocument();
   });
});
