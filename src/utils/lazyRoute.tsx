import { Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { RouteFallback } from '../components/layout/RouteFallback';

export function lazyRoute(Page: LazyExoticComponent<ComponentType>): ReactNode {
   return (
      <Suspense fallback={<RouteFallback />}>
         <Page />
      </Suspense>
   );
}
