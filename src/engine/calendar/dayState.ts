/**
 * État d'un jour pour une habitude, tel que le calendrier l'affiche.
 *
 * Aucun état n'est négatif : un jour prévu non validé est simplement « non
 * validé », et c'est au thème de le représenter de façon neutre.
 */
import type { LocalDate } from '../dates.ts'
import type { Completion, CompletionKind, Habit } from '../model.ts'
import { isPausedOn, matchesFrequency } from '../habits/schedule.ts'

export type HabitDayState =
  /** Validé le jour même. */
  | 'done'
  /** Validé grâce à la récupération (compte dans la série). */
  | 'recovered'
  /** Noté « fait après coup » depuis le calendrier (hors série). */
  | 'late'
  /** Aujourd'hui, prévu, pas encore validé. */
  | 'pending'
  /** Jour passé prévu, non validé. État neutre. */
  | 'notDone'
  /** Jour non prévu par la fréquence. */
  | 'unscheduled'
  /** Validation présente un jour qui n'est plus prévu (après un changement de fréquence). */
  | 'offSchedule'
  /** Habitude en pause ou archivée ce jour-là. */
  | 'paused'
  /** Avant la création de l'habitude. */
  | 'beforeCreation'
  /** Après aujourd'hui. */
  | 'future'

/** États d'un jour validé, d'une façon ou d'une autre. */
export const COMPLETED_DAY_STATES: readonly HabitDayState[] = ['done', 'recovered', 'late']

export type HabitDaySource = Pick<Habit, 'id' | 'frequency' | 'createdOn' | 'pauses'>

/** Validations d'une habitude, indexées par jour. */
export function completionKindsByDate(habitId: string, completions: readonly Completion[]): Map<LocalDate, CompletionKind> {
  const kinds = new Map<LocalDate, CompletionKind>()
  for (const completion of completions) {
    if (completion.habitId === habitId) kinds.set(completion.date, completion.kind)
  }
  return kinds
}

/** Variante qui reçoit les validations déjà indexées (calcul d'un mois entier). */
export function dayStateFromIndex(
  habit: HabitDaySource,
  kinds: ReadonlyMap<LocalDate, CompletionKind>,
  date: LocalDate,
  today: LocalDate,
): HabitDayState {
  if (date > today) return 'future'
  if (date < habit.createdOn) return 'beforeCreation'
  const paused = isPausedOn(habit, date)
  const scheduled = !paused && matchesFrequency(habit.frequency, date)
  const kind = kinds.get(date)
  if (kind !== undefined) {
    if (!scheduled) return 'offSchedule'
    if (kind === 'recovery') return 'recovered'
    if (kind === 'late') return 'late'
    return 'done'
  }
  if (paused) return 'paused'
  if (!scheduled) return 'unscheduled'
  return date === today ? 'pending' : 'notDone'
}

export function getHabitDayState(
  habit: HabitDaySource,
  completions: readonly Completion[],
  date: LocalDate,
  today: LocalDate,
): HabitDayState {
  return dayStateFromIndex(habit, completionKindsByDate(habit.id, completions), date, today)
}
