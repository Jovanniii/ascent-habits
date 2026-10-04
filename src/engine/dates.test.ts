import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysBetween,
  isLocalDate,
  isoWeekday,
  isWithin,
  startOfIsoWeek,
  toLocalDate,
} from './dates.ts'

describe('isLocalDate', () => {
  it('accepte une date AAAA-MM-JJ existante', () => {
    expect(isLocalDate('2026-10-04')).toBe(true)
    expect(isLocalDate('2024-02-29')).toBe(true)
  })

  it('refuse les dates inexistantes ou mal formées', () => {
    expect(isLocalDate('2026-02-29')).toBe(false)
    expect(isLocalDate('2026-13-01')).toBe(false)
    expect(isLocalDate('2026-1-4')).toBe(false)
    expect(isLocalDate('2026-10-04T00:00:00Z')).toBe(false)
    expect(isLocalDate(20261004)).toBe(false)
    expect(isLocalDate(null)).toBe(false)
  })
})

describe('toLocalDate', () => {
  it("utilise le jour calendaire du fuseau de l'appareil", () => {
    expect(toLocalDate(new Date(2026, 9, 4, 0, 0))).toBe('2026-10-04')
    expect(toLocalDate(new Date(2026, 9, 4, 23, 59))).toBe('2026-10-04')
    expect(toLocalDate(new Date(2026, 0, 1, 12))).toBe('2026-01-01')
  })
})

describe('addDays', () => {
  it('franchit les fins de mois et d’année', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('gère les années bissextiles', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })

  it("n'est pas affecté par le changement d'heure", () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
  })

  it('refuse une date invalide', () => {
    expect(() => addDays('04/10/2026', 1)).toThrow(RangeError)
  })
})

describe('daysBetween', () => {
  it('compte les jours entre deux dates', () => {
    expect(daysBetween('2026-10-01', '2026-10-04')).toBe(3)
    expect(daysBetween('2026-10-04', '2026-10-01')).toBe(-3)
    expect(daysBetween('2026-10-04', '2026-10-04')).toBe(0)
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365)
  })
})

describe('isoWeekday et startOfIsoWeek', () => {
  it('numérote les jours du lundi (1) au dimanche (7)', () => {
    expect(isoWeekday('2026-09-28')).toBe(1)
    expect(isoWeekday('2026-10-03')).toBe(6)
    expect(isoWeekday('2026-10-04')).toBe(7)
  })

  it('renvoie le lundi de la semaine', () => {
    expect(startOfIsoWeek('2026-10-04')).toBe('2026-09-28')
    expect(startOfIsoWeek('2026-09-28')).toBe('2026-09-28')
    expect(startOfIsoWeek('2026-10-05')).toBe('2026-10-05')
    expect(startOfIsoWeek('2027-01-01')).toBe('2026-12-28')
  })
})

describe('isWithin', () => {
  it('inclut les bornes', () => {
    expect(isWithin('2026-10-01', '2026-10-01', '2026-10-03')).toBe(true)
    expect(isWithin('2026-10-03', '2026-10-01', '2026-10-03')).toBe(true)
    expect(isWithin('2026-10-04', '2026-10-01', '2026-10-03')).toBe(false)
  })
})
