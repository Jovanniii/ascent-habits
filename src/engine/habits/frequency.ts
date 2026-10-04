/**
 * Effet d'un changement de fréquence.
 *
 * La nouvelle fréquence s'applique à tout l'historique : la série affichée peut
 * donc changer. Cette fonction permet à l'interface de le montrer avant de confirmer.
 */
import type { LocalDate } from '../dates.ts'
import type { Completion, Frequency, Habit } from '../model.ts'
import { computeStreak, type StreakSummary } from './streak.ts'

export function sameFrequency(a: Frequency, b: Frequency): boolean {
  if (a.type === 'daily' || b.type === 'daily') {
    return a.type === b.type
  }
  return a.days.length === b.days.length && a.days.every((day, index) => day === b.days[index])
}

export interface FrequencyChangePreview {
  before: StreakSummary
  after: StreakSummary
  /** Vrai si la série en cours affichée change. */
  currentStreakChanges: boolean
}

export function previewFrequencyChange(
  habit: Habit,
  completions: readonly Completion[],
  frequency: Frequency,
  today: LocalDate,
): FrequencyChangePreview {
  const before = computeStreak(habit, completions, today)
  const after = computeStreak({ ...habit, frequency }, completions, today)
  return { before, after, currentStreakChanges: before.current !== after.current }
}
