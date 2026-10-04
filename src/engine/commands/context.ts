import type { LocalDate } from '../dates.ts'
import type { Timestamp } from '../model.ts'

/**
 * Contexte fourni à chaque commande. L'heure et la génération d'identifiants sont
 * injectées, ce qui garde les commandes pures et rend les tests déterministes.
 */
export interface CommandContext {
  today: LocalDate
  now: Timestamp
  newId: () => string
}

export type CommandErrorCode =
  | 'invalid-name'
  | 'invalid-frequency'
  | 'invalid-date'
  | 'not-found'
  | 'not-scheduled'
  | 'invalid-state'
  | 'recovery-unavailable'

/** Erreur levée quand une commande reçoit une entrée invalide ou impossible à appliquer. */
export class CommandError extends Error {
  readonly code: CommandErrorCode

  constructor(code: CommandErrorCode, message: string) {
    super(message)
    this.name = 'CommandError'
    this.code = code
  }
}
