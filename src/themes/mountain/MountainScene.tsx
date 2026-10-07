/**
 * Panorama provisoire d'une habitude : formes SVG simples, purement décoratives
 * (aria-hidden). Les informations utiles sont données en texte par l'interface.
 */
import { useId, type CSSProperties } from 'react'
import type { HabitSceneProps } from '../types.ts'
import {
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  mountainPath,
  pointAlong,
  snowCapPath,
  trailPath,
  trailPoints,
  type Point,
} from './geometry.ts'

/** Pose de l'alpiniste selon l'état neutre de progression. */
export type Pose = 'rest' | 'walk' | 'bivouac' | 'tent' | 'celebrate'

const POSES: Record<HabitSceneProps['progress']['state'], Pose> = {
  idle: 'rest',
  done: 'walk',
  recoverable: 'bivouac',
  missed: 'tent',
  celebrating: 'celebrate',
}

/** Chaînes lointaines, prolongées de part et d'autre du cadre. */
const FAR_RANGE =
  'M-480 76 L-480 38 Q-420 24 -360 36 Q-300 22 -240 34 Q-180 20 -120 34 Q-60 22 0 38 Q30 24 64 36 Q100 20 140 34 Q186 18 232 32 Q276 22 320 34 Q380 22 440 36 Q520 20 600 34 Q680 24 800 36 L800 76 Z'
const MID_RANGE =
  'M-480 76 L-480 54 Q-400 40 -320 52 Q-240 40 -160 54 Q-80 42 0 54 Q36 40 76 52 Q112 42 150 54 Q200 46 250 56 Q290 48 320 58 Q400 44 480 54 Q560 42 640 54 Q720 44 800 54 L800 76 Z'

/** Décalage des boucles de respiration d'une habitude à l'autre (une seule animation à la fois). */
const BREATH_OFFSET_MS = 700

function Camp({ at, reached }: { at: Point; reached: boolean }) {
  return (
    <g className={`mountain-scene__camp${reached ? ' is-reached' : ''}`} transform={`translate(${at.x} ${at.y})`}>
      <path d="M-4 0 Q-2 -5 0 -6 Q2 -5 4 0 Z" className="mountain-scene__tent" />
      <rect x="3.4" y="-11" width="0.9" height="11" rx="0.4" className="mountain-scene__pole" />
      <path d="M4.3 -11 L8.5 -9.6 L4.3 -8.2 Z" className="mountain-scene__pennant" />
    </g>
  )
}

function Flame({ intensity }: { intensity: 1 | 2 }) {
  const scale = intensity === 2 ? 1.35 : 1
  return (
    <g className="mountain-scene__flame" transform={`translate(-11 0) scale(${scale})`}>
      <ellipse cx="0" cy="-3.8" rx="3.4" ry="4.4" className="mountain-scene__halo" />
      <path d="M0 -7.5 Q2.6 -4.4 1.8 -2 Q1 -0.4 0 -0.4 Q-1 -0.4 -1.8 -2 Q-2.4 -4 0 -7.5 Z" className="mountain-scene__accent" />
    </g>
  )
}

export function Climber({ pose }: { pose: Pose }) {
  if (pose === 'tent') {
    // Au repos à la tente : rien d'un échec, simplement une pause.
    return (
      <g className="mountain-scene__resting">
        <ellipse cx="0" cy="-4" rx="7" ry="6" className="mountain-scene__halo" />
        <path d="M-6 0 Q-3 -8 0 -9 Q3 -8 6 0 Z" className="mountain-scene__tent is-reached" />
        <circle cx="0" cy="-2.6" r="1.6" className="mountain-scene__accent" />
      </g>
    )
  }
  const sitting = pose === 'bivouac'
  return (
    <g className={`mountain-scene__body is-${pose}`}>
      <ellipse cx="0" cy={sitting ? -4.5 : -6.8} rx="3.8" ry={sitting ? 5.5 : 7.6} className="mountain-scene__halo" />
      {pose === 'bivouac' && <path d="M2 -3 Q8 -6 12 -12" className="mountain-scene__rope" />}
      <rect
        x="-1.8"
        y={sitting ? -6 : -10}
        width="3.6"
        height={sitting ? 5 : 8}
        rx="1.6"
        className="mountain-scene__accent"
        transform={pose === 'walk' ? 'rotate(12 0 0)' : undefined}
      />
      <circle cx={pose === 'walk' ? 1.6 : 0} cy={sitting ? -7.8 : -11.6} r="1.9" className="mountain-scene__accent" />
      {pose === 'celebrate' && (
        <>
          <rect x="-3.6" y="-15" width="1.1" height="5" rx="0.5" className="mountain-scene__accent" />
          <rect x="2.5" y="-15" width="1.1" height="5" rx="0.5" className="mountain-scene__accent" />
        </>
      )}
    </g>
  )
}

export function MountainScene({ progress, gesture, motionAllowed, index }: HabitSceneProps) {
  const gradientId = useId()
  const trail = trailPoints(progress.cycle)
  const climberAt = pointAlong(trail, progress.position)
  const pose = POSES[progress.state]
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
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={VIEWBOX_HEIGHT}>
          <stop offset="0" className="mountain-scene__sky-top" />
          <stop offset="1" className="mountain-scene__sky-bottom" />
        </linearGradient>
      </defs>
      {/* Le ciel et les plans lointains débordent du cadre pour remplir les écrans larges. */}
      <rect x="-480" y="-120" width={VIEWBOX_WIDTH + 960} height={VIEWBOX_HEIGHT + 120} fill={`url(#${gradientId})`} />
      {/* Plans de montagnes, du plus lointain au plus proche. */}
      <path d={FAR_RANGE} className="mountain-scene__far" />
      <path d={MID_RANGE} className="mountain-scene__mid" />
      <path d={mountainPath(progress.cycle)} className="mountain-scene__near" />
      <path d={snowCapPath(progress.cycle)} className="mountain-scene__snow" />
      <path d={trailPath(trail)} className="mountain-scene__trail" />

      {/* Départ (camp de base) et étapes du cycle. */}
      <Camp at={trail[0]!} reached />
      {progress.stages
        .filter((stage) => stage.at < 1)
        .map((stage) => (
          <Camp key={stage.days} at={pointAlong(trail, stage.at)} reached={stage.reached} />
        ))}
      {/* Drapeau du sommet, en couleur d'accent. */}
      <g transform={`translate(${summit.x} ${summit.y - 1})`} className={summitReached ? 'is-reached' : undefined}>
        <ellipse cx="4.6" cy="-6.6" rx="6" ry="3.8" className="mountain-scene__halo" />
        <rect x="-0.5" y="-9" width="1" height="9" rx="0.5" className="mountain-scene__pole" />
        <path d="M0.5 -9 L9 -6.6 L0.5 -4.2 Z" className="mountain-scene__summit-flag" />
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
          <Climber pose={pose} />
        </g>
      </g>
    </svg>
  )
}
