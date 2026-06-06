import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import { CharacterSheetContainer } from '../../../components/rpg/CharacterSheetContainer';

function getSelectedRacePreviewImg(): HTMLImageElement | null {
   const heading = screen.getByRole('heading', { name: i18n.t('rpg.selectedRacePreview') });
   const section = heading.closest('section');
   if (!section) {
      return null;
   }
   return section.querySelector('img');
}

function getSelectedRacePreviewFallback(): HTMLElement | null {
   const heading = screen.getByRole('heading', { name: i18n.t('rpg.selectedRacePreview') });
   const section = heading.closest('section');
   if (!section) {
      return null;
   }
   return section.querySelector('[role="img"]');
}

describe('CharacterSheetContainer', () => {
   it('recovers preview image after previous portrait error', () => {
      render(
         <MemoryRouter>
            <CharacterSheetContainer />
         </MemoryRouter>,
      );

      const rickPresetButton = screen.getByText(/Rick.*OP/i).closest('button');
      expect(rickPresetButton).not.toBeNull();
      fireEvent.click(rickPresetButton!);

      const firstImg = getSelectedRacePreviewImg();
      expect(firstImg).not.toBeNull();
      expect(firstImg?.getAttribute('src')).toContain('/1.jpeg');
      fireEvent.error(firstImg!);

      expect(getSelectedRacePreviewFallback()).not.toBeNull();

      const evilPresetButton = screen.getByText(/Evil Morty/i).closest('button');
      expect(evilPresetButton).not.toBeNull();
      fireEvent.click(evilPresetButton!);

      const secondImg = getSelectedRacePreviewImg();
      expect(secondImg).not.toBeNull();
      expect(secondImg?.getAttribute('src')).toContain('/118.jpeg');
   });
});
