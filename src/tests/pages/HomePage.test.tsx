import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import type { ApiResponse, Character } from '../../types/api';
import { CharacterService } from '../../services/characters';
import { HomePage } from '../../pages/HomePage';
import { TestProviders } from '../TestProviders';

vi.mock('../../services/characters', () => ({
   CharacterService: {
      getCharacters: vi.fn(),
   },
}));

const mockedGetCharacters = vi.mocked(CharacterService.getCharacters);

const sampleCharacter: Character = {
   id: 1,
   name: 'Rick Sanchez',
   status: 'Alive',
   species: 'Human',
   type: '',
   gender: 'Male',
   origin: { name: 'Earth', url: '' },
   location: { name: 'Earth', url: '' },
   image: 'https://example.com/rick.png',
   episode: [],
   url: '',
   created: '',
};

const listPayload: ApiResponse<Character> = {
   info: { count: 1, pages: 1, next: null, prev: null },
   results: [sampleCharacter],
};

function renderHome() {
   return render(
      <TestProviders>
         <MemoryRouter>
            <HomePage />
         </MemoryRouter>
      </TestProviders>,
   );
}

function lastCharacterListCall() {
   const call = mockedGetCharacters.mock.calls.at(-1);
   return call ? [call[0], call[1]] : undefined;
}

describe('HomePage', () => {
   beforeEach(() => {
      mockedGetCharacters.mockReset();
      mockedGetCharacters.mockResolvedValue(listPayload);
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   it('loads characters on mount with page 1 and no filters', async () => {
      renderHome();
      await waitFor(() => {
         expect(lastCharacterListCall()).toEqual([1, {}]);
      });
      expect(await screen.findByRole('heading', { name: /Rick Sanchez/i })).toBeInTheDocument();
   });

   it('renders search field and filter selects including species and type', () => {
      renderHome();
      expect(screen.getByPlaceholderText(i18n.t('filters.searchPlaceholder'))).toBeInTheDocument();
      const statusSelect = screen.getByLabelText(i18n.t('filters.statusLabel'));
      expect(
         within(statusSelect).getByRole('option', { name: i18n.t('filters.statusAll') }),
      ).toBeInTheDocument();
      const speciesSelect = screen.getByLabelText(i18n.t('filters.species'));
      expect(
         within(speciesSelect).getByRole('option', { name: i18n.t('filters.speciesAll') }),
      ).toBeInTheDocument();
      expect(within(speciesSelect).getByRole('option', { name: 'Human' })).toBeInTheDocument();
      const typeSelect = screen.getByLabelText(i18n.t('filters.type'));
      expect(
         within(typeSelect).getByRole('option', { name: i18n.t('filters.typeAll') }),
      ).toBeInTheDocument();
   });

   it('requests list with species when species filter changes', async () => {
      renderHome();
      await waitFor(() => expect(mockedGetCharacters).toHaveBeenCalled());

      mockedGetCharacters.mockClear();
      const speciesSelect = screen.getByLabelText(i18n.t('filters.species'));
      fireEvent.change(speciesSelect, { target: { value: 'Human' } });

      await waitFor(() => {
         expect(lastCharacterListCall()).toEqual([1, { species: 'Human' }]);
      });
   });

   it('requests list with status when status filter changes', async () => {
      renderHome();
      await waitFor(() => expect(mockedGetCharacters).toHaveBeenCalled());

      mockedGetCharacters.mockClear();
      const statusSelect = screen.getByLabelText(i18n.t('filters.statusLabel'));
      fireEvent.change(statusSelect, { target: { value: 'alive' } });

      await waitFor(() => {
         expect(lastCharacterListCall()).toEqual([1, { status: 'alive' }]);
      });
   });

   it('debounces name filter before calling the API', async () => {
      vi.useFakeTimers();
      renderHome();

      await act(async () => {
         await Promise.resolve();
      });

      expect(mockedGetCharacters).toHaveBeenCalled();
      mockedGetCharacters.mockClear();

      const input = screen.getByPlaceholderText(i18n.t('filters.searchPlaceholder'));
      fireEvent.change(input, { target: { value: 'Morty' } });

      expect(mockedGetCharacters).not.toHaveBeenCalled();

      await act(() => {
         vi.advanceTimersByTime(400);
      });
      await act(async () => {
         await Promise.resolve();
      });

      expect(lastCharacterListCall()).toEqual([1, { name: 'Morty' }]);
   });

   it('clears all filters and refetches without params', async () => {
      renderHome();
      await waitFor(() => expect(mockedGetCharacters).toHaveBeenCalled());

      const clearBtn = screen.getByRole('button', { name: i18n.t('filters.clear') });
      expect(clearBtn).toBeDisabled();

      const statusSelect = screen.getByLabelText(i18n.t('filters.statusLabel'));
      fireEvent.change(statusSelect, { target: { value: 'alive' } });
      await waitFor(() => {
         expect(lastCharacterListCall()).toEqual([1, { status: 'alive' }]);
      });

      mockedGetCharacters.mockClear();
      expect(clearBtn).not.toBeDisabled();
      fireEvent.click(clearBtn);

      await waitFor(() => {
         expect(lastCharacterListCall()).toEqual([1, {}]);
      });
      expect(statusSelect).toHaveValue('');
   });
});
