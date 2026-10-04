/**
 * Dates calendaires locales.
 *
 * Toute la logique métier raisonne en jours calendaires de l'appareil, au format
 * « AAAA-MM-JJ », sans heure ni fuseau horaire. Les calculs internes passent par
 * des dates UTC à minuit, ce qui les rend insensibles aux changements d'heure.
 */

/** Date calendaire locale au format AAAA-MM-JJ (ex. « 2026-10-04 »). */
export type LocalDate = string

/** Jour de la semaine ISO 8601 : 1 = lundi … 7 = dimanche. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const ISO_WEEKDAYS: readonly IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7]

const MS_PER_DAY = 24 * 60 * 60 * 1000
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

function toUtcDate(date: LocalDate): Date {
  const match = LOCAL_DATE_PATTERN.exec(date)
  if (!match) {
    throw new RangeError(`Date locale invalide : « ${date} »`)
  }
  const [, year, month, day] = match
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
}

function fromUtcDate(date: Date): LocalDate {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** Vrai si la valeur est une date AAAA-MM-JJ qui existe dans le calendrier. */
export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string' || !LOCAL_DATE_PATTERN.test(value)) {
    return false
  }
  return fromUtcDate(toUtcDate(value)) === value
}

/** Jour calendaire local d'un instant, selon le fuseau de l'appareil. */
export function toLocalDate(instant: Date): LocalDate {
  return `${pad(instant.getFullYear(), 4)}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}`
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const utc = toUtcDate(date)
  utc.setUTCDate(utc.getUTCDate() + days)
  return fromUtcDate(utc)
}

/** Nombre de jours pour aller de `from` à `to` (négatif si `to` est avant). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY)
}

export function isoWeekday(date: LocalDate): IsoWeekday {
  const day = toUtcDate(date).getUTCDay()
  return (day === 0 ? 7 : day) as IsoWeekday
}

/** Lundi de la semaine (ISO, du lundi au dimanche) qui contient la date. */
export function startOfIsoWeek(date: LocalDate): LocalDate {
  return addDays(date, 1 - isoWeekday(date))
}

/** Vrai si `date` appartient à l'intervalle fermé [from, to]. */
export function isWithin(date: LocalDate, from: LocalDate, to: LocalDate): boolean {
  // Le format AAAA-MM-JJ permet la comparaison lexicographique.
  return from <= date && date <= to
}
