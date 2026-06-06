import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Episode } from '../../types/api';

interface EpisodeDetailLinkProps {
   episode: Episode;
}

function EpisodeDetailLinkInner({ episode }: EpisodeDetailLinkProps) {
   return (
      <li className="episode-detail-link-item h-full">
         <Link
            to={`/episode/${episode.id}`}
            className="glow-card episode-detail-link-card flex h-full min-h-[5.75rem] flex-col gap-1 p-4 outline-none ring-primary focus-visible:ring-2"
         >
            <span className="relative z-[1] shrink-0 font-mono text-xs font-bold text-primary">
               {episode.episode}
            </span>
            <span className="relative z-[1] line-clamp-2 min-h-[2.5rem] flex-1 font-semibold leading-snug text-foreground">
               {episode.name}
            </span>
         </Link>
      </li>
   );
}

export const EpisodeDetailLink = memo(EpisodeDetailLinkInner);
