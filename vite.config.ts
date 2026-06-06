import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const GITHUB_PAGES_BASE = '/rick-and-morty-portal/';

/** GitHub Pages uses the repo subpath; local dev uses `/`. */
const productionBase = process.env.VITE_BASE ?? GITHUB_PAGES_BASE;

export default defineConfig({
   base: process.env.NODE_ENV === 'production' ? productionBase : '/',
   plugins: [react(), tailwindcss()],
   server: {
      proxy: {
         '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
         },
      },
   },
});
