/**
 * Progression neutre d'une habitude, commune à tous les thèmes.
 *
 * À partir des données du moteur, cette logique pure place le personnage d'un
 * thème sur un parcours jalonné par les paliers, et donne son état (repos, fait,
 * rattrapable, manqué, célébration). Chaque thème projette ensuite ce parcours
 * sur son propre décor. Aucun vocabulaire de thème ici.
 *
 * Règle de position (journal de décisions, D17) :
 * - les étapes du parcours sont les paliers, puis, au-delà du dernier palier,
 *   chaque multiple de sa durée (un nouveau cycle commence) ;
 * - le décor correspond au plus haut palier jamais atteint ;
 * - si la série se brise, le personnage revient à la dernière étape atteinte,
 *   jamais au départ ; avec la nouvelle série, il repart de cette étape vers la
 *   suivante, au prorata de la série, et l'atteint exactement quand la série
 *   atteint le palier correspondant.
 */
import {
  STREAK_TIERS,
  computeStreak,
  getRecoveryState,
  previousScheduledDay,
  tierForDuration,
  type Completion,
  type Habit,
  type LocalDate,
  type RecoveryState,
  type StreakSummary,
  type StreakTier,
  type StreakTierId,
  type TodayStatus,
} from '../engine/index.ts'

/** État du personnage, par ordre de priorité. */
export type ProgressState =
  /** Un nouveau palier vient d'être atteint grâce à la coche du jour. */
  | 'celebrating'
  /** L'habitude est faite aujourd'hui. */
  | 'done'
  /** Le dernier jour prévu est manqué mais peut encore être rattrapé. */
  | 'recoverable'
  /** Le dernier jour prévu est manqué (sans aucun jugement : simple repos). */
  | 'missed'
  /** Tous les autres cas : en attente, habitude neuve, jour non prévu. */
  | 'idle'

/** Données d'entrée, toutes issues du moteur. */
export interface ProgressInput {
  /** Durée de la série en cours, en jours (StreakSummary.currentDurationDays). */
  currentDurationDays: number
  /** Plus longue durée de série atteinte (StreakSummary.bestDurationDays). */
  bestDurationDays: number
  /** Plus longue durée parmi les séries antérieures à la série en cours. */
  previousBestDurationDays: number
  /** Plus longue durée atteinte sans la validation du jour. */
  bestDurationBeforeToday: number
  today: TodayStatus
  /** Situation du dernier jour prévu avant aujourd'hui. */
  lastScheduledDay: 'validated' | 'recoverable' | 'missed' | 'none'
}

/** Étape du parcours affichée dans le cycle courant. */
export interface ProgressStage {
  /** Palier correspondant, ou null pour la fin d'un cycle au-delà du premier. */
  tierId: StreakTierId | null
  /** Durée de série (en jours) qui permet d'atteindre l'étape. */
  days: number
  /** Position de l'étape dans le cycle, entre 0 et 1. */
  at: number
  /** Étape déjà atteinte (d'après le plus haut palier jamais atteint). */
  reached: boolean
}

export interface HabitProgress {
  /** Cycle affiché : 1 pour le premier parcours, 2 au-delà du dernier palier, etc. */
  cycle: number
  /** Position du personnage dans le cycle affiché, entre 0 (départ) et 1 (fin). */
  position: number
  /** Étapes du cycle affiché (hors départ). */
  stages: ProgressStage[]
  /** Plus haut palier jamais atteint : il fixe le décor. */
  decorTier: StreakTier | null
  /** Plus haute étape jamais atteinte (palier, ou fin de cycle au-delà du dernier palier). */
  highestStage: { tierId: StreakTierId | null; days: number } | null
  /** Durée « effective » (en jours) qui place le personnage sur le parcours. */
  altitudeDays: number
  /** Prochaine étape visée et jours de série restants pour l'atteindre. */
  next: { tierId: StreakTierId | null; days: number; daysRemaining: number }
  state: ProgressState
  /** Intensité de la série : 0 aucune, 1 en cours, 2 au moins le premier palier. */
  intensity: 0 | 1 | 2
  /** Étape atteinte grâce à la coche du jour (pour la célébration), sinon null. */
  celebrated: { tierId: StreakTierId | null; days: number } | null
}

function sanitize(days: number): number {
  return Number.isFinite(days) && days > 0 ? days : 0
}

/** Paliers valides, triés et sans doublon de durée. */
function sortedTiers(tiers: readonly StreakTier[]): StreakTier[] {
  const sorted = [...tiers]
    .filter((tier) => Number.isFinite(tier.minDays) && tier.minDays > 0)
    .sort((a, b) => a.minDays - b.minDays)
  return sorted.filter((tier, index) => index === 0 || tier.minDays !== sorted[index - 1]!.minDays)
}

/** Durée d'un cycle : celle du dernier palier (1 an par défaut). */
function cycleLength(tiers: readonly StreakTier[]): number {
  return tiers.at(-1)?.minDays ?? 365
}

/** Dernière étape atteinte pour une durée : palier ou fin de cycle (0 si aucune). */
export function stageFloor(days: number, tiers: readonly StreakTier[] = STREAK_TIERS): number {
  const sorted = sortedTiers(tiers)
  const length = cycleLength(sorted)
  const d = sanitize(days)
  if (d >= length) return Math.floor(d / length) * length
  let floor = 0
  for (const tier of sorted) if (tier.minDays <= d) floor = tier.minDays
  return floor
}

/** Première étape strictement au-delà d'une durée. */
export function nextStage(days: number, tiers: readonly StreakTier[] = STREAK_TIERS): number {
  const sorted = sortedTiers(tiers)
  const length = cycleLength(sorted)
  const d = sanitize(days)
  if (d >= length) return (Math.floor(d / length) + 1) * length
  return sorted.find((tier) => tier.minDays > d)?.minDays ?? length
}

/**
 * Durée « effective » qui place le personnage : égale à la série en cours, sauf
 * après une rupture où il repart de la dernière étape atteinte (plancher) vers la
 * suivante, au prorata de la nouvelle série.
 */
export function effectiveDays(
  currentDurationDays: number,
  previousBestDurationDays: number,
  tiers: readonly StreakTier[] = STREAK_TIERS,
): number {
  const current = sanitize(currentDurationDays)
  const floor = stageFloor(previousBestDurationDays, tiers)
  if (floor === 0) return current
  const target = nextStage(floor, tiers)
  if (current >= target) return current
  return floor + ((target - floor) * current) / target
}

/** Cycle d'une durée : la fin d'un cycle appartient encore à ce cycle. */
function cycleOf(days: number, length: number): number {
  return Math.max(1, Math.ceil(days / length))
}

/** Position (0 à 1) d'une durée dans un cycle donné. */
function positionInCycle(days: number, cycle: number, tiers: readonly StreakTier[], length: number): number {
  if (cycle >= 2) {
    return Math.min(1, Math.max(0, (days - (cycle - 1) * length) / length))
  }
  // Premier cycle : les paliers sont régulièrement espacés le long du parcours.
  const steps = tiers.length > 0 ? tiers.map((tier) => tier.minDays) : [length]
  const points = [{ days: 0, at: 0 }, ...steps.map((stepDays, index) => ({ days: stepDays, at: (index + 1) / steps.length }))]
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1]!
    const to = points[i]!
    if (days <= to.days) {
      return from.at + ((to.at - from.at) * (days - from.days)) / (to.days - from.days)
    }
  }
  return 1
}

export function computeHabitProgress(input: ProgressInput, tiers: readonly StreakTier[] = STREAK_TIERS): HabitProgress {
  const sorted = sortedTiers(tiers)
  const length = cycleLength(sorted)
  const current = sanitize(input.currentDurationDays)
  // Le plus haut palier inclut toujours la série en cours (entrée défensive).
  const best = Math.max(sanitize(input.bestDurationDays), current, sanitize(input.previousBestDurationDays))
  const previousBest = Math.min(sanitize(input.previousBestDurationDays), best)

  const effective = effectiveDays(current, previousBest, sorted)
  // Le décor suit le personnage : il n'affiche jamais un cycle où il ne se trouve pas,
  // et une fin de cycle déjà dépassée par le passé s'affiche comme départ du suivant.
  const cycle = Math.max(cycleOf(effective, length), cycleOf(best, length))
  const position = positionInCycle(effective, cycle, sorted, length)

  const stages: ProgressStage[] =
    cycle === 1
      ? sorted.map((tier, index) => ({
          tierId: tier.id,
          days: tier.minDays,
          at: (index + 1) / sorted.length,
          reached: best >= tier.minDays,
        }))
      : [{ tierId: null, days: cycle * length, at: 1, reached: best >= cycle * length }]

  const nextDays = nextStage(Math.max(stageFloor(previousBest, sorted), current), sorted)
  const nextTier = sorted.find((tier) => tier.minDays === nextDays) ?? null

  // Célébration : la coche du jour fait atteindre une étape jamais atteinte jusque-là.
  const bestStage = stageFloor(best, sorted)
  const reachedToday = input.today === 'done' && bestStage > stageFloor(input.bestDurationBeforeToday, sorted)
  const celebrated = reachedToday
    ? { tierId: sorted.find((tier) => tier.minDays === bestStage)?.id ?? null, days: bestStage }
    : null

  let state: ProgressState = 'idle'
  if (input.today === 'done') state = reachedToday ? 'celebrating' : 'done'
  else if (input.lastScheduledDay === 'recoverable') state = 'recoverable'
  else if (input.lastScheduledDay === 'missed') state = 'missed'

  const firstTier = sorted[0]?.minDays ?? Infinity
  const intensity: 0 | 1 | 2 = current === 0 ? 0 : current >= firstTier ? 2 : 1

  return {
    cycle,
    position,
    stages,
    decorTier: tierForDuration(best, sorted),
    highestStage:
      bestStage > 0 ? { tierId: sorted.find((tier) => tier.minDays === bestStage)?.id ?? null, days: bestStage } : null,
    altitudeDays: effective,
    next: { tierId: nextTier?.id ?? null, days: nextDays, daysRemaining: Math.max(0, nextDays - current) },
    state,
    intensity,
    celebrated,
  }
}

/** Entrées de progression tirées des données du moteur, sans le modifier. */
export interface DerivedProgress {
  /** Progression réelle : sert aux textes (série, paliers). */
  actual: HabitProgress
  /**
   * Progression affichée par la scène. Identique à la progression réelle (décor,
   * étapes, cycle, état), sauf la position : tant qu'un jour manqué peut être
   * rattrapé, le personnage garde l'altitude qu'il aurait si le rattrapage était
   * fait, sans jamais atteindre une étape qui ne l'est pas encore.
   */
  visual: HabitProgress
  /** Série calculée par le moteur (réutilisable par l'interface). */
  streak: StreakSummary
  /** Situation du rattrapage calculée par le moteur. */
  recovery: RecoveryState
}

type ScheduleSource = Pick<Habit, 'id' | 'frequency' | 'createdOn' | 'pauses'>

/**
 * Meilleure durée des séries antérieures à la série en cours : on rejoue
 * l'historique jusqu'à la veille du début de la série.
 */
function previousBestDuration(habit: ScheduleSource, own: readonly Completion[], streak: StreakSummary): number {
  if (streak.currentStartedOn === null) return streak.bestDurationDays
  const startedOn = streak.currentStartedOn
  const dayBefore = previousScheduledDay(habit, startedOn)
  if (dayBefore === null) return 0
  return computeStreak(
    habit,
    own.filter((c) => c.date < startedOn),
    dayBefore,
  ).bestDurationDays
}

function inputsFor(
  habit: ScheduleSource,
  own: readonly Completion[],
  streak: StreakSummary,
  today: LocalDate,
  lastScheduledDay: ProgressInput['lastScheduledDay'],
): ProgressInput {
  // La meilleure durée « avant la coche du jour » ne diffère que si aujourd'hui est fait.
  const bestBeforeToday =
    streak.today === 'done'
      ? computeStreak(
          habit,
          own.filter((c) => c.date !== today),
          today,
        ).bestDurationDays
      : streak.bestDurationDays
  return {
    currentDurationDays: streak.currentDurationDays,
    bestDurationDays: streak.bestDurationDays,
    previousBestDurationDays: previousBestDuration(habit, own, streak),
    bestDurationBeforeToday: bestBeforeToday,
    today: streak.today,
    lastScheduledDay,
  }
}

/** Marge qui garde le personnage juste sous une étape pas encore atteinte. */
const BELOW_STAGE_DAYS = 0.5

export function deriveHabitProgress(
  habit: Pick<Habit, 'id' | 'status' | 'frequency' | 'createdOn' | 'pauses'>,
  completions: readonly Completion[],
  today: LocalDate,
  tiers: readonly StreakTier[] = STREAK_TIERS,
): DerivedProgress {
  // Seules les validations de l'habitude comptent : on les isole une fois.
  const own = completions.filter((c) => c.habitId === habit.id)
  const streak = computeStreak(habit, own, today)
  const recovery = getRecoveryState(habit, own, today)
  const lastDay = previousScheduledDay(habit, today)
  let lastScheduledDay: ProgressInput['lastScheduledDay'] = 'none'
  if (recovery.status === 'available') lastScheduledDay = 'recoverable'
  else if (lastDay !== null) lastScheduledDay = own.some((c) => c.date === lastDay) ? 'validated' : 'missed'

  const actual = computeHabitProgress(inputsFor(habit, own, streak, today, lastScheduledDay), tiers)
  if (recovery.status !== 'available') {
    return { actual, visual: actual, streak, recovery }
  }

  // Altitude « comme si » le jour manqué était rattrapé, plafonnée juste sous la
  // prochaine étape réelle et projetée sur le cycle réellement affiché.
  const hypothetical = [...own, { habitId: habit.id, date: recovery.missedDate, kind: 'recovery' as const }]
  const hypotheticalStreak = computeStreak(habit, hypothetical, today)
  const hypotheticalDays = effectiveDays(
    hypotheticalStreak.currentDurationDays,
    previousBestDuration(habit, hypothetical, hypotheticalStreak),
    tiers,
  )
  const sorted = sortedTiers(tiers)
  const length = cycleLength(sorted)
  const ceiling = Math.min(actual.next.days, actual.cycle * length) - BELOW_STAGE_DAYS
  const days = Math.max(actual.altitudeDays, Math.min(hypotheticalDays, ceiling))
  const visual: HabitProgress = {
    ...actual,
    altitudeDays: days,
    position: Math.max(actual.position, positionInCycle(days, actual.cycle, sorted, length)),
  }
  return { actual, visual, streak, recovery }
}
