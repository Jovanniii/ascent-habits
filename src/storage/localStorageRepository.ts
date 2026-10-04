/**
 * Stockage local du MVP : un document JSON versionné dans le localStorage.
 * Volume estimé : environ 200 Ko par an pour 10 habitudes, loin des limites.
 */
import type { AppData } from '../engine/index.ts'
import type { AppRepository } from './repository.ts'
import { DataValidationError, parseAppData } from './validation.ts'

export const STORAGE_KEY = 'ascent:data'

/** Données présentes sur l'appareil mais illisibles : elles ne sont jamais écrasées sans accord. */
export class StoredDataError extends Error {
  readonly raw: string
  readonly issues: string[]

  constructor(message: string, raw: string, issues: string[] = []) {
    super(message)
    this.name = 'StoredDataError'
    this.raw = raw
    this.issues = issues
  }
}

export function createLocalStorageRepository(storage: Storage, key: string = STORAGE_KEY): AppRepository {
  return {
    async load(): Promise<AppData | null> {
      const raw = storage.getItem(key)
      if (raw === null) {
        return null
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new StoredDataError('Les données enregistrées ne sont pas lisibles.', raw)
      }
      try {
        return parseAppData(parsed)
      } catch (error) {
        if (error instanceof DataValidationError) {
          throw new StoredDataError(error.message, raw, error.issues)
        }
        throw error
      }
    },

    async save(data: AppData): Promise<void> {
      storage.setItem(key, JSON.stringify(data))
    },
  }
}
