import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { EpisodeCuriosityPanel } from '../../components/episodes/EpisodeCuriosityPanel';

const aiMocks = vi.hoisted(() => ({
   isConfigured: true,
}));

vi.mock('../../config/ai', async (importOriginal) => {
   const actual = await importOriginal<typeof import('../../config/ai')>();
   return {
      ...actual,
      get isEpisodeAiCuriosityConfigured() {
         return aiMocks.isConfigured;
      },
      resolveEpisodeCuriosityUrl: () =>
         aiMocks.isConfigured ? 'http://localhost:8080/api/ai/episode-curiosity' : null,
   };
});

describe('EpisodeCuriosityPanel', () => {
   beforeEach(() => {
      aiMocks.isConfigured = true;
      vi.stubGlobal('fetch', vi.fn());
   });

   it('shows not configured message when AI URL is missing', () => {
      aiMocks.isConfigured = false;
      render(<EpisodeCuriosityPanel episodeId={1} />);
      expect(screen.getByText(i18n.t('episodeDetail.curiosity.notConfigured'))).toBeInTheDocument();
   });

   it('loads initial curiosity on mount', async () => {
      vi.mocked(fetch).mockResolvedValue({
         ok: true,
         json: async () => ({ text: 'The pilot introduces Rick and Morty.' }),
      } as Response);

      render(<EpisodeCuriosityPanel episodeId={1} />);

      expect(
         await screen.findByText('The pilot introduces Rick and Morty.'),
      ).toBeInTheDocument();
   });

   it('sends follow-up question', async () => {
      vi.mocked(fetch)
         .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ text: 'Initial fact' }),
         } as Response)
         .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ text: 'Rick Sanchez and Morty Smith appear.' }),
         } as Response);

      render(<EpisodeCuriosityPanel episodeId={1} />);
      expect(await screen.findByText('Initial fact')).toBeInTheDocument();

      fireEvent.change(
         screen.getByPlaceholderText(i18n.t('episodeDetail.curiosity.askPlaceholder')),
         { target: { value: 'Who appears?' } },
      );
      fireEvent.click(screen.getByRole('button', { name: i18n.t('episodeDetail.curiosity.askButton') }));

      await waitFor(() => {
         expect(screen.getByText('Rick Sanchez and Morty Smith appear.')).toBeInTheDocument();
      });
   });
});
