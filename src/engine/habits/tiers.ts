/**
 * Paliers de série.
 *
 * Le moteur distingue le palier de la série en cours et le plus haut palier
 * jamais atteint : le thème peut ainsi conserver un décor acquis même quand la
 * série repart de zéro.
 */
import { STREAK_TIERS, type StreakTier } from '../config.ts'
import type { StreakSummary } from './streak.ts'

/** Palier le plus élevé atteint pour une durée donnée, ou null. */
export function tierForDuration(
  durationDays: number,
  tiers: readonly StreakTier[] = STREAK_TIERS,
): StreakTier | null {
  let reached: StreakTier | null = null
  for (const tier of tiers) {
    if (durationDays >= tier.minDays) {
      reached = tier
    }
  }
  return reached
}

/** Premier palier pas encore atteint pour une durée donnée, ou null après le dernier. */
export function nextTierAfter(
  durationDays: number,
  tiers: readonly StreakTier[] = STREAK_TIERS,
): StreakTier | null {
  return tiers.find((tier) => durationDays < tier.minDays) ?? null
}

export interface TierProgress {
  /** Palier atteint par la série en cours. */
  current: StreakTier | null
  /** Prochain palier visé par la série en cours (null après le dernier palier). */
  next: StreakTier | null
  /** Jours restants avant le prochain palier (null après le dernier palier). */
  daysToNext: number | null
  /** Plus haut palier jamais atteint, toutes séries confondues. */
  highest: StreakTier | null
}

export function computeTierProgress(
  streak: Pick<StreakSummary, 'currentDurationDays' | 'bestDurationDays'>,
  tiers: readonly StreakTier[] = STREAK_TIERS,
): TierProgress {
  const next = nextTierAfter(streak.currentDurationDays, tiers)
  return {
    current: tierForDuration(streak.currentDurationDays, tiers),
    next,
    daysToNext: next ? next.minDays - streak.currentDurationDays : null,
    highest: tierForDuration(streak.bestDurationDays, tiers),
  }
}
