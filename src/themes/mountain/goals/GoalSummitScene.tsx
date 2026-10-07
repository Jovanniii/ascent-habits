/**
 * Scène provisoire d'un objectif : un grand sommet lointain avec son drapeau,
 * des fanions pour les jalons et l'alpiniste qui s'en rapproche. Purement
 * décorative (aria-hidden) : progression, jalons et actions sont donnés en
 * texte et en boutons par l'interface.
 */
import { useId } from 'react'
import { useDayPeriod } from '../../ambiance.ts'
import type { GoalSceneProps } from '../../types.ts'
import { Climber, type Pose } from '../MountainScene.tsx'
import {
  GOAL_TRAIL,
  GOAL_VIEWBOX_HEIGHT,
  GOAL_VIEWBOX_WIDTH,
  goalLayout,
  pathData,
  pointOnTrail,
  summitPath,
  summitSnowPath,
  walk,
} from './geometry.ts'
import { paletteFor, paletteStyle } from '../scene/palettes.ts'

/** Chaîne lointaine, prolongée de part et d'autre du cadre. */
const FAR_RANGE =
  'M-480 112 L-480 60 Q-400 44 -320 58 Q-240 42 -160 56 Q-80 44 0 58 Q40 40 90 54 Q140 38 190 50 Q240 34 290 46 Q340 36 400 50 Q520 38 640 52 Q720 42 800 54 L800 112 Z'

function Pennant({ x, y, planted }: { x: number; y: number; planted: boolean }) {
  return (
    <g className={`goal-summit__pennant${planted ? ' is-planted' : ''}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.4)`}>
      <rect x="-0.4" y="-8" width="0.8" height="8" rx="0.4" className="mountain-scene__pole" />
      <path d="M0.4 -8 L5.6 -6.6 L0.4 -5.2 Z" className="goal-summit__pennant-cloth" />
    </g>
  )
}

export function GoalSummitScene({ progress, achieved, celebrating, motionAllowed }: GoalSceneProps) {
  const gradientId = useId()
  const period = useDayPeriod()
  const layout = goalLayout({ done: progress.done, total: progress.total, achieved })
  const climberAt = pointOnTrail(layout.climber)
  const top = pointOnTrail(layout.summit)
  const trail = walk(GOAL_TRAIL, layout.summit).path
  const pose: Pose = achieved ? 'celebrate' : progress.done > 0 ? 'walk' : 'rest'

  return (
    <svg
      className="mountain-scene goal-summit"
      viewBox={`0 0 ${GOAL_VIEWBOX_WIDTH} ${GOAL_VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
      data-motion={motionAllowed ? 'on' : 'off'}
      data-celebrating={celebrating ? 'true' : 'false'}
      data-achieved={achieved ? 'true' : 'false'}
      data-climber={layout.climber.toFixed(4)}
      data-summit={layout.summit.toFixed(4)}
      data-ambiance={period}
      style={paletteStyle(paletteFor(period))}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={GOAL_VIEWBOX_HEIGHT}>
          <stop offset="0" className="mountain-scene__sky-top" />
          <stop offset="1" className="mountain-scene__sky-bottom" />
        </linearGradient>
      </defs>
      <rect x="-480" y="-120" width={GOAL_VIEWBOX_WIDTH + 960} height={GOAL_VIEWBOX_HEIGHT + 120} fill={`url(#${gradientId})`} />
      <path d={FAR_RANGE} className="mountain-scene__far" />
      <path d={summitPath(layout.summit)} className="mountain-scene__near" />
      <path d={summitSnowPath(layout.summit)} className="mountain-scene__snow" />
      <path d={pathData(trail)} className="mountain-scene__trail" />

      {/* Fanions des jalons : plantés pour les jalons terminés, simples piquets sinon. */}
      {layout.pennants.map((pennant, index) => {
        const at = pointOnTrail(pennant.at)
        return <Pennant key={index} x={at.x} y={at.y} planted={pennant.planted} />
      })}

      {/* Drapeau du sommet, en couleur d'accent. */}
      <g transform={`translate(${top.x.toFixed(1)} ${(top.y - 1).toFixed(1)})`}>
        <ellipse cx="4.6" cy="-6.6" rx="6" ry="3.8" className="mountain-scene__halo" />
        <rect x="-0.5" y="-9" width="1" height="9" rx="0.5" className="mountain-scene__pole" />
        <path d="M0.5 -9 L9 -6.6 L0.5 -4.2 Z" className="mountain-scene__summit-flag goal-summit__flag" />
      </g>

      {/* Alpiniste : un groupe pour la position (transition), un autre pour la célébration. */}
      <g className="goal-summit__position" style={{ transform: `translate(${climberAt.x}px, ${climberAt.y}px)` }}>
        <g className="goal-summit__climber">
          <Climber pose={pose} />
        </g>
        {celebrating && (
          <g className="goal-summit__sparkles">
            <circle cx="-9" cy="-16" r="1.4" />
            <circle cx="8" cy="-19" r="1.2" />
            <circle cx="12" cy="-10" r="1" />
            <circle cx="-12" cy="-7" r="1" />
          </g>
        )}
      </g>
    </svg>
  )
}
