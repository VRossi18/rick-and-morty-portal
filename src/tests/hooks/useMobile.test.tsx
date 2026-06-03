import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '../../hooks/useMobile';

function stubViewport(width: number) {
   Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: width,
   });
   const mql = {
      matches: width < 768,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
   } as unknown as MediaQueryList;
   const matchMedia = vi.fn(() => mql);
   Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMedia,
   });
   return matchMedia;
}

describe('useIsMobile', () => {
   afterEach(() => {
      vi.restoreAllMocks();
   });

   it('returns true when innerWidth is below the breakpoint', async () => {
      stubViewport(500);
      const { result } = renderHook(() => useIsMobile());
      await waitFor(() => {
         expect(result.current).toBe(true);
      });
   });

   it('subscribes to matchMedia for the mobile query', () => {
      const matchMedia = stubViewport(1024);
      renderHook(() => useIsMobile());
      expect(matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
   });
});
