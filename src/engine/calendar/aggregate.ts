/**
 * Agrégation globale d'un jour : habitudes prévues, validées, rattrapées, notées
 * après coup, tâches terminées et niveau d'intensité de 0 à 4.
 */
import { toLocalDate, type LocalDate } from '../dates.ts'
import type { Completion, CompletionKind, Habit, Task, Timestamp } from '../model.ts'
import { completionKindsByDate, dayStateFromIndex, type HabitDayState } from './dayState.ts'

/** 0 = rien de validé … 4 = tout validé. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4

export const HEAT_LEVELS: readonly HeatLevel[] = [0, 1, 2, 3, 4]

/**
 * Niveau d'intensité selon la part des habitudes prévues qui ont été validées :
 * 0 = aucune, 1 = moins d'un tiers, 2 = moins de deux tiers, 3 = au moins deux
 * tiers sans être toutes, 4 = toutes. null quand aucune habitude n'est prévue.
 */
export function heatLevel(completed: number, scheduled: number): HeatLevel | null {
  if (scheduled <= 0) return null
  if (completed <= 0) return 0
  if (completed >= scheduled) return 4
  if (3 * completed < scheduled) return 1
  if (3 * completed < 2 * scheduled) return 2
  return 3
}

/** Convertit l'instant où une tâche a été terminée en jour local. */
export type TimestampToDay = (timestamp: Timestamp) => LocalDate

/** Jour local de l'appareil (par défaut). */
export const deviceDay: TimestampToDay = (timestamp) => toLocalDate(new Date(timestamp))

export interface CalendarSource {
  habits: readonly Habit[]
  completions: readonly Completion[]
  tasks: readonly Task[]
}

export interface HabitDayEntry {
  habitId: string
  state: HabitDayState
}

export interface DaySummary {
  date: LocalDate
  isToday: boolean
  isFuture: boolean
  /** Habitudes prévues ce jour-là. */
  scheduled: number
  /** Habitudes prévues validées, de n'importe quelle façon (done + recovered + late). */
  completed: number
  done: number
  recovered: number
  late: number
  level: HeatLevel | null
  /** Habitudes concernées ce jour-là (prévues, ou validées hors programme), dans l'ordre des habitudes. */
  habits: HabitDayEntry[]
  /** Tâches terminées ce jour-là. */
  completedTaskIds: string[]
}

const RELEVANT_STATES: ReadonlySet<HabitDayState> = new Set([
  'done',
  'recovered',
  'late',
  'pending',
  'notDone',
  'offSchedule',
])

/** Index réutilisable pour calculer plusieurs jours d'affilée. */
export interface CalendarIndex {
  habits: readonly Habit[]
  kinds: Map<string, Map<LocalDate, CompletionKind>>
  tasksByDay: Map<LocalDate, string[]>
}

export function buildCalendarIndex(source: CalendarSource, toDay: TimestampToDay = deviceDay): CalendarIndex {
  const kinds = new Map<string, Map<LocalDate, CompletionKind>>()
  for (const habit of source.habits) kinds.set(habit.id, completionKindsByDate(habit.id, source.completions))
  const tasksByDay = new Map<LocalDate, string[]>()
  for (const task of source.tasks) {
    if (task.status !== 'done' || task.completedAt === undefined) continue
    const day = toDay(task.completedAt)
    tasksByDay.set(day, [...(tasksByDay.get(day) ?? []), task.id])
  }
  return { habits: source.habits, kinds, tasksByDay }
}

export function summarizeDayFromIndex(index: CalendarIndex, date: LocalDate, today: LocalDate): DaySummary {
  const habits: HabitDayEntry[] = []
  let scheduled = 0
  let done = 0
  let recovered = 0
  let late = 0
  for (const habit of index.habits) {
    const state = dayStateFromIndex(habit, index.kinds.get(habit.id) ?? new Map(), date, today)
    if (!RELEVANT_STATES.has(state)) continue
    habits.push({ habitId: habit.id, state })
    if (state === 'offSchedule') continue
    scheduled += 1
    if (state === 'done') done += 1
    if (state === 'recovered') recovered += 1
    if (state === 'late') late += 1
  }
  const completed = done + recovered + late
  return {
    date,
    isToday: date === today,
    isFuture: date > today,
    scheduled,
    completed,
    done,
    recovered,
    late,
    level: heatLevel(completed, scheduled),
    habits,
    completedTaskIds: date > today ? [] : (index.tasksByDay.get(date) ?? []),
  }
}

export function summarizeDay(
  source: CalendarSource,
  date: LocalDate,
  today: LocalDate,
  toDay: TimestampToDay = deviceDay,
): DaySummary {
  return summarizeDayFromIndex(buildCalendarIndex(source, toDay), date, today)
}
