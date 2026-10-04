import type { AppData } from '../engine/index.ts'
import type { AppRepository } from './repository.ts'

/** Stockage en mémoire, utile pour les tests et les démonstrations. */
export function createMemoryRepository(initial: AppData | null = null): AppRepository & { snapshot(): AppData | null } {
  let stored = initial === null ? null : structuredClone(initial)
  return {
    async load() {
      return stored === null ? null : structuredClone(stored)
    },
    async save(data) {
      stored = structuredClone(data)
    },
    snapshot() {
      return stored
    },
  }
}
