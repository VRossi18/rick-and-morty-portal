import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { CharacterService } from '../../services/characters';
import { EpisodeService } from '../../services/episodes';
import type { Character, Episode } from '../../types/api';
import { CharacterDetailPage } from '../../pages/CharacterDetailPage';
import { TestQueryProvider } from '../TestQueryProvider';

vi.mock('../../services/characters', () => ({
   CharacterService: {
      getCharacterById: vi.fn(),
   },
}));

vi.mock('../../services/episodes', () => ({
   EpisodeService: {
      getMultipleEpisodes: vi.fn(),
   },
}));

vi.mock('../../components/characters/CharacterCuriosityPanel', () => ({
   CharacterCuriosityPanel: ({ characterId }: { characterId: number }) => (
      <div data-testid="character-curiosity-panel">curiosity-{characterId}</div>
   ),
}));

const mockEpisode: Episode = {
   id: 1,
   name: 'Pilot',
   air_date: 'December 2, 2013',
   episode: 'S01E01',
   characters: [],
   url: 'https://rickandmortyapi.com/api/episode/1',
   created: '2017-11-10T12:56:33.798Z',
};

const mockCharacter: Character = {
   id: 2,
   name: 'Morty Smith',
   status: 'Alive',
   species: 'Human',
   type: '',
   gender: 'Male',
   origin: { name: 'Earth', url: 'https://rickandmortyapi.com/api/location/1' },
   location: { name: 'Earth', url: 'https://rickandmortyapi.com/api/location/20' },
   image: 'https://rickandmortyapi.com/api/character/avatar/2.jpeg',
   episode: ['https://rickandmortyapi.com/api/episode/1'],
   url: 'https://rickandmortyapi.com/api/character/2',
   created: '2017-11-04T18:50:21.651Z',
};

function renderAt(path: string) {
   return render(
      <TestQueryProvider>
         <MemoryRouter initialEntries={[path]}>
            <Routes>
               <Route path="/character/:id" element={<CharacterDetailPage />} />
            </Routes>
         </MemoryRouter>
      </TestQueryProvider>,
   );
}

describe('CharacterDetailPage', () => {
   beforeEach(() => {
      vi.mocked(CharacterService.getCharacterById).mockReset();
      vi.mocked(EpisodeService.getMultipleEpisodes).mockReset();
   });

   it('shows invalid id message without calling the API', () => {
      renderAt('/character/abc');

      expect(CharacterService.getCharacterById).not.toHaveBeenCalled();
      expect(screen.getByText(i18n.t('characterDetail.errorInvalidId'))).toBeInTheDocument();
   });

   it('loads character and shows fields with episode links', async () => {
      vi.mocked(CharacterService.getCharacterById).mockResolvedValue(mockCharacter);
      vi.mocked(EpisodeService.getMultipleEpisodes).mockResolvedValue([mockEpisode]);

      renderAt('/character/2');

      expect(await screen.findByRole('heading', { name: 'Morty Smith' })).toBeInTheDocument();
      expect(screen.getByTestId('character-curiosity-panel')).toHaveTextContent('curiosity-2');
      expect(await screen.findByRole('link', { name: /Pilot/i })).toHaveAttribute(
         'href',
         '/episode/1',
      );
      expect(EpisodeService.getMultipleEpisodes).toHaveBeenCalledWith([1]);
      const earthLinks = screen.getAllByRole('link', { name: 'Earth' });
      expect(earthLinks[0]).toHaveAttribute('href', '/location/1');
      expect(earthLinks[1]).toHaveAttribute('href', '/location/20');
      expect(CharacterService.getCharacterById).toHaveBeenCalledWith(2);
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
      vi.mocked(CharacterService.getCharacterById).mockRejectedValue(err);

      renderAt('/character/999');

      expect(await screen.findByText(i18n.t('characterDetail.errorNotFound'))).toBeInTheDocument();
   });
});
