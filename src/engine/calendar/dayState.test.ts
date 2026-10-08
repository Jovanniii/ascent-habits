import { describe, expect, it } from 'vitest'
import type { Frequency } from '../model.ts'
import { completion, makeHabit } from '../testing/factories.ts'
import { getHabitDayState } from './dayState.ts'

// Aujourd'hui : dimanche 4 octobre 2026. Habitude créée le 1er septembre.
const TODAY = '2026-10-04'
const MON_WED_FRI: Frequency = { type: 'specificDays', days: [1, 3, 5] }

describe("getHabitDayState : état d'un jour pour une habitude", () => {
  const habit = makeHabit()

  it('validé le jour même', () => {
    expect(getHabitDayState(habit, [completion('2026-10-01')], '2026-10-01', TODAY)).toBe('done')
  })

  it('rattrapé', () => {
    expect(getHabitDayState(habit, [completion('2026-10-01', 'recovery')], '2026-10-01', TODAY)).toBe('recovered')
  })

  it('noté « fait après coup »', () => {
    expect(getHabitDayState(habit, [completion('2026-10-01', 'late')], '2026-10-01', TODAY)).toBe('late')
  })

  it('prévu mais non validé, dans le passé', () => {
    expect(getHabitDayState(habit, [], '2026-10-01', TODAY)).toBe('notDone')
  })

  it("aujourd'hui, en attente puis validé", () => {
    expect(getHabitDayState(habit, [], TODAY, TODAY)).toBe('pending')
    expect(getHabitDayState(habit, [completion(TODAY)], TODAY, TODAY)).toBe('done')
  })

  it('non prévu par la fréquence', () => {
    const habitMwf = makeHabit({ frequency: MON_WED_FRI })
    expect(getHabitDayState(habitMwf, [], '2026-10-01', TODAY)).toBe('unscheduled') // jeudi
    expect(getHabitDayState(habitMwf, [], '2026-09-30', TODAY)).toBe('notDone') // mercredi
  })

  it('futur, même si une validation existait', () => {
    expect(getHabitDayState(habit, [], '2026-10-05', TODAY)).toBe('future')
    expect(getHabitDayState(habit, [completion('2026-10-05')], '2026-10-05', TODAY)).toBe('future')
  })

  it("avant la création de l'habitude", () => {
    expect(getHabitDayState(habit, [], '2026-08-31', TODAY)).toBe('beforeCreation')
    expect(getHabitDayState(habit, [], '2026-09-01', TODAY)).toBe('notDone')
  })

  it("pendant une pause, bornes incluses, et pendant l'archivage en cours", () => {
    const paused = makeHabit({ pauses: [{ from: '2026-09-10', to: '2026-09-12' }, { from: '2026-10-02' }] })
    expect(getHabitDayState(paused, [], '2026-09-09', TODAY)).toBe('notDone')
    expect(getHabitDayState(paused, [], '2026-09-10', TODAY)).toBe('paused')
    expect(getHabitDayState(paused, [], '2026-09-12', TODAY)).toBe('paused')
    expect(getHabitDayState(paused, [], '2026-09-13', TODAY)).toBe('notDone')
    expect(getHabitDayState(paused, [], TODAY, TODAY)).toBe('paused')
  })

  it('validation un jour devenu non prévu (changement de fréquence)', () => {
    const habitMwf = makeHabit({ frequency: MON_WED_FRI })
    expect(getHabitDayState(habitMwf, [completion('2026-10-01')], '2026-10-01', TODAY)).toBe('offSchedule')
  })

  it("ignore les validations d'une autre habitude", () => {
    expect(getHabitDayState(habit, [completion('2026-10-01', 'normal', 'autre')], '2026-10-01', TODAY)).toBe('notDone')
  })
})
