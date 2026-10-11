import { describe, expect, it } from 'vitest'
import { FIXED_DECOR_HOURS, decorHour, formatDecorHour } from './useDecorHour.ts'

describe('heure du décor', () => {
  it('suit l’heure réelle, ou l’heure fixée par le réglage « Ambiance »', () => {
    const date = new Date(2026, 9, 11, 16, 45)
    expect(decorHour('auto', date)).toBe(16.75)
    expect(decorHour('day', date)).toBe(FIXED_DECOR_HOURS.day)
    expect(decorHour('night', date)).toBe(FIXED_DECOR_HOURS.night)
  })

  it('s’écrit en heures et minutes', () => {
    expect(formatDecorHour(16.5)).toBe('16 h 30')
    expect(formatDecorHour(7)).toBe('7 h 00')
    expect(formatDecorHour(23.999)).toBe('0 h 00')
    expect(formatDecorHour(25.25)).toBe('1 h 15')
  })
})
