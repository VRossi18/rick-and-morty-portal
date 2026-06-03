import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import type { ApiResponse, Episode } from '../../types/api';
import { CharacterService } from '../../services/characters';
import { EpisodeService } from '../../services/episodes';
import { EpisodesPage } from '../../pages/EpisodesPage';
import { TestProviders } from '../TestProviders';

vi.mock('../../services/episodes', () => ({
   EpisodeService: {
      getEpisodes: vi.fn(),
   },
}));

vi.mock('../../services/characters', () => ({
   CharacterService: {
      getCharacters: vi.fn(),
   },
}));

const mockedGetEpisodes = vi.mocked(EpisodeService.getEpisodes);
const mockedGetCharacters = vi.mocked(CharacterService.getCharacters);

const sampleEpisode: Episode = {
   id: 1,
   name: 'Pilot',
   air_date: 'December 2, 2013',
   episode: 'S01E01',
   characters: ['https://rickandmortyapi.com/api/character/1'],
   url: '',
   created: '',
};

const listPayload: ApiResponse<Episode> = {
   info: { count: 1, pages: 1, next: null, prev: null },
   results: [sampleEpisode],
};

function renderEpisodes() {
   return render(
      <TestProviders>
         <MemoryRouter>
            <EpisodesPage />
         </MemoryRouter>
      </TestProviders>,
   );
}

function lastEpisodesCall() {
   const call = mockedGetEpisodes.mock.calls.at(-1);
   return call ? [call[0], call[1]] : undefined;
}

describe('EpisodesPage', () => {
   beforeEach(() => {
      mockedGetEpisodes.mockReset();
      mockedGetCharacters.mockReset();
      mockedGetEpisodes.mockResolvedValue(listPayload);
      mockedGetCharacters.mockResolvedValue({
         info: { count: 1, pages: 1, next: null, prev: null },
         results: [
            {
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
            },
         ],
      });
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   it('loads season 1 episodes on mount with episode=S01 filter', async () => {
      renderEpisodes();
      await waitFor(() => {
         expect(lastEpisodesCall()).toEqual([1, { episode: 'S01' }]);
      });
      expect(await screen.findByRole('heading', { name: 'Pilot' })).toBeInTheDocument();
   });

   it('renders season arrows, current label, search and character filter', () => {
      renderEpisodes();
      expect(
         screen.getByText(i18n.t('episodes.filters.seasonCurrent', { season: 1 })),
      ).toBeInTheDocument();
      expect(
         screen.getByRole('button', { name: i18n.t('episodes.filters.seasonPrev') }),
      ).toBeDisabled();
      expect(
         screen.getByRole('button', { name: i18n.t('episodes.filters.seasonNext') }),
      ).not.toBeDisabled();
      expect(
         screen.getByPlaceholderText(i18n.t('episodes.filters.searchPlaceholder')),
      ).toBeInTheDocument();
      expect(
         screen.getByLabelText(i18n.t('episodes.filters.charactersLabel')),
      ).toBeInTheDocument();
   });

   it('requests season 2 episodes when next season is clicked', async () => {
      renderEpisodes();
      await waitFor(() => expect(mockedGetEpisodes).toHaveBeenCalled());

      mockedGetEpisodes.mockClear();
      fireEvent.click(screen.getByRole('button', { name: i18n.t('episodes.filters.seasonNext') }));

      await waitFor(() => {
         expect(lastEpisodesCall()).toEqual([1, { episode: 'S02' }]);
      });
      expect(
         screen.getByText(i18n.t('episodes.filters.seasonCurrent', { season: 2 })),
      ).toBeInTheDocument();
   });

   it('shows season in pagination label', async () => {
      renderEpisodes();
      expect(
         await screen.findByText(
            i18n.t('episodes.pagination.pageOfSeason', { season: 1, current: 1, total: 1 }),
         ),
      ).toBeInTheDocument();
   });

   it('fetches all pages and filters by season and character', async () => {
      mockedGetEpisodes
         .mockResolvedValueOnce({
            info: { count: 2, pages: 2, next: 'x', prev: null },
            results: [
               sampleEpisode,
               {
                  ...sampleEpisode,
                  id: 2,
                  name: 'Other',
                  episode: 'S02E01',
                  characters: ['https://rickandmortyapi.com/api/character/1'],
               },
            ],
         })
         .mockResolvedValueOnce({
            info: { count: 2, pages: 2, next: null, prev: 'y' },
            results: [],
         });

      renderEpisodes();

      fireEvent.click(screen.getByLabelText(i18n.t('episodes.filters.charactersLabel')));

      await waitFor(() => {
         expect(mockedGetCharacters).toHaveBeenCalled();
      });

      fireEvent.click(await screen.findByRole('option', { name: /Rick Sanchez/i }));

      await waitFor(() => {
         expect(mockedGetEpisodes).toHaveBeenCalledTimes(2);
      });

      expect(await screen.findByRole('heading', { name: 'Pilot' })).toBeInTheDocument();
      await waitFor(() => {
         expect(screen.queryByRole('heading', { name: 'Other' })).not.toBeInTheDocument();
      });
   });

   it('does not show clear filters when only the season changes', async () => {
      renderEpisodes();
      await waitFor(() => expect(mockedGetEpisodes).toHaveBeenCalled());

      fireEvent.click(screen.getByRole('button', { name: i18n.t('episodes.filters.seasonNext') }));

      await waitFor(() => {
         expect(
            screen.getByText(i18n.t('episodes.filters.seasonCurrent', { season: 2 })),
         ).toBeInTheDocument();
      });

      expect(
         screen.queryByRole('button', { name: i18n.t('episodes.filters.clear') }),
      ).not.toBeInTheDocument();
   });

   it('shows clear filters for character selection and clears it without resetting season', async () => {
      mockedGetEpisodes
         .mockResolvedValueOnce({
            info: { count: 1, pages: 1, next: null, prev: null },
            results: [sampleEpisode],
         })
         .mockResolvedValueOnce({
            info: { count: 1, pages: 1, next: null, prev: null },
            results: [sampleEpisode],
         });

      renderEpisodes();

      fireEvent.click(screen.getByRole('button', { name: i18n.t('episodes.filters.seasonNext') }));
      await waitFor(() => {
         expect(
            screen.getByText(i18n.t('episodes.filters.seasonCurrent', { season: 2 })),
         ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(i18n.t('episodes.filters.charactersLabel')));
      await waitFor(() => expect(mockedGetCharacters).toHaveBeenCalled());
      fireEvent.click(await screen.findByRole('option', { name: /Rick Sanchez/i }));

      const clearBtn = await screen.findByRole('button', {
         name: i18n.t('episodes.filters.clear'),
      });
      expect(clearBtn).toBeInTheDocument();

      mockedGetEpisodes.mockClear();
      fireEvent.click(clearBtn);

      await waitFor(() => {
         expect(lastEpisodesCall()).toEqual([1, { episode: 'S02' }]);
      });
      expect(
         screen.getByText(i18n.t('episodes.filters.seasonCurrent', { season: 2 })),
      ).toBeInTheDocument();
      await waitFor(() => {
         expect(
            screen.queryByRole('button', { name: i18n.t('episodes.filters.clear') }),
         ).not.toBeInTheDocument();
      });
      expect(
         screen.queryByLabelText(
            i18n.t('episodes.filters.removeCharacter', { name: 'Rick Sanchez' }),
         ),
      ).not.toBeInTheDocument();
   });

   it('debounces name search and keeps season filter on API call', async () => {
      vi.useFakeTimers();
      renderEpisodes();

      await act(async () => {
         await Promise.resolve();
      });

      expect(mockedGetEpisodes).toHaveBeenCalled();
      mockedGetEpisodes.mockClear();

      const input = screen.getByPlaceholderText(i18n.t('episodes.filters.searchPlaceholder'));
      fireEvent.change(input, { target: { value: 'Pilot' } });

      expect(mockedGetEpisodes).not.toHaveBeenCalled();

      await act(() => {
         vi.advanceTimersByTime(400);
      });
      await act(async () => {
         await Promise.resolve();
      });

      expect(lastEpisodesCall()).toEqual([1, { name: 'Pilot', episode: 'S01' }]);
   });
});
