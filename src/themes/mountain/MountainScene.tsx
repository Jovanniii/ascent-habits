/**
 * Panorama provisoire d'une habitude : formes SVG simples, purement décoratives
 * (aria-hidden). Les informations utiles sont données en texte par l'interface.
 */
import { useId, type CSSProperties } from 'react'
import { useDayPeriod } from '../ambiance.ts'
import type { HabitSceneProps } from '../types.ts'
import {
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  mountainPath,
  pointAlong,
  snowCapPath,
  trailPath,
  trailPoints,
} from './geometry.ts'
import { lightFor, paletteFor, paletteStyle } from './scene/palettes.ts'
import { starField } from './scene/panoramaGeometry.ts'
import { climberAssetFor, poseFor } from './scene/poses.ts'
import { Camp, Climber, Flame, Range, SummitFlag } from './scene/shapes.tsx'
import { Clouds, Stars } from './scene/Sky.tsx'

// Partagés avec les autres scènes du thème (sommet d'objectif).
export { Climber } from './scene/shapes.tsx'
export type { Pose } from './scene/poses.ts'

/** Décalage des boucles de respiration d'une habitude à l'autre (une seule animation à la fois). */
const BREATH_OFFSET_MS = 700

/** Ciel du jour : étoiles visibles seulement le soir et la nuit, un nuage immobile. */
const STARS = starField(18, VIEWBOX_WIDTH, 40, 0)
const CLOUDS = [{ x: 64, y: 16, scale: 0.7 }]

export function MountainScene({ progress, gesture, motionAllowed, index }: HabitSceneProps) {
  const gradientId = useId()
  const period = useDayPeriod()
  const light = lightFor(period)
  const trail = trailPoints(progress.cycle)
  const climberAt = pointAlong(trail, progress.position)
  const pose = poseFor(progress)
  const summit = trail[trail.length - 1]!
  const summitReached = progress.stages.at(-1)?.reached ?? false

  return (
    <svg
      className="mountain-scene"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
      data-motion={motionAllowed ? 'on' : 'off'}
      data-state={progress.state}
      data-cycle={progress.cycle}
      data-decor={progress.decorTier?.id ?? 'none'}
      data-ambiance={period}
      style={paletteStyle(paletteFor(period))}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={VIEWBOX_HEIGHT}>
          <stop offset="0" className="mountain-scene__sky-top" />
          <stop offset="1" className="mountain-scene__sky-bottom" />
        </linearGradient>
      </defs>
      {/* Le ciel et les plans lointains débordent du cadre pour remplir les écrans larges. */}
      <rect x="-480" y="-120" width={VIEWBOX_WIDTH + 960} height={VIEWBOX_HEIGHT + 120} fill={`url(#${gradientId})`} />
      {/* Ciel immobile ici : la vie du ciel (nuages, scintillement) est réservée au panorama. */}
      <Stars stars={STARS} />
      <Clouds clouds={CLOUDS} />
      {/* Plans de montagnes, du plus lointain au plus proche. */}
      <Range depth={1} light={light} />
      <Range depth={2} light={light} />
      <path d={mountainPath(progress.cycle)} className="mountain-scene__near" />
      <path d={snowCapPath(progress.cycle)} className="mountain-scene__snow" />
      <path d={trailPath(trail)} className="mountain-scene__trail" />

      {/* Départ (camp de base) et étapes du cycle. */}
      {[{ at: 0, days: 0, reached: true }, ...progress.stages.filter((stage) => stage.at < 1)].map((stage) => {
        const at = pointAlong(trail, stage.at)
        return (
          <g key={stage.days} transform={`translate(${at.x} ${at.y})`}>
            <Camp reached={stage.reached} />
          </g>
        )
      })}
      {/* Drapeau du sommet, en couleur d'accent. */}
      <g transform={`translate(${summit.x} ${summit.y - 1})`}>
        <SummitFlag reached={summitReached} />
      </g>

      {/* Alpiniste : un groupe pour la position, un autre pour le geste et la respiration. */}
      <g
        className="mountain-scene__position"
        data-animate={gesture ? 'true' : 'false'}
        style={{ transform: `translate(${climberAt.x}px, ${climberAt.y}px)` }}
      >
        {progress.intensity > 0 && pose !== 'tent' && <Flame intensity={progress.intensity as 1 | 2} />}
        <g
          key={gesture?.id ?? 'idle'}
          className="mountain-scene__climber"
          data-gesture={gesture?.kind ?? 'none'}
          // Variable CSS lue seulement par la respiration : un animation-delay posé ici
          // décalerait aussi les animations de geste, qui seraient alors invisibles.
          style={{ '--mountain-breath-delay': `${-(index % 6) * BREATH_OFFSET_MS}ms` } as CSSProperties}
        >
          <Climber pose={pose} asset={climberAssetFor(progress)} />
        </g>
      </g>
    </svg>
  )
}
