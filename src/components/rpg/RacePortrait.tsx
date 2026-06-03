import clsx from 'clsx';
import { useState } from 'react';
import type { RaceDefinition } from './types';

export function RacePortrait({
   race,
   imageAlt,
   imgClassName,
   portraitUrl,
}: {
   race: RaceDefinition;
   imageAlt: string;
   imgClassName: string;
   portraitUrl?: string;
}) {
   const [failedSrc, setFailedSrc] = useState<string | null>(null);
   const resolvedSrc = portraitUrl ?? race.portraitUrl;

   if (failedSrc === resolvedSrc) {
      return (
         <div className={clsx('h-full w-full', race.cardClass)} role="img" aria-label={imageAlt} />
      );
   }

   return (
      <img
         src={resolvedSrc}
         alt={imageAlt}
         className={imgClassName}
         loading="lazy"
         decoding="async"
         referrerPolicy="no-referrer"
         onError={() => setFailedSrc(resolvedSrc)}
      />
   );
}
