import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import i18n from '../../i18n';
import { RpgGamePage } from '../../pages/RpgGamePage';
import { CHARACTER_SHEET_EXPORT_SCHEMA_VERSION } from '../../components/rpg/buildCharacterSheetExport';
import type { CharacterSheetExportDocument } from '../../components/rpg/buildCharacterSheetExport';

vi.mock('../../components/rpg/RpgGameChat', () => ({
   RpgGameChat: () => <div data-testid="rpg-game-chat">chat</div>,
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
         ],
         support: { id: 'support', name: 'S', summary: '' },
         item: { id: 'item', name: 'I', summary: '', outOfCombat: '' },
      },
   },
   derived: {
      hitPointsMax: 12,
      physicalAttackRating: 10,
      magicalAttackRating: 10,
      socialInfluencePool: 10,
      dexSpeedTier: 0,
      extraStrikesBeforeEnemy: 0,
      stealthRating: 10,
      stealthRacialBonus: 0,
   },
   abilities: [],
};

function renderAt(path: string, ui: ReactElement) {
   return render(
      <MemoryRouter initialEntries={[path]}>
         <Routes>
            <Route path="/rpg/play" element={ui} />
            <Route path="/rpg" element={<div data-testid="rpg-creator">creator</div>} />
         </Routes>
      </MemoryRouter>,
   );
}

describe('RpgGamePage', () => {
   beforeEach(() => {
      sessionStorage.clear();
   });

   it('redirects to /rpg when session is missing', () => {
      renderAt('/rpg/play', <RpgGamePage />);
      expect(screen.getByTestId('rpg-creator')).toBeInTheDocument();
   });

   it('renders chat when session exists', () => {
      sessionStorage.setItem('rpg.session.character', JSON.stringify(sampleSheet));
      renderAt('/rpg/play', <RpgGamePage />);
      expect(screen.getByTestId('rpg-game-chat')).toBeInTheDocument();
      expect(screen.getByText(i18n.t('rpg.game.title'))).toBeInTheDocument();
      expect(screen.getByText(i18n.t('rpg.game.playingAs', { name: 'Morty' }))).toBeInTheDocument();
   });
});
