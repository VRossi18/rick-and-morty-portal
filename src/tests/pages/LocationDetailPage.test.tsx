import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { CharacterService } from '../../services/characters';
import { EpisodeService } from '../../services/episodes';
import { LocationService } from '../../services/locations';
import type { Character, Episode, Location } from '../../types/api';
import { LocationDetailPage } from '../../pages/LocationDetailPage';
import { TestQueryProvider } from '../TestQueryProvider';

vi.mock('../../services/locations', () => ({
   LocationService: {
      getLocationById: vi.fn(),
   },
}));

vi.mock('../../services/characters', () => ({
   CharacterService: {
      getMultipleCharacters: vi.fn(),
   },
}));

vi.mock('../../services/episodes', () => ({
   EpisodeService: {
      getMultipleEpisodes: vi.fn(),
   },
}));

const mockLocation: Location = {
   id: 3,
   name: 'Citadel of Ricks',
   type: 'Space station',
   dimension: 'unknown',
   residents: ['https://rickandmortyapi.com/api/character/8'],
   url: 'https://rickandmortyapi.com/api/location/3',
   created: '2017-11-10T13:08:13.191Z',
};

const mockCharacter: Character = {
   id: 8,
   name: 'Fancy Rick',
   status: 'Alive',
   species: 'Human',
   type: '',
   gender: 'Male',
   origin: { name: '', url: '' },
   location: { name: '', url: '' },
   image: 'https://example.com/rick.png',
   episode: [
      'https://rickandmortyapi.com/api/episode/10',
      'https://rickandmortyapi.com/api/episode/28',
   ],
   url: '',
   created: '',
};

const mockEpisodes: Episode[] = [
   {
      id: 10,
      name: 'Close Rick-counters',
      air_date: '',
      episode: 'S01E10',
      characters: [],
      url: '',
      created: '',
   },
   {
      id: 28,
      name: 'The Ricklantis Mixup',
      air_date: '',
      episode: 'S03E07',
      characters: [],
      url: '',
      created: '',
   },
];

function renderAt(path: string) {
   return render(
      <TestQueryProvider>
         <MemoryRouter initialEntries={[path]}>
            <Routes>
               <Route path="/location/:id" element={<LocationDetailPage />} />
            </Routes>
         </MemoryRouter>
      </TestQueryProvider>,
   );
}

describe('LocationDetailPage', () => {
   beforeEach(() => {
      vi.mocked(LocationService.getLocationById).mockReset();
      vi.mocked(CharacterService.getMultipleCharacters).mockReset();
      vi.mocked(EpisodeService.getMultipleEpisodes).mockReset();
   });

   it('shows invalid id message without calling the API', () => {
      renderAt('/location/abc');

      expect(LocationService.getLocationById).not.toHaveBeenCalled();
      expect(screen.getByText(i18n.t('locationDetail.errorInvalidId'))).toBeInTheDocument();
   });

   it('loads location, residents, and related episodes', async () => {
      vi.mocked(LocationService.getLocationById).mockResolvedValue(mockLocation);
      vi.mocked(CharacterService.getMultipleCharacters).mockResolvedValue([mockCharacter]);
      vi.mocked(EpisodeService.getMultipleEpisodes).mockResolvedValue(mockEpisodes);

      renderAt('/location/3');

      expect(
         await screen.findByRole('heading', { name: 'Citadel of Ricks' }),
      ).toBeInTheDocument();
      expect(await screen.findByRole('link', { name: 'Fancy Rick' })).toHaveAttribute(
         'href',
         '/character/8',
      );
      expect(await screen.findByRole('link', { name: /Close Rick-counters/i })).toHaveAttribute(
         'href',
         '/episode/10',
      );
      expect(await screen.findByRole('link', { name: /The Ricklantis Mixup/i })).toHaveAttribute(
         'href',
         '/episode/28',
      );
      expect(EpisodeService.getMultipleEpisodes).toHaveBeenCalledWith([10, 28]);
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
      vi.mocked(LocationService.getLocationById).mockRejectedValue(err);

      renderAt('/location/999');

      expect(await screen.findByText(i18n.t('locationDetail.errorNotFound'))).toBeInTheDocument();
   });
});
