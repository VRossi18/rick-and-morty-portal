import { m } from 'framer-motion';
import type { ReactNode } from 'react';

export function PageMotionShell({ children }: { children: ReactNode }) {
   return (
      <m.div
         className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.28, ease: 'easeOut' }}
      >
         {children}
      </m.div>
   );
}
