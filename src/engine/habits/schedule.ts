/**
 * Calendrier d'une habitude : quels jours est-elle attendue ?
 */
import { addDays, isoWeekday, isWithin, type LocalDate } from '../dates.ts'
import type { Completion, Frequency, Habit } from '../model.ts'

type ScheduleSource = Pick<Habit, 'frequency' | 'createdOn' | 'pauses'>

export function matchesFrequency(frequency: Frequency, date: LocalDate): boolean {
  if (frequency.type === 'daily') {
    return true
  }
  return frequency.days.includes(isoWeekday(date))
}

export function isPausedOn(habit: Pick<Habit, 'pauses'>, date: LocalDate): boolean {
  return habit.pauses.some((pause) =>
    pause.to === undefined ? pause.from <= date : isWithin(date, pause.from, pause.to),
  )
}

/**
 * Un jour est prévu s'il est postérieur ou égal à la création de l'habitude,
 * s'il correspond à sa fréquence et s'il n'est pas dans une période de pause.
 */
export function isScheduledOn(habit: ScheduleSource, date: LocalDate): boolean {
  return date >= habit.createdOn && matchesFrequency(habit.frequency, date) && !isPausedOn(habit, date)
}

/** Dernier jour prévu strictement avant `date`, ou null s'il n'y en a pas. */
export function previousScheduledDay(habit: ScheduleSource, date: LocalDate): LocalDate | null {
  for (let day = addDays(date, -1); day >= habit.createdOn; day = addDays(day, -1)) {
    if (isScheduledOn(habit, day)) {
      return day
    }
  }
  return null
}

/** Vrai si la validation compte dans la série (normale ou rattrapage, pas « fait après coup »). */
export function countsForStreak(completion: Pick<Completion, 'kind'>): boolean {
  return completion.kind !== 'late'
}

/**
 * Dates validées normalement ou par rattrapage pour une habitude : celles qui
 * comptent dans la série. Les jours notés « fait après coup » en sont exclus.
 */
export function validatedDates(habitId: string, completions: readonly Completion[]): Set<LocalDate> {
  const dates = new Set<LocalDate>()
  for (const completion of completions) {
    if (completion.habitId === habitId && countsForStreak(completion)) {
      dates.add(completion.date)
    }
  }
  return dates
}
