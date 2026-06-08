import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { CharacterService } from '../../services/characters';
import { EpisodeService } from '../../services/episodes';
import type { Character, Episode } from '../../types/api';
import { EpisodeDetailPage } from '../../pages/EpisodeDetailPage';
import { TestQueryProvider } from '../TestQueryProvider';

vi.mock('../../components/episodes/EpisodeCuriosityPanel', () => ({
   EpisodeCuriosityPanel: ({ episodeId }: { episodeId: number }) => (
      <div data-testid="episode-curiosity-panel">curiosity-{episodeId}</div>
   ),
}));

vi.mock('../../services/episodes', () => ({
   EpisodeService: {
      getEpisodeById: vi.fn(),
   },
}));

vi.mock('../../services/characters', () => ({
   CharacterService: {
      getMultipleCharacters: vi.fn(),
   },
}));

const mockEpisode: Episode = {
   id: 1,
   name: 'Pilot',
   air_date: 'December 2, 2013',
   episode: 'S01E01',
   characters: [
      'https://rickandmortyapi.com/api/character/1',
      'https://rickandmortyapi.com/api/character/2',
   ],
   url: 'https://rickandmortyapi.com/api/episode/1',
   created: '2017-11-10T12:56:33.798Z',
};

const mockCharacters: Character[] = [
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
];

function renderAt(path: string) {
   return render(
      <TestQueryProvider>
         <MemoryRouter initialEntries={[path]}>
            <Routes>
               <Route path="/episode/:id" element={<EpisodeDetailPage />} />
            </Routes>
         </MemoryRouter>
      </TestQueryProvider>,
   );
}

describe('EpisodeDetailPage', () => {
   beforeEach(() => {
      vi.mocked(EpisodeService.getEpisodeById).mockReset();
      vi.mocked(CharacterService.getMultipleCharacters).mockReset();
   });

   it('shows invalid id message without calling the API', () => {
      renderAt('/episode/abc');

      expect(EpisodeService.getEpisodeById).not.toHaveBeenCalled();
      expect(screen.getByText(i18n.t('episodeDetail.errorInvalidId'))).toBeInTheDocument();
   });

   it('loads episode and character list', async () => {
      vi.mocked(EpisodeService.getEpisodeById).mockResolvedValue(mockEpisode);
      vi.mocked(CharacterService.getMultipleCharacters).mockResolvedValue(mockCharacters);

      renderAt('/episode/1');

      expect(await screen.findByRole('heading', { name: 'Pilot' })).toBeInTheDocument();
      expect(screen.getByText('S01E01')).toBeInTheDocument();
      expect(await screen.findByRole('link', { name: 'Rick Sanchez' })).toBeInTheDocument();
      expect(screen.getByTestId('episode-curiosity-panel')).toHaveTextContent('curiosity-1');
      expect(CharacterService.getMultipleCharacters).toHaveBeenCalledWith([1, 2]);
   });

   it('shows not found when API returns 404', async () => {
      const err = new AxiosError('Not Found');
      err.response = {
         status: 404,
         data: {},
         statusText: 'Not Found',
         headers: {},
         config: {} as never,
      };
      vi.mocked(EpisodeService.getEpisodeById).mockRejectedValue(err);

      renderAt('/episode/999');

      expect(await screen.findByText(i18n.t('episodeDetail.errorNotFound'))).toBeInTheDocument();
   });
});
