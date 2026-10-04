/**
 * Fabriques de données pour les tests (non utilisées par l'application).
 *
 * Repère de calendrier utilisé dans les tests : le lundi 28 septembre 2026
 * ouvre une semaine ISO qui se termine le dimanche 4 octobre 2026.
 */
import { addDays, type LocalDate } from '../dates.ts'
import type { AppData, Completion, CompletionKind, Habit, Settings } from '../model.ts'
import { createEmptyAppData } from '../model.ts'
import type { CommandContext } from '../commands/context.ts'

export function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Lire',
    frequency: { type: 'daily' },
    createdOn: '2026-09-01',
    status: 'active',
    pauses: [],
    ...overrides,
  }
}

export function completion(date: LocalDate, kind: CompletionKind = 'normal', habitId = 'habit-1'): Completion {
  return { habitId, date, kind }
}

/** Validations normales pour chaque jour de `from` à `to` inclus. */
export function completionsBetween(from: LocalDate, to: LocalDate, habitId = 'habit-1'): Completion[] {
  const result: Completion[] = []
  for (let day = from; day <= to; day = addDays(day, 1)) {
    result.push(completion(day, 'normal', habitId))
  }
  return result
}

/** Validations normales pour une liste de dates. */
export function completionsOn(dates: LocalDate[], habitId = 'habit-1'): Completion[] {
  return dates.map((date) => completion(date, 'normal', habitId))
}

export const TEST_SETTINGS: Settings = { themeId: 'plain', animationsEnabled: true }

export function makeAppData(overrides: Partial<AppData> = {}): AppData {
  return { ...createEmptyAppData(TEST_SETTINGS), ...overrides }
}

/** Contexte de commande déterministe : identifiants « id-1 », « id-2 »… */
export function makeContext(today: LocalDate = '2026-10-04'): CommandContext {
  let counter = 0
  return {
    today,
    now: `${today}T09:00:00.000Z`,
    newId: () => `id-${++counter}`,
  }
}
