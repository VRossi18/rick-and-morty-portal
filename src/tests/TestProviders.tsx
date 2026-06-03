import type { ReactNode } from 'react';
import { LazyMotionRoot } from '../components/motion/LazyMotionRoot';
import { TestQueryProvider } from './TestQueryProvider';

export function TestProviders({ children }: { children: ReactNode }) {
   return (
      <TestQueryProvider>
         <LazyMotionRoot>{children}</LazyMotionRoot>
      </TestQueryProvider>
   );
}
