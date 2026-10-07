/**
 * Vue panorama : toutes les montagnes côte à côte, chacune avec son alpiniste,
 * en lecture seule (Doc 01, « beau paysage »). Purement décorative (aria-hidden) :
 * l'interface donne les mêmes informations en texte, sous le panorama.
 *
 * Une seule animation d'ambiance à la fois : les nuages dérivent le matin, le
 * jour et le soir ; la nuit, ils s'immobilisent et quelques étoiles scintillent.
 * Les alpinistes restent immobiles. Le parallaxe suit le défilement de la rangée.
 */
import { useId, useRef, type CSSProperties } from 'react'
import { useDayPeriod } from '../../ambiance.ts'
import type { PanoramaHabit, PanoramaProps } from '../../types.ts'
import { pointAlong, trailPath } from '../geometry.ts'
import { lightFor, paletteFor, paletteStyle } from './palettes.ts'
import {
  LABEL_Y,
  PANORAMA_HEIGHT,
  TILE_WIDTH,
  rowWidth,
  starField,
  tileMountainPath,
  tileSnowCapPath,
  tileTrail,
  tileX,
} from './panoramaGeometry.ts'
import { climberAssetFor, poseFor } from './poses.ts'
import { Camp, Climber, Flame, Range, SummitFlag } from './shapes.tsx'
import { Clouds, Stars } from './Sky.tsx'
import { useParallax } from './useParallax.ts'

/** Ciel du panorama (repère 400 × 120, recadré selon la taille de l'écran). */
const SKY_WIDTH = 400
const SKY_STARS = starField(36, SKY_WIDTH, 70)
const SKY_CLOUDS = [
  { x: 70, y: 22, scale: 1 },
  { x: 230, y: 14, scale: 0.8 },
  { x: 340, y: 34, scale: 0.6 },
]

/** Longueur maximale du nom affiché sur la plaque (le nom complet est dans la liste). */
const LABEL_MAX = 14

function shortLabel(label: string): string {
  const trimmed = label.trim()
  return trimmed.length > LABEL_MAX ? `${trimmed.slice(0, LABEL_MAX - 1).trimEnd()}…` : trimmed
}

function PanoramaMountain({ habit, index }: { habit: PanoramaHabit; index: number }) {
  const { progress } = habit
  const x0 = tileX(index)
  const trail = tileTrail(x0, progress.cycle)
  const climberAt = pointAlong(trail, progress.position)
  const summit = trail[trail.length - 1]!
  const pose = poseFor(progress)
  const label = habit.label ? shortLabel(habit.label) : ''

  return (
    <g className="mountain-panorama__mountain" data-habit={habit.id} data-state={progress.state} data-cycle={progress.cycle}>
      <path d={tileMountainPath(x0, progress.cycle)} className="mountain-scene__near" />
      <path d={tileSnowCapPath(x0, progress.cycle)} className="mountain-scene__snow" />
      <path d={trailPath(trail)} className="mountain-scene__trail" />
      {[{ at: 0, days: 0, reached: true }, ...progress.stages.filter((stage) => stage.at < 1)].map((stage) => {
        const at = pointAlong(trail, stage.at)
        return (
          <g key={stage.days} transform={`translate(${at.x} ${at.y})`}>
            <Camp reached={stage.reached} />
          </g>
        )
      })}
      <g transform={`translate(${summit.x} ${summit.y - 1})`}>
        <SummitFlag reached={progress.stages.at(-1)?.reached ?? false} />
      </g>
      <g className="mountain-panorama__climber" transform={`translate(${climberAt.x} ${climberAt.y})`}>
        {progress.intensity > 0 && pose !== 'tent' && <Flame intensity={progress.intensity as 1 | 2} />}
        <Climber pose={pose} asset={climberAssetFor(progress)} />
      </g>
      {label && (
        <g className="mountain-panorama__label" transform={`translate(${x0 + TILE_WIDTH / 2} ${LABEL_Y})`}>
          <rect x={-label.length * 1.3 - 4} y={-3.4} width={label.length * 2.6 + 8} height={6.8} rx={3.4} />
          <text x="0" y="1.6" textAnchor="middle">
            {label}
          </text>
        </g>
      )}
    </g>
  )
}

export function Panorama({ habits, motionAllowed }: PanoramaProps) {
  const gradientId = useId()
  const period = useDayPeriod()
  const light = lightFor(period)
  const viewport = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  useParallax(viewport, scroller, motionAllowed)
  const width = rowWidth(habits.length)
  const night = period === 'night'

  return (
    <div
      ref={viewport}
      className="mountain-scene mountain-panorama"
      aria-hidden="true"
      data-motion={motionAllowed ? 'on' : 'off'}
      data-ambiance={period}
      style={paletteStyle(paletteFor(period))}
    >
      <svg className="mountain-panorama__sky" viewBox={`0 0 ${SKY_WIDTH} ${PANORAMA_HEIGHT}`} preserveAspectRatio="xMidYMin slice" focusable="false">
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={PANORAMA_HEIGHT}>
            <stop offset="0" className="mountain-scene__sky-top" />
            <stop offset="1" className="mountain-scene__sky-bottom" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={SKY_WIDTH} height={PANORAMA_HEIGHT} fill={`url(#${gradientId})`} />
        <Stars stars={SKY_STARS} twinkling={night} />
        <Clouds clouds={SKY_CLOUDS} drifting={!night} />
      </svg>
      {/* Plans lointains : l'illustration de 1280 × 120 est posée sur le bas du cadre. */}
      {([1, 2] as const).map((depth) => (
        <svg
          key={depth}
          className="mountain-panorama__plane"
          data-depth={depth}
          viewBox={`0 0 1280 ${PANORAMA_HEIGHT}`}
          preserveAspectRatio="xMinYMax slice"
          focusable="false"
        >
          <g transform={`translate(480 ${PANORAMA_HEIGHT - 76})`}>
            <Range depth={depth} light={light} />
          </g>
        </svg>
      ))}
      {/* tabIndex -1 : la rangée défile au doigt sans entrer dans l'ordre de tabulation (décor). */}
      <div ref={scroller} className="mountain-panorama__scroller" tabIndex={-1}>
        <svg
          className="mountain-panorama__row"
          viewBox={`0 0 ${width} ${PANORAMA_HEIGHT}`}
          // Assez large pour voir plusieurs montagnes ; au-delà de l'écran, la rangée défile.
          preserveAspectRatio="xMidYMax meet"
          style={{ '--panorama-count': habits.length } as CSSProperties}
          focusable="false"
        >
          {habits.map((habit, index) => (
            <PanoramaMountain key={habit.id} habit={habit} index={index} />
          ))}
        </svg>
      </div>
    </div>
  )
}
