/**
 * Traduit les données neutres du grand décor (habitudes, objectifs) en cordées :
 * une voie, un alpiniste, ses drapeaux. Fonctions pures, testées.
 *
 * - Habitude : l'alpiniste est à `progress.position` sur sa voie ; les drapeaux
 *   sont les paliers du cycle affiché (D17, journal de décisions).
 * - Objectif : mêmes règles que la scène d'un objectif (P4-D2) : le jalon n° k est
 *   toujours au même point de la voie, l'alpiniste ne recule jamais quand on
 *   ajoute un jalon ; un objectif atteint place l'alpiniste au sommet.
 */
import type { StreakTierId } from '../../../../engine/index.ts'
import type { SceneGoal, SceneHabit } from '../../../types.ts'
import { goalLayout } from '../../goals/geometry.ts'

export interface TrackMark {
  /** Position sur la voie, entre 0 et 1. */
  at: number
  reached: boolean
  label: string
}

export interface Track {
  id: string
  kind: 'habit' | 'goal'
  label: string
  /** Couleur de la veste de l'alpiniste et des drapeaux atteints. */
  color: string
  /** Position visée sur la voie, entre 0 et 1. */
  target: number
  marks: TrackMark[]
  /** L'alpiniste se repose (jour manqué, habitude en pause) : aucun reproche, une pause. */
  resting: boolean
  /** Un palier vient d'être atteint grâce à la coche du jour. */
  celebrating: boolean
}

/** Couleurs des cordées, chaudes et distinctes ; au-delà, elles se répètent. */
export const TRACK_COLORS: readonly string[] = [
  '#d9573b',
  '#2e8c86',
  '#e3ad35',
  '#7b62c9',
  '#3f7f9a',
  '#c45a8c',
  '#6b8f4e',
  '#e07a5f',
]

const TIER_LABELS: Readonly<Record<StreakTierId, string>> = {
  days21: '21 j',
  months2: '2 mois',
  months6: '6 mois',
  year1: '1 an',
}

/** Libellé court d'un palier, sur son drapeau. */
export function stageLabel(stage: { tierId: StreakTierId | null; days: number }): string {
  if (stage.tierId) return TIER_LABELS[stage.tierId]
  const years = Math.round(stage.days / 365)
  return years > 1 ? `${years} ans` : `${stage.days} j`
}

export function habitTrack(habit: SceneHabit, index: number): Track {
  const { progress } = habit
  return {
    id: habit.id,
    kind: 'habit',
    label: habit.label,
    color: TRACK_COLORS[index % TRACK_COLORS.length]!,
    target: progress.position,
    marks: progress.stages
      .filter((stage) => stage.at < 1)
      .map((stage) => ({ at: stage.at, reached: stage.reached, label: stageLabel(stage) })),
    resting: habit.paused || progress.state === 'missed',
    celebrating: progress.state === 'celebrating',
  }
}

export function goalTrack(goal: SceneGoal, index: number): Track {
  const layout = goalLayout({ done: goal.progress.done, total: goal.progress.total, achieved: goal.achieved })
  return {
    id: goal.id,
    kind: 'goal',
    label: goal.label,
    color: TRACK_COLORS[index % TRACK_COLORS.length]!,
    target: goal.achieved ? 1 : layout.climber,
    marks: layout.pennants.map((pennant, k) => ({ at: pennant.at, reached: pennant.planted, label: `Jalon ${k + 1}` })),
    resting: false,
    celebrating: false,
  }
}

/** Toutes les cordées : les habitudes d'abord, puis les objectifs. */
export function buildTracks(habits: readonly SceneHabit[], goals: readonly SceneGoal[]): Track[] {
  return [
    ...habits.map((habit, index) => habitTrack(habit, index)),
    ...goals.map((goal, index) => goalTrack(goal, habits.length + index)),
  ]
}

/** Nom raccourci affiché sur la plaque d'un alpiniste (le nom complet reste dans l'interface). */
export function shortLabel(label: string, max = 14): string {
  const trimmed = label.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed
}
