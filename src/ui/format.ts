/**
 * Libellés et formats affichés à l'utilisateur (français).
 */
import { addDays, isoWeekday, type Frequency, type IsoWeekday, type LocalDate, type StreakTierId } from '../engine/index.ts'

export const WEEKDAY_NAMES: Record<IsoWeekday, string> = {
  1: 'lundi',
  2: 'mardi',
  3: 'mercredi',
  4: 'jeudi',
  5: 'vendredi',
  6: 'samedi',
  7: 'dimanche',
}

export const WEEKDAY_SHORT: Record<IsoWeekday, string> = {
  1: 'lun.',
  2: 'mar.',
  3: 'mer.',
  4: 'jeu.',
  5: 'ven.',
  6: 'sam.',
  7: 'dim.',
}

export const WEEKDAY_INITIALS: Record<IsoWeekday, string> = { 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S', 7: 'D' }

export const TIER_LABELS: Record<StreakTierId, string> = {
  days21: '21 jours',
  months2: '2 mois',
  months6: '6 mois',
  year1: '1 an',
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Accord en français : 0 et 1 au singulier. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`
}

/** Unité de la série : le nombre de validations. */
export function formatValidations(count: number): string {
  return plural(count, 'validation')
}

export function formatFrequency(frequency: Frequency): string {
  if (frequency.type === 'daily') return 'Tous les jours'
  const key = frequency.days.join(',')
  if (key === '1,2,3,4,5') return 'Du lundi au vendredi'
  if (key === '6,7') return 'Le week-end'
  return capitalize(frequency.days.map((day) => WEEKDAY_SHORT[day]).join(' '))
}

function utcDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00Z`)
}

const longDateFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const shortDateFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const fullDateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** « dimanche 4 octobre » */
export function formatLongDate(date: LocalDate): string {
  return longDateFormat.format(utcDate(date))
}

/** « 4 octobre 2026 » */
export function formatFullDate(date: LocalDate): string {
  return fullDateFormat.format(utcDate(date))
}

/**
 * Jour à rattraper : le nom du jour si c'était hier (« mercredi »), sinon le jour
 * et la date pour lever toute ambiguïté (« ven. 2 oct. »).
 */
export function formatMissedDay(date: LocalDate, today: LocalDate): string {
  if (addDays(today, -1) === date) return WEEKDAY_NAMES[isoWeekday(date)]
  return shortDateFormat.format(utcDate(date))
}

/** Échéance neutre, sans notion de retard. */
export function formatDueDate(date: LocalDate, today: LocalDate): string {
  if (date === today) return "aujourd'hui"
  if (date === addDays(today, 1)) return 'demain'
  return shortDateFormat.format(utcDate(date))
}
