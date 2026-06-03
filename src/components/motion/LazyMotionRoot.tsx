import { domAnimation, LazyMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function LazyMotionRoot({ children }: { children: ReactNode }) {
   return (
      <LazyMotion features={domAnimation} strict>
         {children}
      </LazyMotion>
   );
}
