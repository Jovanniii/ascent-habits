import { describe, expect, it } from 'vitest'
import {
  formatDueDate,
  formatFrequency,
  formatLongDate,
  formatMissedDay,
  formatValidations,
  plural,
} from './format.ts'

describe('format', () => {
  it('accorde le nombre de validations', () => {
    expect(formatValidations(0)).toBe('0 validation')
    expect(formatValidations(1)).toBe('1 validation')
    expect(formatValidations(12)).toBe('12 validations')
    expect(plural(2, 'jalon')).toBe('2 jalons')
  })

  it('résume la fréquence', () => {
    expect(formatFrequency({ type: 'daily' })).toBe('Tous les jours')
    expect(formatFrequency({ type: 'specificDays', days: [1, 3, 5] })).toBe('Lun. mer. ven.')
    expect(formatFrequency({ type: 'specificDays', days: [1, 2, 3, 4, 5] })).toBe('Du lundi au vendredi')
    expect(formatFrequency({ type: 'specificDays', days: [6, 7] })).toBe('Le week-end')
  })

  it('nomme le jour à rattraper', () => {
    expect(formatMissedDay('2026-09-30', '2026-10-01')).toBe('mercredi')
    expect(formatMissedDay('2026-10-02', '2026-10-05')).toBe('ven. 2 oct.')
  })

  it('formate les dates', () => {
    expect(formatLongDate('2026-10-04')).toBe('dimanche 4 octobre')
    expect(formatDueDate('2026-10-04', '2026-10-04')).toBe("aujourd'hui")
    expect(formatDueDate('2026-10-05', '2026-10-04')).toBe('demain')
    expect(formatDueDate('2026-10-12', '2026-10-04')).toBe('lun. 12 oct.')
  })
})
