/**
 * Libellés du calendrier. Tous neutres : un jour non validé n'est jamais « manqué ».
 */
import type { DaySummary, HabitCalendarDay, HabitDayState } from '../../../engine/index.ts'
import { formatDayMonth, formatValidations, plural } from '../../format.ts'

/** État d'un jour, vue par habitude (le sujet est « le jour »). */
export const HABIT_DAY_LABELS: Record<HabitDayState, string> = {
  done: 'validé',
  recovered: 'rattrapé',
  late: 'fait après coup, hors série',
  pending: 'à faire aujourd’hui',
  notDone: 'non validé',
  unscheduled: 'non prévu',
  offSchedule: 'validé, jour non prévu',
  paused: 'en pause',
  beforeCreation: 'avant la création de l’habitude',
  future: 'à venir',
}

/** État d'une habitude un jour donné, vue globale (le sujet est « l'habitude »). */
export const HABIT_ENTRY_LABELS: Partial<Record<HabitDayState, string>> = {
  done: 'validée',
  recovered: 'rattrapée',
  late: 'faite après coup',
  pending: 'à faire',
  notDone: 'non validée',
  offSchedule: 'validée hors programme',
}

function dayPrefix(date: string, isToday: boolean): string {
  return isToday ? `Aujourd’hui, ${formatDayMonth(date)}` : formatDayMonth(date)
}

export function habitDayAriaLabel(day: HabitCalendarDay): string {
  let text = `${dayPrefix(day.date, day.isToday)} : ${HABIT_DAY_LABELS[day.state]}`
  if (day.chain && day.chain.length > 1) text += `, série de ${formatValidations(day.chain.length)}`
  return text
}

export function globalDayAriaLabel(day: DaySummary, habitNames: ReadonlyMap<string, string>): string {
  const prefix = dayPrefix(day.date, day.isToday)
  if (day.isFuture) return `${prefix} : à venir`
  const parts = day.habits.map((entry) => `${habitNames.get(entry.habitId) ?? 'Habitude'} ${HABIT_ENTRY_LABELS[entry.state] ?? ''}`.trim())
  if (day.scheduled === 0 && parts.length === 0) parts.push('aucune habitude prévue')
  if (day.completedTaskIds.length > 0) parts.push(plural(day.completedTaskIds.length, 'tâche terminée', 'tâches terminées'))
  return `${prefix} : ${parts.join(', ')}`
}
