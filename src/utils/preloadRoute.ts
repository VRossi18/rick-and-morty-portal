export const routePreloaders = {
   about: () => import('../pages/AboutPage'),
   characters: () => import('../pages/HomePage'),
   episodes: () => import('../pages/EpisodesPage'),
   locations: () => import('../pages/LocationsPage'),
   rpg: () => import('../pages/RpgCharacterCreationPage'),
} as const;

export type PreloadableRoute = keyof typeof routePreloaders;

export function preloadRoute(route: PreloadableRoute) {
   void routePreloaders[route]();
}
