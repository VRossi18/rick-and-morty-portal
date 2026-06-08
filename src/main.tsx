import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LazyMotionRoot } from './components/motion/LazyMotionRoot';
import { initI18n } from './i18n';
import './index.css';
import './styles/not-found.css';
import App from './App.tsx';
import { QueryProvider } from './providers/QueryProvider';

async function bootstrap() {
   await initI18n();

   createRoot(document.getElementById('root')!).render(
      <StrictMode>
         <QueryProvider>
            <LazyMotionRoot>
               {/* basename: mesmo path do Vite (import.meta.env.BASE_URL) para GitHub Pages em subpasta */}
               <BrowserRouter basename={import.meta.env.BASE_URL}>
                  <App />
               </BrowserRouter>
            </LazyMotionRoot>
         </QueryProvider>
      </StrictMode>,
   );
}

void bootstrap();
