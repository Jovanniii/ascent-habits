/**
 * Vie discrète du ciel : quelques nuages et des étoiles. Leur visibilité suit la
 * palette (variables --mountain-cloud-opacity et --mountain-star-opacity) ; leur
 * mouvement n'existe que dans le bloc « opt-in » de mountain.css.
 */

import type { CloudSpec, StarSpec } from './panoramaGeometry.ts'

/** Silhouette arrondie d'un nuage, centrée sur (0, 0), environ 28 × 9 unités. */
const CLOUD_PATH = 'M-14 0 Q-14 -4 -9 -4 Q-7 -9 -1 -8 Q3 -11 7 -7 Q13 -8 13 -3 Q16 -1 14 0 Z'

export function Clouds({ clouds, drifting = false }: { clouds: readonly CloudSpec[]; drifting?: boolean }) {
  return (
    <g className="mountain-sky__clouds" data-drift={drifting ? 'true' : 'false'}>
      {clouds.map((cloud, index) => (
        <g key={index} transform={`translate(${cloud.x} ${cloud.y}) scale(${cloud.scale})`}>
          {/* Le mouvement est porté par un groupe intérieur : la position reste un attribut. */}
          <path d={CLOUD_PATH} className="mountain-sky__cloud" style={{ animationDelay: `${-index * 23}s` }} />
        </g>
      ))}
    </g>
  )
}

export function Stars({ stars, twinkling = false }: { stars: readonly StarSpec[]; twinkling?: boolean }) {
  return (
    <g className="mountain-sky__stars" data-twinkle={twinkling ? 'true' : 'false'}>
      {stars.map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          className={star.twinkle ? 'mountain-sky__star is-twinkling' : 'mountain-sky__star'}
          style={star.twinkle ? { animationDelay: `${-index * 1.3}s` } : undefined}
        />
      ))}
    </g>
  )
}
