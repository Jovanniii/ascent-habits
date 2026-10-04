import { describe, expect, it } from 'vitest'
import { STREAK_TIERS } from '../config.ts'
import { completionsBetween, completionsOn, makeHabit } from '../testing/factories.ts'
import { computeStreak } from './streak.ts'
import { computeTierProgress, nextTierAfter, tierForDuration } from './tiers.ts'

describe('STREAK_TIERS', () => {
  it('définit les paliers 21 jours, 2 mois, 6 mois et 1 an, dans l’ordre', () => {
    expect(STREAK_TIERS.map((tier) => [tier.id, tier.minDays])).toEqual([
      ['days21', 21],
      ['months2', 60],
      ['months6', 180],
      ['year1', 365],
    ])
  })
})

describe('tierForDuration', () => {
  it.each([
    [0, null],
    [20, null],
    [21, 'days21'],
    [59, 'days21'],
    [60, 'months2'],
    [179, 'months2'],
    [180, 'months6'],
    [364, 'months6'],
    [365, 'year1'],
    [1000, 'year1'],
  ])('%i jours → %s', (days, expected) => {
    expect(tierForDuration(days)?.id ?? null).toBe(expected)
  })

  it('accepte une liste de paliers personnalisée', () => {
    expect(tierForDuration(7, [{ id: 'days21', minDays: 7 }])?.id).toBe('days21')
  })
})

describe('nextTierAfter', () => {
  it('renvoie le premier palier non atteint', () => {
    expect(nextTierAfter(0)?.id).toBe('days21')
    expect(nextTierAfter(21)?.id).toBe('months2')
    expect(nextTierAfter(200)?.id).toBe('year1')
  })

  it("renvoie null après le dernier palier : l'habitude continue sans fin", () => {
    expect(nextTierAfter(365)).toBeNull()
    expect(nextTierAfter(800)).toBeNull()
  })
})

describe('computeTierProgress', () => {
  it('distingue le palier de la série en cours du plus haut palier atteint', () => {
    const progress = computeTierProgress({ currentDurationDays: 5, bestDurationDays: 70 })
    expect(progress.current).toBeNull()
    expect(progress.next?.id).toBe('days21')
    expect(progress.daysToNext).toBe(16)
    expect(progress.highest?.id).toBe('months2')
  })

  it('indique l’absence de prochain palier après un an', () => {
    const progress = computeTierProgress({ currentDurationDays: 400, bestDurationDays: 400 })
    expect(progress).toMatchObject({ next: null, daysToNext: null })
    expect(progress.current?.id).toBe('year1')
  })

  it('atteint 21 jours après 21 validations quotidiennes', () => {
    const streak = computeStreak(makeHabit(), completionsBetween('2026-09-14', '2026-10-04'), '2026-10-04')
    expect(streak.current).toBe(21)
    expect(computeTierProgress(streak).current?.id).toBe('days21')
  })

  it('mesure les paliers en durée pour une habitude à jours précis', () => {
    const habit = makeHabit({ frequency: { type: 'specificDays', days: [1, 3, 5] } })
    // Du lundi 7 au lundi 28 septembre : 10 validations sur 22 jours.
    const completions = completionsOn([
      '2026-09-07',
      '2026-09-09',
      '2026-09-11',
      '2026-09-14',
      '2026-09-16',
      '2026-09-18',
      '2026-09-21',
      '2026-09-23',
      '2026-09-25',
      '2026-09-28',
    ])
    const streak = computeStreak(habit, completions, '2026-09-29')
    expect(streak.current).toBe(10)
    expect(streak.currentDurationDays).toBe(22)
    expect(computeTierProgress(streak).current?.id).toBe('days21')
  })
})
