import { AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RouteFallback } from './components/layout/RouteFallback';
import { lazyPage } from './utils/lazyPage';

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
               <Route
                  path="characters"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <HomePage />
                     </Suspense>
                  }
               />
               <Route
                  path="episodes"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <EpisodesPage />
                     </Suspense>
                  }
               />
               <Route
                  path="locations"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <LocationsPage />
                     </Suspense>
                  }
               />
               <Route
                  path="about"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <AboutPage />
                     </Suspense>
                  }
               />
               <Route
                  path="rpg"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <RpgCharacterCreationPage />
                     </Suspense>
                  }
               />
               <Route
                  path="rpg/play"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <RpgGamePage />
                     </Suspense>
                  }
               />
               <Route
                  path="character/:id"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <CharacterDetailPage />
                     </Suspense>
                  }
               />
               <Route
                  path="episode/:id"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <EpisodeDetailPage />
                     </Suspense>
                  }
               />
               <Route
                  path="location/:id"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <LocationDetailPage />
                     </Suspense>
                  }
               />
               <Route
                  path="*"
                  element={
                     <Suspense fallback={<RouteFallback />}>
                        <NotFoundPage />
                     </Suspense>
                  }
               />
            </Route>
         </Routes>
      </AnimatePresence>
   );
}
