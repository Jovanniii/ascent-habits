import { describe, expect, it } from 'vitest'
import { completion, makeHabit } from '../testing/factories.ts'
import { isPausedOn, isScheduledOn, previousScheduledDay, validatedDates } from './schedule.ts'

describe('isScheduledOn', () => {
  it('prévoit une habitude quotidienne chaque jour à partir de sa création', () => {
    const habit = makeHabit({ createdOn: '2026-10-01' })
    expect(isScheduledOn(habit, '2026-09-30')).toBe(false)
    expect(isScheduledOn(habit, '2026-10-01')).toBe(true)
    expect(isScheduledOn(habit, '2026-10-04')).toBe(true)
  })

  it('ne prévoit que les jours choisis', () => {
    const habit = makeHabit({ frequency: { type: 'specificDays', days: [1, 3, 5] } })
    expect(isScheduledOn(habit, '2026-09-28')).toBe(true) // lundi
    expect(isScheduledOn(habit, '2026-09-29')).toBe(false) // mardi
    expect(isScheduledOn(habit, '2026-09-30')).toBe(true) // mercredi
    expect(isScheduledOn(habit, '2026-10-04')).toBe(false) // dimanche
  })

  it('exclut les jours de pause, bornes incluses', () => {
    const habit = makeHabit({ pauses: [{ from: '2026-09-25', to: '2026-09-27' }] })
    expect(isScheduledOn(habit, '2026-09-24')).toBe(true)
    expect(isScheduledOn(habit, '2026-09-25')).toBe(false)
    expect(isScheduledOn(habit, '2026-09-27')).toBe(false)
    expect(isScheduledOn(habit, '2026-09-28')).toBe(true)
  })

  it("exclut tous les jours d'une pause en cours", () => {
    const habit = makeHabit({ pauses: [{ from: '2026-10-02' }] })
    expect(isPausedOn(habit, '2026-10-01')).toBe(false)
    expect(isPausedOn(habit, '2026-10-02')).toBe(true)
    expect(isPausedOn(habit, '2027-01-01')).toBe(true)
  })
})

describe('previousScheduledDay', () => {
  it('renvoie la veille pour une habitude quotidienne', () => {
    expect(previousScheduledDay(makeHabit(), '2026-10-04')).toBe('2026-10-03')
  })

  it('renvoie le dernier jour choisi avant la date', () => {
    const habit = makeHabit({ frequency: { type: 'specificDays', days: [1, 3, 5] } })
    expect(previousScheduledDay(habit, '2026-10-04')).toBe('2026-10-02') // vendredi
    expect(previousScheduledDay(habit, '2026-10-05')).toBe('2026-10-02')
    expect(previousScheduledDay(habit, '2026-10-06')).toBe('2026-10-05')
  })

  it('saute les jours de pause', () => {
    const habit = makeHabit({ pauses: [{ from: '2026-10-01', to: '2026-10-03' }] })
    expect(previousScheduledDay(habit, '2026-10-04')).toBe('2026-09-30')
  })

  it("renvoie null s'il n'existe aucun jour prévu avant la date", () => {
    expect(previousScheduledDay(makeHabit({ createdOn: '2026-10-04' }), '2026-10-04')).toBeNull()
  })
})

describe('validatedDates', () => {
  it("ne retient que les validations de l'habitude qui comptent dans la série", () => {
    const dates = validatedDates('habit-1', [
      completion('2026-10-01'),
      completion('2026-10-02', 'recovery'),
      completion('2026-10-03', 'normal', 'autre'),
      completion('2026-09-30', 'late'),
    ])
    expect([...dates].sort()).toEqual(['2026-10-01', '2026-10-02'])
  })
})
