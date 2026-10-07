/**
 * Mois calendaires : navigation et découpage en semaines (du lundi au dimanche).
 */
import { addDays, isoWeekday, type LocalDate } from '../dates.ts'

export interface CalendarMonth {
  year: number
  /** 1 = janvier … 12 = décembre. */
  month: number
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

export function monthOf(date: LocalDate): CalendarMonth {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) }
}

export function shiftMonth(month: CalendarMonth, delta: number): CalendarMonth {
  const index = month.year * 12 + (month.month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

/** Négatif si `a` précède `b`, nul si c'est le même mois, positif sinon. */
export function compareMonths(a: CalendarMonth, b: CalendarMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month)
}

export function firstDayOfMonth(month: CalendarMonth): LocalDate {
  return `${pad(month.year, 4)}-${pad(month.month)}-01`
}

export function lastDayOfMonth(month: CalendarMonth): LocalDate {
  return addDays(firstDayOfMonth(shiftMonth(month, 1)), -1)
}

/** Jours du mois, dans l'ordre. */
export function daysOfMonth(month: CalendarMonth): LocalDate[] {
  const days: LocalDate[] = []
  const last = lastDayOfMonth(month)
  for (let day = firstDayOfMonth(month); day <= last; day = addDays(day, 1)) {
    days.push(day)
  }
  return days
}

/**
 * Semaines du mois, du lundi au dimanche. Les cases qui n'appartiennent pas au
 * mois valent null, pour que chaque semaine compte toujours 7 cases.
 */
export function monthWeeks(month: CalendarMonth): (LocalDate | null)[][] {
  const weeks: (LocalDate | null)[][] = []
  let week: (LocalDate | null)[] = Array.from({ length: isoWeekday(firstDayOfMonth(month)) - 1 }, () => null)
  for (const day of daysOfMonth(month)) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)])
  }
  return weeks
}

/** Mois voisins accessibles : pas avant `earliest`, pas après `latest`. */
export function neighbourMonths(
  month: CalendarMonth,
  earliest: CalendarMonth,
  latest: CalendarMonth,
): { previous: CalendarMonth | null; next: CalendarMonth | null } {
  return {
    previous: compareMonths(month, earliest) > 0 ? shiftMonth(month, -1) : null,
    next: compareMonths(month, latest) < 0 ? shiftMonth(month, 1) : null,
  }
}
