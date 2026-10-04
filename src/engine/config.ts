/**
 * Paramètres réglables du moteur. Les modifier ici suffit : aucune autre valeur
 * n'est codée en dur dans la logique.
 */

/**
 * Nombre de récupérations autorisées par habitude et par semaine (du lundi au
 * dimanche), la semaine étant celle du jour rattrapé. 0 désactive la récupération.
 */
export const RECOVERY_LIMIT_PER_WEEK = 1

export type StreakTierId = 'days21' | 'months2' | 'months6' | 'year1'

export interface StreakTier {
  id: StreakTierId
  /** Durée minimale de la série, en jours calendaires hors pause. */
  minDays: number
}

/** Paliers de série, du plus petit au plus grand. L'habitude continue après le dernier. */
export const STREAK_TIERS: readonly StreakTier[] = [
  { id: 'days21', minDays: 21 },
  { id: 'months2', minDays: 60 },
  { id: 'months6', minDays: 180 },
  { id: 'year1', minDays: 365 },
]

/** Longueur maximale d'un nom d'habitude, de tâche, d'objectif ou de jalon. */
export const MAX_NAME_LENGTH = 120
