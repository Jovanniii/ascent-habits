import { describe, expect, it } from 'vitest'
import {
  AMBIANCE_MODES,
  dayPeriodAt,
  msUntilNextDayPeriod,
  parseAmbianceMode,
  resolveDayPeriod,
} from './ambiance.ts'

/** 7 octobre 2026 à l'heure locale donnée. */
const at = (hour: number, minute = 0) => new Date(2026, 9, 7, hour, minute)

describe('tranche horaire', () => {
  it.each([
    [0, 'night'],
    [5, 'night'],
    [6, 'morning'],
    [9, 'morning'],
    [10, 'day'],
    [17, 'day'],
    [18, 'evening'],
    [20, 'evening'],
    [21, 'night'],
    [23, 'night'],
  ] as const)('%i h → %s', (hour, period) => {
    expect(dayPeriodAt(at(hour, 30))).toBe(period)
  })

  it('change exactement à l’heure de début', () => {
    expect(dayPeriodAt(at(5, 59))).toBe('night')
    expect(dayPeriodAt(at(6, 0))).toBe('morning')
    expect(dayPeriodAt(at(20, 59))).toBe('evening')
    expect(dayPeriodAt(at(21, 0))).toBe('night')
  })
})

describe('réglage « Ambiance »', () => {
  it('suit l’heure en automatique', () => {
    expect(resolveDayPeriod('auto', at(7))).toBe('morning')
    expect(resolveDayPeriod('auto', at(22))).toBe('night')
  })

  it('ignore l’heure quand le moment est fixé', () => {
    for (const hour of [0, 7, 12, 19, 23]) {
      expect(resolveDayPeriod('day', at(hour))).toBe('day')
      expect(resolveDayPeriod('night', at(hour))).toBe('night')
    }
  })

  it('retombe sur « automatique » pour une valeur absente ou inconnue', () => {
    expect(parseAmbianceMode(null)).toBe('auto')
    expect(parseAmbianceMode('crépuscule')).toBe('auto')
    expect(parseAmbianceMode(42)).toBe('auto')
    for (const mode of AMBIANCE_MODES) expect(parseAmbianceMode(mode)).toBe(mode)
  })
})

describe('prochain changement de moment', () => {
  it('vise la prochaine heure de début, le jour même ou le lendemain', () => {
    const minute = 60_000
    expect(msUntilNextDayPeriod(at(9, 30))).toBe(30 * minute)
    expect(msUntilNextDayPeriod(at(10, 0))).toBe(8 * 60 * minute)
    expect(msUntilNextDayPeriod(at(23, 0))).toBe(7 * 60 * minute)
    expect(msUntilNextDayPeriod(at(3, 0))).toBe(3 * 60 * minute)
  })
})
