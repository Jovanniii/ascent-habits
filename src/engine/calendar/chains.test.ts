import { describe, expect, it } from 'vitest'
import type { Frequency } from '../model.ts'
import { completion, completionsBetween, completionsOn, makeHabit } from '../testing/factories.ts'
import { computeStreak } from '../habits/streak.ts'
import { computeChains } from './chains.ts'

const TODAY = '2026-10-04'
const MON_WED_FRI: Frequency = { type: 'specificDays', days: [1, 3, 5] }

describe('computeChains : séries mises en évidence', () => {
  it('marque début, milieu et fin, et un jour isolé', () => {
    const completions = [...completionsBetween('2026-09-20', '2026-09-22'), completion('2026-09-25')]
    const { marks } = computeChains(makeHabit(), completions, TODAY)
    expect(marks.get('2026-09-20')).toEqual({ position: 'start', length: 3 })
    expect(marks.get('2026-09-21')).toEqual({ position: 'middle', length: 3 })
    expect(marks.get('2026-09-22')).toEqual({ position: 'end', length: 3 })
    expect(marks.get('2026-09-25')).toEqual({ position: 'single', length: 1 })
    expect(marks.has('2026-09-23')).toBe(false)
  })

  it('relie les jours prévus à travers les jours non prévus (ponts)', () => {
    // Lundi 28, mercredi 30 septembre, vendredi 2 octobre.
    const habit = makeHabit({ frequency: MON_WED_FRI })
    const { marks, bridges } = computeChains(habit, completionsOn(['2026-09-28', '2026-09-30', '2026-10-02']), TODAY)
    expect(marks.get('2026-10-02')).toEqual({ position: 'end', length: 3 })
    expect([...bridges].sort()).toEqual(['2026-09-29', '2026-10-01'])
  })

  it('une pause ne coupe pas la chaîne', () => {
    const habit = makeHabit({ pauses: [{ from: '2026-09-23', to: '2026-09-25' }] })
    const completions = [...completionsBetween('2026-09-20', '2026-09-22'), ...completionsBetween('2026-09-26', '2026-09-27')]
    const { marks, bridges } = computeChains(habit, completions, TODAY)
    expect(marks.get('2026-09-27')).toEqual({ position: 'end', length: 5 })
    expect(bridges.has('2026-09-24')).toBe(true)
  })

  it('reste continue à cheval sur deux mois', () => {
    const { marks } = computeChains(makeHabit(), completionsBetween('2026-09-28', '2026-10-03'), TODAY)
    expect(marks.get('2026-09-28')?.position).toBe('start')
    expect(marks.get('2026-10-01')).toEqual({ position: 'middle', length: 6 })
    expect(marks.get('2026-10-03')?.position).toBe('end')
  })

  it("aujourd'hui en attente ne coupe pas la chaîne en cours", () => {
    const completions = completionsBetween('2026-10-01', '2026-10-03')
    const { marks, bridges } = computeChains(makeHabit(), completions, TODAY)
    expect(marks.get('2026-10-03')).toEqual({ position: 'end', length: 3 })
    expect(bridges.has(TODAY)).toBe(false)
  })

  it('un jour noté après coup coupe la chaîne, comme pour la série', () => {
    const completions = [...completionsBetween('2026-09-28', '2026-09-29'), completion('2026-09-30', 'late'), completion('2026-10-01')]
    const { marks } = computeChains(makeHabit(), completions, TODAY)
    expect(marks.get('2026-09-29')).toEqual({ position: 'end', length: 2 })
    expect(marks.has('2026-09-30')).toBe(false)
    expect(marks.get('2026-10-01')).toEqual({ position: 'single', length: 1 })
  })

  it('la plus longue chaîne égale la meilleure série', () => {
    const completions = [...completionsBetween('2026-09-02', '2026-09-12'), ...completionsBetween('2026-09-20', '2026-10-03')]
    const { marks } = computeChains(makeHabit(), completions, TODAY)
    const longest = Math.max(...[...marks.values()].map((mark) => mark.length))
    expect(longest).toBe(computeStreak(makeHabit(), completions, TODAY).best)
  })

  it('habitude sans historique : aucune chaîne', () => {
    const { marks, bridges } = computeChains(makeHabit({ createdOn: TODAY }), [], TODAY)
    expect(marks.size).toBe(0)
    expect(bridges.size).toBe(0)
  })
})
