/**
 * Récupération d'un jour manqué.
 *
 * Le jour rattrapable est le dernier jour prévu avant aujourd'hui. Il peut être
 * validé après coup (type « rattrapage ») jusqu'au jour prévu suivant inclus :
 * pour une habitude quotidienne, c'est exactement le lendemain. La série est
 * alors préservée. La récupération n'est proposée que s'il existe une série à
 * sauver, c'est-à-dire si le jour prévu précédant le jour manqué est validé.
 * Le nombre de récupérations est limité par habitude et par semaine (celle du
 * jour rattrapé).
 */
import { RECOVERY_LIMIT_PER_WEEK } from '../config.ts'
import { addDays, isWithin, startOfIsoWeek, type LocalDate } from '../dates.ts'
import type { Completion, Habit } from '../model.ts'
import { previousScheduledDay } from './schedule.ts'

export type RecoveryState =
  /** Le jour manqué peut être rattrapé maintenant. */
  | { status: 'available'; missedDate: LocalDate }
  /** Le dernier jour prévu a déjà été rattrapé (le rattrapage peut être annulé). */
  | { status: 'recovered'; missedDate: LocalDate }
  /** Un jour est manqué mais la limite hebdomadaire est atteinte. */
  | { status: 'limitReached'; missedDate: LocalDate }
  /**
   * Rien à proposer : dernier jour prévu validé, aucune série à sauver (jour
   * précédent non validé ou inexistant), aucun jour prévu, ou habitude inactive.
   */
  | { status: 'none' }

export function recoveriesUsedInWeek(
  habitId: string,
  completions: readonly Completion[],
  dateInWeek: LocalDate,
): number {
  const weekStart = startOfIsoWeek(dateInWeek)
  const weekEnd = addDays(weekStart, 6)
  return completions.filter(
    (completion) =>
      completion.habitId === habitId &&
      completion.kind === 'recovery' &&
      isWithin(completion.date, weekStart, weekEnd),
  ).length
}

export function getRecoveryState(
  habit: Pick<Habit, 'id' | 'status' | 'frequency' | 'createdOn' | 'pauses'>,
  completions: readonly Completion[],
  today: LocalDate,
  limitPerWeek: number = RECOVERY_LIMIT_PER_WEEK,
): RecoveryState {
  if (habit.status !== 'active') {
    return { status: 'none' }
  }
  const missedDate = previousScheduledDay(habit, today)
  if (missedDate === null) {
    return { status: 'none' }
  }
  const completion = completions.find((c) => c.habitId === habit.id && c.date === missedDate)
  if (completion) {
    return completion.kind === 'recovery' ? { status: 'recovered', missedDate } : { status: 'none' }
  }
  // Rattraper n'a de sens que s'il y a une série à sauver : le jour prévu qui
  // précède le jour manqué doit être validé (normalement ou par rattrapage).
  const dayBefore = previousScheduledDay(habit, missedDate)
  if (dayBefore === null || !completions.some((c) => c.habitId === habit.id && c.date === dayBefore)) {
    return { status: 'none' }
  }
  if (recoveriesUsedInWeek(habit.id, completions, missedDate) >= limitPerWeek) {
    return { status: 'limitReached', missedDate }
  }
  return { status: 'available', missedDate }
}
