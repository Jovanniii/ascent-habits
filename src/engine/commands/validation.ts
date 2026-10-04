import { MAX_NAME_LENGTH } from '../config.ts'
import { ISO_WEEKDAYS, isLocalDate, type IsoWeekday, type LocalDate } from '../dates.ts'
import type { Frequency } from '../model.ts'
import { CommandError } from './context.ts'

/** Nettoie un nom saisi (espaces superflus) et vérifie qu'il est utilisable. */
export function normalizeName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (normalized.length === 0) {
    throw new CommandError('invalid-name', 'Le nom ne peut pas être vide.')
  }
  if (normalized.length > MAX_NAME_LENGTH) {
    throw new CommandError('invalid-name', `Le nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères.`)
  }
  return normalized
}

/** Trie et dédoublonne les jours ; refuse une liste vide ou un jour inconnu. */
export function normalizeFrequency(frequency: Frequency): Frequency {
  if (frequency.type === 'daily') {
    return { type: 'daily' }
  }
  const days = [...new Set(frequency.days)].sort((a, b) => a - b)
  if (days.length === 0) {
    throw new CommandError('invalid-frequency', 'Choisir au moins un jour.')
  }
  if (days.some((day) => !ISO_WEEKDAYS.includes(day))) {
    throw new CommandError('invalid-frequency', 'Jour de la semaine inconnu.')
  }
  // Les sept jours cochés équivalent à « tous les jours ».
  if (days.length === ISO_WEEKDAYS.length) {
    return { type: 'daily' }
  }
  return { type: 'specificDays', days: days as IsoWeekday[] }
}

export function normalizeOptionalDate(date: LocalDate | null | undefined): LocalDate | undefined {
  if (date === null || date === undefined || date === '') {
    return undefined
  }
  if (!isLocalDate(date)) {
    throw new CommandError('invalid-date', `Date invalide : « ${date} ».`)
  }
  return date
}

export function findOrThrow<T extends { id: string }>(items: readonly T[], id: string, label: string): T {
  const item = items.find((candidate) => candidate.id === id)
  if (!item) {
    throw new CommandError('not-found', `${label} introuvable.`)
  }
  return item
}

export function replaceById<T extends { id: string }>(items: readonly T[], updated: T): T[] {
  return items.map((item) => (item.id === updated.id ? updated : item))
}
