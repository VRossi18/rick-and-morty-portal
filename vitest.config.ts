import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
   viteConfig,
   defineConfig({
      test: {
         projects: [
            {
               test: {
                  name: 'frontend',
                  environment: 'jsdom',
                  setupFiles: ['./src/tests/setup.ts'],
                  include: ['src/tests/**/*.{test,spec}.{ts,tsx}'],
               },
            },
            {
               test: {
                  name: 'scripts',
                  environment: 'node',
                  include: ['scripts/**/*.test.mjs'],
               },
            },
         ],
      },
   }),
);
