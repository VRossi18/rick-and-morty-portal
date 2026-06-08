import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { lazyPage } from './utils/lazyPage';
import { lazyRoute } from './utils/lazyRoute';

const HomePage = lazyPage(() => import('./pages/HomePage'), 'HomePage');
const AboutPage = lazyPage(() => import('./pages/AboutPage'), 'AboutPage');
const CharacterDetailPage = lazyPage(
   () => import('./pages/CharacterDetailPage'),
   'CharacterDetailPage',
);
const EpisodesPage = lazyPage(() => import('./pages/EpisodesPage'), 'EpisodesPage');
const EpisodeDetailPage = lazyPage(
   () => import('./pages/EpisodeDetailPage'),
   'EpisodeDetailPage',
);
const LocationsPage = lazyPage(() => import('./pages/LocationsPage'), 'LocationsPage');
const LocationDetailPage = lazyPage(
   () => import('./pages/LocationDetailPage'),
   'LocationDetailPage',
);
const NotFoundPage = lazyPage(() => import('./pages/NotFoundPage'), 'NotFoundPage');
const RpgCharacterCreationPage = lazyPage(
   () => import('./pages/RpgCharacterCreationPage'),
   'RpgCharacterCreationPage',
);
const RpgGamePage = lazyPage(() => import('./pages/RpgGamePage'), 'RpgGamePage');

export default function App() {
   const location = useLocation();

   return (
      <AnimatePresence mode="popLayout" initial={false}>
         <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AppShell />}>
               <Route index element={<Navigate to="/characters" replace />} />
               <Route path="characters" element={lazyRoute(HomePage)} />
               <Route path="episodes" element={lazyRoute(EpisodesPage)} />
               <Route path="locations" element={lazyRoute(LocationsPage)} />
               <Route path="about" element={lazyRoute(AboutPage)} />
               <Route path="rpg" element={lazyRoute(RpgCharacterCreationPage)} />
               <Route path="rpg/play" element={lazyRoute(RpgGamePage)} />
               <Route path="character/:id" element={lazyRoute(CharacterDetailPage)} />
               <Route path="episode/:id" element={lazyRoute(EpisodeDetailPage)} />
               <Route path="location/:id" element={lazyRoute(LocationDetailPage)} />
               <Route path="*" element={lazyRoute(NotFoundPage)} />
            </Route>
         </Routes>
      </AnimatePresence>
   );
}
