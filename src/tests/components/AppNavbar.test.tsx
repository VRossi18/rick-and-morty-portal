import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';

vi.mock('../../services/characters', () => ({
   CharacterService: { getCharacters: vi.fn().mockResolvedValue({ info: { count: 0, pages: 1, next: null, prev: null }, results: [] }) },
}));
vi.mock('../../services/episodes', () => ({
   EpisodeService: { getEpisodes: vi.fn().mockResolvedValue({ info: { count: 0, pages: 1, next: null, prev: null }, results: [] }) },
}));
vi.mock('../../services/locations', () => ({
   LocationService: { getLocations: vi.fn().mockResolvedValue({ info: { count: 0, pages: 1, next: null, prev: null }, results: [] }) },
}));

vi.mock('../../components/donations/lazyDonationModal', async () => {
   const { DonationModal } = await import('../../components/donations/DonationModal');
   return {
      LazyDonationModal: DonationModal,
      preloadDonationModal: vi.fn(),
   };
});
import { AppShell } from '../../components/layout/AppShell';
import { AboutPage } from '../../pages/AboutPage';
import { EpisodesPage } from '../../pages/EpisodesPage';
import { HomePage } from '../../pages/HomePage';
import { LocationsPage } from '../../pages/LocationsPage';
import { RpgCharacterCreationPage } from '../../pages/RpgCharacterCreationPage';
import { TestProviders } from '../TestProviders';

function renderShell(initialPath: string) {
   return render(
      <TestProviders>
         <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
               <Route path="/" element={<AppShell />}>
                  <Route path="characters" element={<HomePage />} />
                  <Route path="episodes" element={<EpisodesPage />} />
                  <Route path="locations" element={<LocationsPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="rpg" element={<RpgCharacterCreationPage />} />
               </Route>
            </Routes>
         </MemoryRouter>
      </TestProviders>,
   );
}

describe('AppNavbar', () => {
   it('renders main nav links', () => {
      renderShell('/characters');
      expect(screen.getByRole('link', { name: i18n.t('nav.about') })).toHaveAttribute('href', '/about');
      expect(screen.getByRole('link', { name: i18n.t('nav.characters') })).toHaveAttribute(
         'href',
         '/characters',
      );
      expect(screen.getByRole('link', { name: i18n.t('nav.episodes') })).toHaveAttribute(
         'href',
         '/episodes',
      );
      expect(screen.getByRole('link', { name: i18n.t('nav.locations') })).toHaveAttribute(
         'href',
         '/locations',
      );
      expect(screen.getByRole('link', { name: i18n.t('nav.rpg') })).toHaveAttribute('href', '/rpg');
      expect(screen.getByRole('button', { name: i18n.t('nav.support') })).toBeInTheDocument();
   });

   it('opens donation modal when support button is clicked', () => {
      renderShell('/characters');

      fireEvent.click(screen.getByRole('button', { name: i18n.t('nav.support') }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(i18n.t('donations.disclaimerTitle'))).toBeInTheDocument();
   });

   it('marks the characters tab active on /characters', () => {
      renderShell('/characters');
      const chars = screen.getByRole('link', { name: i18n.t('nav.characters') });
      expect(chars.className).toMatch(/border-primary/);
   });

   it('marks the about tab active on /about', () => {
      renderShell('/about');
      const about = screen.getByRole('link', { name: i18n.t('nav.about') });
      expect(about.className).toMatch(/border-primary/);
   });

   it('marks the episodes tab active on /episodes', () => {
      renderShell('/episodes');
      const episodes = screen.getByRole('link', { name: i18n.t('nav.episodes') });
      expect(episodes.className).toMatch(/border-primary/);
   });

   it('marks the rpg tab active on /rpg', () => {
      renderShell('/rpg');
      const rpg = screen.getByRole('link', { name: i18n.t('nav.rpg') });
      expect(rpg.className).toMatch(/border-primary/);
   });

   it('renders language switcher with accessible flag buttons', () => {
      renderShell('/characters');
      expect(
         screen.getByRole('button', { name: /Mudar idioma para português/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mudar idioma para inglês/i })).toBeInTheDocument();
      expect(
         screen.getByRole('button', { name: i18n.t('language.switchToEs') }),
      ).toBeInTheDocument();
   });
});
