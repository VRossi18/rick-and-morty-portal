import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { CharacterCuriosityPanel } from '../../components/characters/CharacterCuriosityPanel';
import { TestQueryProvider } from '../TestQueryProvider';

function renderPanel(characterId: number) {
   return render(
      <TestQueryProvider>
         <CharacterCuriosityPanel characterId={characterId} />
      </TestQueryProvider>,
   );
}

const aiMocks = vi.hoisted(() => ({
   isConfigured: true,
}));

vi.mock('../../config/ai', async (importOriginal) => {
   const actual = await importOriginal<typeof import('../../config/ai')>();
   return {
      ...actual,
      get isAiCuriosityConfigured() {
         return aiMocks.isConfigured;
      },
      resolveAiApiUrl: () =>
         aiMocks.isConfigured ? 'http://localhost:8080/api/ai/character-curiosity' : null,
   };
});

describe('CharacterCuriosityPanel', () => {
   beforeEach(() => {
      aiMocks.isConfigured = true;
      vi.stubGlobal('fetch', vi.fn());
   });

   it('shows not configured message when AI URL is missing', () => {
      aiMocks.isConfigured = false;
      renderPanel(2);
      expect(screen.getByText(i18n.t('characterDetail.curiosity.notConfigured'))).toBeInTheDocument();
   });

   it('loads initial curiosity on mount', async () => {
      vi.mocked(fetch).mockResolvedValue({
         ok: true,
         json: async () => ({ text: 'Morty is Rick\'s anxious grandson.' }),
      } as Response);

      renderPanel(2);

      expect(await screen.findByText("Morty is Rick's anxious grandson.")).toBeInTheDocument();
   });

   it('repopulates field after asking a question', async () => {
      vi.mocked(fetch)
         .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ text: 'Initial fact' }),
         } as Response)
         .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ text: 'Because Rick drags him into adventures.' }),
         } as Response);

      renderPanel(2);
      expect(await screen.findByText('Initial fact')).toBeInTheDocument();

      fireEvent.change(
         screen.getByPlaceholderText(i18n.t('characterDetail.curiosity.askPlaceholder')),
         { target: { value: 'Why does he follow Rick?' } },
      );
      fireEvent.click(screen.getByRole('button', { name: i18n.t('characterDetail.curiosity.askButton') }));

      await waitFor(() => {
         expect(screen.getByText('Because Rick drags him into adventures.')).toBeInTheDocument();
      });
   });
});
