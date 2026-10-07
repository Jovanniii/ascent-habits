import type { Completion, Habit, LocalDate } from '../engine/index.ts'
import { deriveHabitProgress } from '../themes/index.ts'
import { capitalize, formatMissedDay, formatStage } from './format.ts'

/** Message de célébration si la progression atteint une étape jamais atteinte. */
export function celebrationText(habit: Habit, progress: ReturnType<typeof deriveHabitProgress>['actual']): string | undefined {
  return progress.celebrated
    ? `Nouveau palier atteint pour « ${habit.name} » : ${formatStage(progress.celebrated)}. Bravo !`
    : undefined
}

/**
 * Message affiché après un rattrapage. Si la coche du jour est déjà faite, le
 * rattrapage peut faire atteindre un palier : il est célébré comme une coche,
 * quel que soit l'ordre des gestes (D23).
 */
export function recoveryFeedback(
  habit: Habit,
  completions: readonly Completion[],
  missedDate: LocalDate,
  today: LocalDate,
): string {
  const after = deriveHabitProgress(habit, [...completions, { habitId: habit.id, date: missedDate, kind: 'recovery' }], today).actual
  const recovered = `${capitalize(formatMissedDay(missedDate, today))} rattrapé.`
  const celebration = celebrationText(habit, after)
  return celebration ? `${recovered} ${celebration}` : recovered
}
