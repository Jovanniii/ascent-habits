/**
 * Séries d'une habitude.
 *
 * - La série compte les jours prévus validés consécutifs (unité : validations).
 * - Aujourd'hui non validé est « en attente » : il ne casse jamais la série.
 * - Un jour prévu passé sans validation remet la série à zéro ; un rattrapage
 *   compte comme une validation.
 * - Une validation sur un jour non prévu n'a aucun effet.
 * - La durée d'une série (base des paliers) se mesure en jours calendaires, du
 *   premier au dernier jour validé, sans compter les jours de pause.
 */
import { addDays, type LocalDate } from '../dates.ts'
import type { Completion, Habit } from '../model.ts'
import { isPausedOn, matchesFrequency, validatedDates } from './schedule.ts'

/** État du jour courant pour l'habitude. */
export type TodayStatus = 'done' | 'pending' | 'unscheduled'

export interface StreakSummary {
  /** Série en cours, en nombre de validations. */
  current: number
  /** Durée de la série en cours, en jours (hors pause). */
  currentDurationDays: number
  /** Premier jour de la série en cours, null si elle est nulle. */
  currentStartedOn: LocalDate | null
  /** Plus longue série réalisée, en nombre de validations. */
  best: number
  /** Plus longue durée de série atteinte, en jours (hors pause). */
  bestDurationDays: number
  today: TodayStatus
}

interface Run {
  startedOn: LocalDate
  count: number
  durationDays: number
}

export function computeStreak(
  habit: Pick<Habit, 'id' | 'frequency' | 'createdOn' | 'pauses'>,
  completions: readonly Completion[],
  today: LocalDate,
): StreakSummary {
  const validated = validatedDates(habit.id, completions)
  let run: Run | null = null
  let best = 0
  let bestDurationDays = 0
  // Jours hors pause écoulés depuis la dernière validation de la série en cours.
  let daysSinceLastValidation = 0
  let todayStatus: TodayStatus = 'unscheduled'

  // Parcours chronologique depuis la création : un seul passage suffit pour la
  // série en cours comme pour la meilleure série.
  for (let day = habit.createdOn; day <= today; day = addDays(day, 1)) {
    const paused = isPausedOn(habit, day)
    const scheduled = !paused && matchesFrequency(habit.frequency, day)
    const isToday = day === today

    if (scheduled && validated.has(day)) {
      if (run) {
        run.count += 1
        run.durationDays += daysSinceLastValidation + 1
      } else {
        run = { startedOn: day, count: 1, durationDays: 1 }
      }
      daysSinceLastValidation = 0
      best = Math.max(best, run.count)
      bestDurationDays = Math.max(bestDurationDays, run.durationDays)
      if (isToday) todayStatus = 'done'
    } else if (scheduled && isToday) {
      todayStatus = 'pending'
    } else if (scheduled) {
      run = null
      daysSinceLastValidation = 0
    } else if (!paused) {
      daysSinceLastValidation += 1
    }
  }

  return {
    current: run?.count ?? 0,
    currentDurationDays: run?.durationDays ?? 0,
    currentStartedOn: run?.startedOn ?? null,
    best,
    bestDurationDays,
    today: todayStatus,
  }
}
