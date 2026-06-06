import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Episode } from '../../types/api';
import i18n from '../../i18n';
import { EpisodeCard } from '../../components/episodes/EpisodeCard';

const episode: Episode = {
   id: 1,
   name: 'Pilot',
   air_date: 'December 2, 2013',
   episode: 'S01E01',
   characters: [
      'https://rickandmortyapi.com/api/character/1',
      'https://rickandmortyapi.com/api/character/2',
   ],
   url: '',
   created: '',
};

function renderWithRouter(ui: ReactElement) {
   return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('EpisodeCard', () => {
   it('renders code, name, air date and character count', () => {
      renderWithRouter(<EpisodeCard episode={episode} />);
      expect(screen.getByText('S01E01')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Pilot' })).toBeInTheDocument();
      expect(screen.getByText(/December 2, 2013/)).toBeInTheDocument();
      expect(
         screen.getByText(i18n.t('episodes.card.characterCount', { count: 2 })),
      ).toBeInTheDocument();
   });

   it('uses pointer cursor and glow-card on the interactive card', () => {
      renderWithRouter(<EpisodeCard episode={episode} />);
      const link = screen.getByRole('link', {
         name: i18n.t('episodes.card.ariaViewDetails', { name: 'Pilot' }),
      });
      expect(link).toHaveClass('cursor-pointer');
      expect(link).toHaveClass('glow-card');
   });
});
