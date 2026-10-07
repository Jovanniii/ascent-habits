import { describe, expect, it } from 'vitest'
import { compareMonths, daysOfMonth, lastDayOfMonth, monthOf, monthWeeks, neighbourMonths, shiftMonth } from './month.ts'

describe('mois calendaires', () => {
  it('passe de décembre à janvier et inversement', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(shiftMonth({ year: 2027, month: 1 }, -1)).toEqual({ year: 2026, month: 12 })
    expect(shiftMonth({ year: 2026, month: 10 }, -22)).toEqual({ year: 2024, month: 12 })
  })

  it('connaît la longueur des mois, février bissextile compris', () => {
    expect(lastDayOfMonth({ year: 2026, month: 2 })).toBe('2026-02-28')
    expect(lastDayOfMonth({ year: 2028, month: 2 })).toBe('2028-02-29')
    expect(daysOfMonth({ year: 2026, month: 10 })).toHaveLength(31)
  })

  it('compare les mois', () => {
    expect(compareMonths(monthOf('2026-10-04'), { year: 2026, month: 10 })).toBe(0)
    expect(compareMonths({ year: 2025, month: 12 }, { year: 2026, month: 1 })).toBeLessThan(0)
  })

  it('découpe le mois en semaines du lundi au dimanche', () => {
    // Octobre 2026 commence un jeudi et se termine un samedi.
    const weeks = monthWeeks({ year: 2026, month: 10 })
    expect(weeks).toHaveLength(5)
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    expect(weeks[4]).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', null])
  })

  it('gère un mois qui tient en quatre semaines exactes', () => {
    // Février 2027 commence un lundi.
    const weeks = monthWeeks({ year: 2027, month: 2 })
    expect(weeks).toHaveLength(4)
    expect(weeks.flat().includes(null)).toBe(false)
  })

  it('borne la navigation entre le premier mois et le mois en cours', () => {
    const earliest = { year: 2026, month: 9 }
    const latest = { year: 2026, month: 10 }
    expect(neighbourMonths(latest, earliest, latest)).toEqual({ previous: earliest, next: null })
    expect(neighbourMonths(earliest, earliest, latest)).toEqual({ previous: null, next: latest })
  })
})
