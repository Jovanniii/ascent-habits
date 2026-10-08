/**
 * Données d'un mois complet, prêtes à afficher : vue par habitude et vue globale.
 */
import type { LocalDate } from '../dates.ts'
import type { Completion, Habit } from '../model.ts'
import { computeStreak, type StreakSummary } from '../habits/streak.ts'
import {
  buildCalendarIndex,
  deviceDay,
  summarizeDayFromIndex,
  type CalendarSource,
  type DaySummary,
  type TimestampToDay,
} from './aggregate.ts'
import { computeChains, type ChainMark } from './chains.ts'
import { completionKindsByDate, dayStateFromIndex, type HabitDayState } from './dayState.ts'
import { monthOf, monthWeeks, neighbourMonths, type CalendarMonth } from './month.ts'

export interface HabitCalendarDay {
  date: LocalDate
  state: HabitDayState
  isToday: boolean
  /** Position dans une chaîne de série, pour un jour validé qui compte dans la série. */
  chain: ChainMark | null
  /** Jour non validé situé à l'intérieur d'une chaîne (non prévu ou en pause). */
  bridge: boolean
}

export interface HabitCalendarMonth {
  month: CalendarMonth
  /** Semaines du lundi au dimanche ; null hors du mois. */
  weeks: (HabitCalendarDay | null)[][]
  /** Série actuelle et meilleure série, à la date d'aujourd'hui. */
  streak: StreakSummary
  previous: CalendarMonth | null
  next: CalendarMonth | null
}

export interface GlobalCalendarMonth {
  month: CalendarMonth
  weeks: (DaySummary | null)[][]
  previous: CalendarMonth | null
  next: CalendarMonth | null
}

export function buildHabitMonth(
  habit: Pick<Habit, 'id' | 'frequency' | 'createdOn' | 'pauses'>,
  completions: readonly Completion[],
  month: CalendarMonth,
  today: LocalDate,
): HabitCalendarMonth {
  const kinds = completionKindsByDate(habit.id, completions)
  const chains = computeChains(habit, completions, today)
  const weeks = monthWeeks(month).map((week) =>
    week.map((date): HabitCalendarDay | null =>
      date === null
        ? null
        : {
            date,
            state: dayStateFromIndex(habit, kinds, date, today),
            isToday: date === today,
            chain: chains.marks.get(date) ?? null,
            bridge: chains.bridges.has(date),
          },
    ),
  )
  return {
    month,
    weeks,
    streak: computeStreak(habit, completions, today),
    ...neighbourMonths(month, monthOf(habit.createdOn), monthOf(today)),
  }
}

/** Premier jour qui a une donnée : création d'une habitude ou tâche terminée. */
function earliestDay(source: CalendarSource, toDay: TimestampToDay, today: LocalDate): LocalDate {
  let earliest = today
  for (const habit of source.habits) if (habit.createdOn < earliest) earliest = habit.createdOn
  for (const task of source.tasks) {
    if (task.status === 'done' && task.completedAt !== undefined) {
      const day = toDay(task.completedAt)
      if (day < earliest) earliest = day
    }
  }
  return earliest
}

export function buildGlobalMonth(
  source: CalendarSource,
  month: CalendarMonth,
  today: LocalDate,
  toDay: TimestampToDay = deviceDay,
): GlobalCalendarMonth {
  const index = buildCalendarIndex(source, toDay)
  const weeks = monthWeeks(month).map((week) =>
    week.map((date) => (date === null ? null : summarizeDayFromIndex(index, date, today))),
  )
  return { month, weeks, ...neighbourMonths(month, monthOf(earliestDay(source, toDay, today)), monthOf(today)) }
}
