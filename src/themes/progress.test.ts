import { describe, expect, it } from 'vitest'
import { addDays, type Completion, type Habit, type StreakTier } from '../engine/index.ts'
import {
  computeHabitProgress,
  deriveHabitProgress,
  effectiveDays,
  nextStage,
  stageFloor,
  type ProgressInput,
} from './progress.ts'

function input(overrides: Partial<ProgressInput> = {}): ProgressInput {
  const current = overrides.currentDurationDays ?? 0
  const best = overrides.bestDurationDays ?? current
  return {
    currentDurationDays: current,
    bestDurationDays: best,
    previousBestDurationDays: 0,
    bestDurationBeforeToday: best,
    today: 'pending',
    lastScheduledDay: 'validated',
    ...overrides,
  }
}

describe('étapes du parcours', () => {
  it('reprend les paliers puis chaque multiple du dernier palier', () => {
    expect([0, 20, 21, 59, 60, 179, 180, 364, 365, 729, 730, 800].map((d) => stageFloor(d))).toEqual([
      0, 0, 21, 21, 60, 60, 180, 180, 365, 365, 730, 730,
    ])
    expect([0, 21, 60, 180, 364, 365, 730].map((d) => nextStage(d))).toEqual([21, 60, 180, 365, 365, 730, 1095])
  })
})

describe('computeHabitProgress : position', () => {
  it('série à zéro, habitude neuve : au départ, au repos, sans décor ni flamme', () => {
    const progress = computeHabitProgress(input({ lastScheduledDay: 'none' }))
    expect(progress).toMatchObject({ cycle: 1, position: 0, decorTier: null, state: 'idle', intensity: 0, celebrated: null })
    expect(progress.next).toEqual({ tierId: 'days21', days: 21, daysRemaining: 21 })
    expect(progress.stages.map((stage) => [stage.tierId, stage.at, stage.reached])).toEqual([
      ['days21', 0.25, false],
      ['months2', 0.5, false],
      ['months6', 0.75, false],
      ['year1', 1, false],
    ])
  })

  it('première validation : avance non nulle', () => {
    const progress = computeHabitProgress(input({ currentDurationDays: 1, today: 'done' }))
    expect(progress.position).toBeCloseTo(0.25 / 21)
    expect(progress).toMatchObject({ state: 'done', intensity: 1 })
  })

  it('entre deux paliers : interpolation sur le segment', () => {
    const progress = computeHabitProgress(input({ currentDurationDays: 40 }))
    expect(progress.position).toBeCloseTo(0.25 + (0.25 * 19) / 39)
    expect(progress.decorTier?.id).toBe('days21')
    expect(progress.next).toEqual({ tierId: 'months2', days: 60, daysRemaining: 20 })
    expect(progress.intensity).toBe(2)
  })

  it('palier atteint : exactement à l’étape, décor mis à jour', () => {
    const progress = computeHabitProgress(input({ currentDurationDays: 21 }))
    expect(progress.position).toBe(0.25)
    expect(progress.decorTier?.id).toBe('days21')
    expect(progress.stages[0]?.reached).toBe(true)
  })

  it('rupture après un palier : retour à la dernière étape atteinte, jamais au départ', () => {
    const progress = computeHabitProgress(
      input({ currentDurationDays: 0, bestDurationDays: 50, previousBestDurationDays: 50, lastScheduledDay: 'missed' }),
    )
    expect(progress.position).toBe(0.25)
    expect(progress.decorTier?.id).toBe('days21')
    expect(progress.state).toBe('missed')
    expect(progress.next).toEqual({ tierId: 'months2', days: 60, daysRemaining: 60 })
  })

  it('rupture juste avant une étape : retour à l’étape précédente', () => {
    const progress = computeHabitProgress(input({ bestDurationDays: 59, previousBestDurationDays: 59 }))
    expect(progress.position).toBe(0.25)
  })

  it('reprise : repart de l’étape vers la suivante, au prorata de la nouvelle série', () => {
    const progress = computeHabitProgress(
      input({ currentDurationDays: 30, bestDurationDays: 70, previousBestDurationDays: 70, today: 'done' }),
    )
    // Étape 60 (0,5) → étape 180 (0,75) : 60 + 120 × 30 / 180 = 80 jours effectifs.
    expect(effectiveDays(30, 70)).toBeCloseTo(80)
    expect(progress.position).toBeCloseTo(0.5 + (0.25 * 20) / 120)
    expect(progress.next).toEqual({ tierId: 'months6', days: 180, daysRemaining: 150 })
    expect(progress.state).toBe('done')
  })

  it('reprise : atteint l’étape suivante exactement quand la série atteint le palier, sans saut', () => {
    const at = (current: number) =>
      computeHabitProgress(input({ currentDurationDays: current, bestDurationDays: Math.max(current, 40), previousBestDurationDays: 40 })).position
    expect(at(59)).toBeLessThan(at(60))
    expect(at(60)).toBe(0.5)
    expect(at(61)).toBeGreaterThan(at(60))
    expect(at(61) - at(60)).toBeLessThan(0.01)
  })

  it('1 an : fin du premier cycle ; au-delà, nouveau cycle', () => {
    expect(computeHabitProgress(input({ currentDurationDays: 364 })).position).toBeLessThan(1)
    expect(computeHabitProgress(input({ currentDurationDays: 365 }))).toMatchObject({ cycle: 1, position: 1 })
    const next = computeHabitProgress(input({ currentDurationDays: 366 }))
    expect(next.cycle).toBe(2)
    expect(next.position).toBeCloseTo(1 / 365)
    expect(next.next).toEqual({ tierId: null, days: 730, daysRemaining: 364 })
    expect(next.stages).toEqual([{ tierId: null, days: 730, at: 1, reached: false }])
    expect(computeHabitProgress(input({ currentDurationDays: 730 }))).toMatchObject({ cycle: 2, position: 1 })
    expect(computeHabitProgress(input({ currentDurationDays: 731 })).cycle).toBe(3)
  })

  it('rupture sur un cycle supérieur : au départ du cycle affiché', () => {
    const progress = computeHabitProgress(input({ bestDurationDays: 800, previousBestDurationDays: 800 }))
    expect(progress).toMatchObject({ cycle: 3, position: 0 })
    const resumed = computeHabitProgress(input({ currentDurationDays: 10, bestDurationDays: 800, previousBestDurationDays: 800 }))
    expect(resumed.cycle).toBe(3)
    expect(resumed.position).toBeGreaterThan(0)
  })

  it('reste borné pour de très longues séries', () => {
    const progress = computeHabitProgress(input({ currentDurationDays: 3650 }))
    expect(progress.cycle).toBe(10)
    expect(progress.position).toBe(1)
  })
})

describe('computeHabitProgress : propriétés', () => {
  it('la position ne recule pas quand la série augmente, et ne descend jamais sous l’étape atteinte', () => {
    for (const previousBest of [0, 15, 21, 45, 60, 200, 365, 400, 800]) {
      let last = -Infinity
      for (let current = 0; current <= 900; current += 1) {
        const best = Math.max(current, previousBest)
        const progress = computeHabitProgress(input({ currentDurationDays: current, bestDurationDays: best, previousBestDurationDays: previousBest }))
        const altitude = progress.cycle - 1 + progress.position
        expect(altitude).toBeGreaterThanOrEqual(last - 1e-9)
        expect(progress.position).toBeGreaterThanOrEqual(0)
        expect(progress.position).toBeLessThanOrEqual(1)
        expect(effectiveDays(current, previousBest)).toBeGreaterThanOrEqual(stageFloor(previousBest))
        last = altitude
      }
    }
  })

  it('le décor ne recule pas quand le record augmente', () => {
    let last = -1
    for (let best = 0; best <= 800; best += 1) {
      const progress = computeHabitProgress(input({ bestDurationDays: best, previousBestDurationDays: best }))
      const level = progress.cycle * 10 + (progress.decorTier ? ['days21', 'months2', 'months6', 'year1'].indexOf(progress.decorTier.id) : -1)
      expect(level).toBeGreaterThanOrEqual(last)
      last = level
    }
  })

  it('tolère des entrées incohérentes ou des paliers inhabituels', () => {
    expect(computeHabitProgress(input({ currentDurationDays: Number.NaN, bestDurationDays: -4 }))).toMatchObject({ cycle: 1, position: 0 })
    const bigCurrent = computeHabitProgress(input({ currentDurationDays: 30, bestDurationDays: 10 }))
    expect(bigCurrent.decorTier?.id).toBe('days21')
    const custom: StreakTier[] = [
      { id: 'months2', minDays: 60 },
      { id: 'days21', minDays: 21 },
      { id: 'days21', minDays: 21 },
    ]
    const progress = computeHabitProgress(input({ currentDurationDays: 40 }), custom)
    expect(Number.isFinite(progress.position)).toBe(true)
    expect(progress.stages.map((stage) => stage.days)).toEqual([21, 60])
    expect(computeHabitProgress(input({ currentDurationDays: 100 }), []).position).toBeGreaterThan(0)
  })
})

describe('computeHabitProgress : états et célébration', () => {
  it('célèbre une étape atteinte grâce à la coche du jour', () => {
    const progress = computeHabitProgress(input({ currentDurationDays: 21, bestDurationBeforeToday: 20, today: 'done' }))
    expect(progress).toMatchObject({ state: 'celebrating', celebrated: { tierId: 'days21', days: 21 } })
  })

  it('détecte un palier franchi par un saut de durée (habitude à jours précis)', () => {
    const progress = computeHabitProgress(input({ currentDurationDays: 22, bestDurationBeforeToday: 19, today: 'done' }))
    expect(progress.celebrated).toEqual({ tierId: 'days21', days: 21 })
  })

  it('ne célèbre pas un palier déjà atteint par le passé', () => {
    const progress = computeHabitProgress(
      input({ currentDurationDays: 21, bestDurationDays: 40, previousBestDurationDays: 40, bestDurationBeforeToday: 40, today: 'done' }),
    )
    expect(progress).toMatchObject({ state: 'done', celebrated: null })
  })

  it('célèbre la fin d’un cycle au-delà du dernier palier', () => {
    const progress = computeHabitProgress(input({ currentDurationDays: 730, bestDurationBeforeToday: 729, today: 'done' }))
    expect(progress.celebrated).toEqual({ tierId: null, days: 730 })
  })

  it('ordonne les états : fait > rattrapable > manqué > repos', () => {
    expect(computeHabitProgress(input({ today: 'done', lastScheduledDay: 'missed' })).state).toBe('done')
    expect(computeHabitProgress(input({ lastScheduledDay: 'recoverable' })).state).toBe('recoverable')
    expect(computeHabitProgress(input({ lastScheduledDay: 'missed' })).state).toBe('missed')
    expect(computeHabitProgress(input({ today: 'unscheduled' })).state).toBe('idle')
  })
})

describe('deriveHabitProgress (données du moteur)', () => {
  const habit: Habit = {
    id: 'h',
    name: 'Lire',
    frequency: { type: 'daily' },
    createdOn: '2026-08-01',
    status: 'active',
    pauses: [],
  }
  function daily(from: string, to: string): Completion[] {
    const result: Completion[] = []
    for (let day = from; day <= to; day = addDays(day, 1)) result.push({ habitId: 'h', date: day, kind: 'normal' })
    return result
  }
  const TODAY = '2026-10-04'

  it('calcule la meilleure durée des séries antérieures à la série en cours', () => {
    const completions = [...daily('2026-08-01', '2026-08-30'), ...daily('2026-09-25', '2026-10-03')]
    const { actual } = deriveHabitProgress(habit, completions, TODAY)
    // Série précédente : 30 jours (étape 21). Série en cours : 9 jours.
    expect(actual.position).toBeCloseTo(0.25 + (0.25 * (effectiveDays(9, 30) - 21)) / 39)
    expect(actual.next).toEqual({ tierId: 'months2', days: 60, daysRemaining: 51 })
  })

  it('pendant la fenêtre de rattrapage, la scène garde l’altitude d’avant l’oubli', () => {
    const completions = daily('2026-09-01', '2026-10-02') // 3 octobre manqué, rattrapable
    const { actual, visual } = deriveHabitProgress(habit, completions, TODAY)
    expect(actual.state).toBe('recoverable')
    expect(visual.state).toBe('recoverable')
    expect(actual.position).toBe(0.25)
    expect(visual.position).toBeGreaterThan(actual.position)
    expect(visual.intensity).toBe(2)
  })

  it('jour manqué non rattrapable : état manqué', () => {
    const completions = daily('2026-09-01', '2026-10-01') // 2 et 3 octobre manqués
    expect(deriveHabitProgress(habit, completions, TODAY).visual.state).toBe('missed')
  })

  it('célébration réelle après la coche du jour', () => {
    const completions = daily('2026-09-14', TODAY) // 21 jours aujourd'hui
    const { actual, visual } = deriveHabitProgress({ ...habit, createdOn: '2026-09-14' }, completions, TODAY)
    expect(actual.celebrated).toEqual({ tierId: 'days21', days: 21 })
    expect(visual.state).toBe('celebrating')
  })

  it('pause au milieu de la série : position inchangée', () => {
    const paused = { ...habit, createdOn: '2026-09-01', pauses: [{ from: '2026-09-20', to: '2026-09-30' }] }
    const before = deriveHabitProgress(paused, daily('2026-09-01', '2026-09-19'), '2026-09-25').actual.position
    const after = deriveHabitProgress(paused, daily('2026-09-01', '2026-09-19'), '2026-10-01').actual.position
    expect(after).toBe(before)
  })
})
