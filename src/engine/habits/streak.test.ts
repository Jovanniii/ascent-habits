import { describe, expect, it } from 'vitest'
import { addDays } from '../dates.ts'
import type { Frequency } from '../model.ts'
import { completion, completionsBetween, completionsOn, makeHabit } from '../testing/factories.ts'
import { computeStreak } from './streak.ts'

// Aujourd'hui, dans ces tests : dimanche 4 octobre 2026.
const TODAY = '2026-10-04'
const MON_WED_FRI: Frequency = { type: 'specificDays', days: [1, 3, 5] }

describe('computeStreak : habitude quotidienne', () => {
  it('vaut zéro sans aucune validation', () => {
    const streak = computeStreak(makeHabit(), [], TODAY)
    expect(streak).toMatchObject({ current: 0, best: 0, currentStartedOn: null, today: 'pending' })
  })

  it("compte les jours consécutifs jusqu'à hier quand aujourd'hui est en attente", () => {
    const streak = computeStreak(makeHabit(), completionsBetween('2026-09-25', '2026-10-03'), TODAY)
    expect(streak.current).toBe(9)
    expect(streak.today).toBe('pending')
    expect(streak.currentStartedOn).toBe('2026-09-25')
  })

  it("inclut aujourd'hui une fois validé", () => {
    const streak = computeStreak(makeHabit(), completionsBetween('2026-09-25', TODAY), TODAY)
    expect(streak.current).toBe(10)
    expect(streak.today).toBe('done')
  })

  it('repart à zéro après un jour prévu manqué', () => {
    const completions = [
      ...completionsBetween('2026-09-20', '2026-09-29'),
      // 30 septembre manqué
      ...completionsBetween('2026-10-01', '2026-10-03'),
    ]
    const streak = computeStreak(makeHabit(), completions, TODAY)
    expect(streak.current).toBe(3)
    expect(streak.currentStartedOn).toBe('2026-10-01')
    expect(streak.best).toBe(10)
  })

  it("vaut zéro quand hier est manqué et qu'aujourd'hui n'est pas encore validé", () => {
    const streak = computeStreak(makeHabit(), completionsBetween('2026-09-20', '2026-10-02'), TODAY)
    expect(streak.current).toBe(0)
    expect(streak.best).toBe(13)
  })

  it('repart à un si hier est manqué mais aujourd’hui validé', () => {
    const completions = [...completionsBetween('2026-09-20', '2026-10-02'), completion(TODAY)]
    expect(computeStreak(makeHabit(), completions, TODAY).current).toBe(1)
  })

  it('préserve la série quand le jour manqué est rattrapé', () => {
    const completions = [
      ...completionsBetween('2026-09-25', '2026-10-01'),
      completion('2026-10-02', 'recovery'),
      completion('2026-10-03'),
    ]
    expect(computeStreak(makeHabit(), completions, TODAY).current).toBe(9)
  })

  it("ne compte rien avant la création de l'habitude", () => {
    const habit = makeHabit({ createdOn: '2026-10-02' })
    const completions = completionsBetween('2026-09-20', '2026-10-03')
    expect(computeStreak(habit, completions, TODAY).current).toBe(2)
  })

  it("vaut zéro et « en attente » le jour de la création", () => {
    const streak = computeStreak(makeHabit({ createdOn: TODAY }), [], TODAY)
    expect(streak).toMatchObject({ current: 0, today: 'pending' })
  })

  it("reste nulle si la date du jour précède la création (horloge modifiée)", () => {
    const streak = computeStreak(makeHabit({ createdOn: '2026-10-10' }), [], TODAY)
    expect(streak).toMatchObject({ current: 0, today: 'unscheduled' })
  })

  it("ignore les validations d'autres habitudes et celles du futur", () => {
    const completions = [
      ...completionsBetween('2026-10-01', '2026-10-03', 'autre'),
      completion('2026-10-05'),
      completion('2026-10-03'),
    ]
    expect(computeStreak(makeHabit(), completions, TODAY).current).toBe(1)
  })

  it('tient sur un long historique', () => {
    const habit = makeHabit({ createdOn: '2025-08-01' })
    const completions = completionsBetween('2025-08-01', TODAY)
    const streak = computeStreak(habit, completions, TODAY)
    expect(streak.current).toBe(430)
    expect(streak.currentDurationDays).toBe(430)
  })

  it('mesure la durée de la série en jours calendaires', () => {
    const streak = computeStreak(makeHabit(), completionsBetween('2026-09-14', '2026-10-03'), TODAY)
    expect(streak.current).toBe(20)
    expect(streak.currentDurationDays).toBe(20)
  })

  it('retient la meilleure série même après une rupture', () => {
    const completions = [
      ...completionsBetween('2026-09-01', '2026-09-25'),
      ...completionsBetween('2026-09-28', '2026-10-03'),
    ]
    const streak = computeStreak(makeHabit(), completions, TODAY)
    expect(streak).toMatchObject({ current: 6, best: 25, bestDurationDays: 25 })
  })
})

describe('computeStreak : jours précis', () => {
  const habit = makeHabit({ frequency: MON_WED_FRI })

  it('compte les validations des jours prévus (unité : validations)', () => {
    const completions = completionsOn([
      '2026-09-21',
      '2026-09-23',
      '2026-09-25',
      '2026-09-28',
      '2026-09-30',
      '2026-10-02',
    ])
    const streak = computeStreak(habit, completions, TODAY)
    expect(streak.current).toBe(6)
    expect(streak.today).toBe('unscheduled')
    // Du lundi 21 septembre au vendredi 2 octobre inclus.
    expect(streak.currentDurationDays).toBe(12)
  })

  it('ne casse pas la série les jours non prévus', () => {
    const completions = completionsOn(['2026-09-28', '2026-09-30', '2026-10-02'])
    expect(computeStreak(habit, completions, '2026-10-05').current).toBe(3)
    expect(computeStreak(habit, completions, '2026-10-05').today).toBe('pending')
  })

  it('repart à zéro si un jour prévu est manqué', () => {
    const completions = completionsOn(['2026-09-25', '2026-09-28', '2026-10-02']) // mercredi 30 manqué
    expect(computeStreak(habit, completions, TODAY).current).toBe(1)
  })

  it('ignore les validations faites un jour non prévu', () => {
    const completions = completionsOn(['2026-09-28', '2026-09-29', '2026-09-30'])
    const streak = computeStreak(habit, completions, '2026-10-01')
    expect(streak.current).toBe(2)
    expect(streak.currentDurationDays).toBe(3)
  })
})

describe('computeStreak : pauses', () => {
  it('ne casse pas la série et ne compte pas les jours de pause dans la durée', () => {
    const habit = makeHabit({ pauses: [{ from: '2026-09-25', to: '2026-09-30' }] })
    const completions = [
      ...completionsBetween('2026-09-20', '2026-09-24'),
      ...completionsBetween('2026-10-01', '2026-10-03'),
    ]
    const streak = computeStreak(habit, completions, TODAY)
    expect(streak.current).toBe(8)
    expect(streak.currentDurationDays).toBe(8)
  })

  it('conserve la série pendant une pause en cours', () => {
    const habit = makeHabit({ status: 'paused', pauses: [{ from: '2026-10-01' }] })
    const streak = computeStreak(habit, completionsBetween('2026-09-20', '2026-09-30'), TODAY)
    expect(streak.current).toBe(11)
    expect(streak.today).toBe('unscheduled')
  })

  it('reprend la série après la pause', () => {
    const habit = makeHabit({ pauses: [{ from: '2026-09-10', to: '2026-09-30' }] })
    const completions = [
      ...completionsBetween('2026-09-01', '2026-09-09'),
      ...completionsBetween('2026-10-01', TODAY),
    ]
    expect(computeStreak(habit, completions, TODAY).current).toBe(13)
  })
})

describe('computeStreak : propriétés', () => {
  it('la série en cours ne dépasse jamais la meilleure série', () => {
    const habit = makeHabit({ createdOn: '2026-08-01' })
    // Une validation sur deux, puis une série continue.
    const sparse = []
    for (let day = '2026-08-01'; day < '2026-09-15'; day = addDays(day, 2)) {
      sparse.push(completion(day))
    }
    const completions = [...sparse, ...completionsBetween('2026-09-20', TODAY)]
    const streak = computeStreak(habit, completions, TODAY)
    expect(streak.current).toBeLessThanOrEqual(streak.best)
    expect(streak.current).toBe(15)
  })
})
