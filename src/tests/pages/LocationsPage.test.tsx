import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import type { ApiResponse, Location } from '../../types/api';
import { LocationService } from '../../services/locations';
import { LocationsPage } from '../../pages/LocationsPage';
import { TestProviders } from '../TestProviders';

vi.mock('../../services/locations', () => ({
   LocationService: {
      getLocations: vi.fn(),
   },
}));

const mockedGetLocations = vi.mocked(LocationService.getLocations);

const sampleLocation: Location = {
   id: 1,
   name: 'Earth',
   type: 'Planet',
   dimension: 'Dimension C-137',
   residents: ['https://rickandmortyapi.com/api/character/1'],
   url: '',
   created: '',
};

const listPayload: ApiResponse<Location> = {
   info: { count: 1, pages: 1, next: null, prev: null },
   results: [sampleLocation],
};

function renderLocations() {
   return render(
      <TestProviders>
         <MemoryRouter>
            <LocationsPage />
         </MemoryRouter>
      </TestProviders>,
   );
}

function lastLocationsCall() {
   const call = mockedGetLocations.mock.calls.at(-1);
   return call ? [call[0], call[1]] : undefined;
}

describe('LocationsPage', () => {
   beforeEach(() => {
      mockedGetLocations.mockReset();
      mockedGetLocations.mockResolvedValue(listPayload);
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   it('loads locations on mount', async () => {
      renderLocations();
      await waitFor(() => {
         expect(lastLocationsCall()).toEqual([1, {}]);
      });
      expect(await screen.findByText('Earth')).toBeInTheDocument();
   });

   it('applies type filter', async () => {
      renderLocations();
      await waitFor(() => expect(mockedGetLocations).toHaveBeenCalled());

      fireEvent.change(screen.getByLabelText(i18n.t('locations.filters.typeLabel')), {
         target: { value: 'Planet' },
      });

      await waitFor(() => {
         expect(lastLocationsCall()).toEqual([1, { type: 'Planet' }]);
      });
   });

   it('clears filters', async () => {
      renderLocations();
      await waitFor(() => expect(mockedGetLocations).toHaveBeenCalled());

      fireEvent.change(screen.getByLabelText(i18n.t('locations.filters.typeLabel')), {
         target: { value: 'Planet' },
      });
      await waitFor(() => {
         expect(lastLocationsCall()).toEqual([1, { type: 'Planet' }]);
      });

      fireEvent.click(screen.getByRole('button', { name: i18n.t('locations.filters.clear') }));

      await waitFor(() => {
         expect(lastLocationsCall()).toEqual([1, {}]);
      });
   });

   it('debounces name search', async () => {
      vi.useFakeTimers();
      renderLocations();

      await act(async () => {
         await Promise.resolve();
      });

      expect(mockedGetLocations).toHaveBeenCalled();
      mockedGetLocations.mockClear();

      const input = screen.getByPlaceholderText(i18n.t('locations.filters.searchPlaceholder'));
      fireEvent.change(input, { target: { value: 'Citadel' } });

      expect(mockedGetLocations).not.toHaveBeenCalled();

      await act(() => {
         vi.advanceTimersByTime(400);
      });
      await act(async () => {
         await Promise.resolve();
      });

      expect(lastLocationsCall()).toEqual([1, { name: 'Citadel' }]);
   });
});
