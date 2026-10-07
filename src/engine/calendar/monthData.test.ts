import { describe, expect, it } from 'vitest'
import type { Task } from '../model.ts'
import { completion, completionsBetween, makeHabit } from '../testing/factories.ts'
import { buildGlobalMonth, buildHabitMonth } from './monthData.ts'

const TODAY = '2026-10-04'
const OCTOBER = { year: 2026, month: 10 }
const SEPTEMBER = { year: 2026, month: 9 }
const utcDay = (timestamp: string) => timestamp.slice(0, 10)

describe('buildHabitMonth', () => {
  it('donne le mois en cours, incomplet : les jours après aujourd’hui sont futurs', () => {
    const month = buildHabitMonth(makeHabit(), completionsBetween('2026-09-28', '2026-10-03'), OCTOBER, TODAY)
    const days = month.weeks.flat().filter((day) => day !== null)
    expect(days).toHaveLength(31)
    expect(days.filter((day) => day.state === 'future')).toHaveLength(27)
    expect(days.find((day) => day.isToday)?.state).toBe('pending')
    expect(month.streak).toMatchObject({ current: 6, best: 6 })
  })

  it('garde la chaîne d’une série commencée le mois précédent', () => {
    const month = buildHabitMonth(makeHabit(), completionsBetween('2026-09-28', '2026-10-03'), OCTOBER, TODAY)
    const first = month.weeks[0]![3]!
    expect(first.date).toBe('2026-10-01')
    expect(first.chain).toEqual({ position: 'middle', length: 6 })
  })

  it('navigue de la création au mois en cours', () => {
    const october = buildHabitMonth(makeHabit(), [], OCTOBER, TODAY)
    expect(october).toMatchObject({ previous: SEPTEMBER, next: null })
    const september = buildHabitMonth(makeHabit(), [], SEPTEMBER, TODAY)
    expect(september).toMatchObject({ previous: null, next: OCTOBER })
  })

  it('passe de décembre à janvier', () => {
    const habit = makeHabit({ createdOn: '2026-12-30' })
    const january = buildHabitMonth(habit, completionsBetween('2026-12-30', '2027-01-02'), { year: 2027, month: 1 }, '2027-01-03')
    expect(january.previous).toEqual({ year: 2026, month: 12 })
    expect(january.weeks[0]![4]).toMatchObject({ date: '2027-01-01', chain: { position: 'middle', length: 4 } })
  })

  it('habitude sans historique : jours non validés et séries nulles, sans erreur', () => {
    const habit = makeHabit({ createdOn: '2026-10-02' })
    const month = buildHabitMonth(habit, [], OCTOBER, TODAY)
    const states = month.weeks.flat().filter((day) => day !== null).slice(0, 4).map((day) => day.state)
    expect(states).toEqual(['beforeCreation', 'notDone', 'notDone', 'pending'])
    expect(month.streak).toMatchObject({ current: 0, best: 0 })
    expect(month.previous).toBeNull()
  })

  it('distingue validé, rattrapé et noté après coup', () => {
    const completions = [completion('2026-10-01'), completion('2026-10-02', 'recovery'), completion('2026-09-29', 'late')]
    const month = buildHabitMonth(makeHabit(), completions, OCTOBER, TODAY)
    const [, , , d1, d2, d3] = month.weeks[0]!
    expect([d1?.state, d2?.state, d3?.state]).toEqual(['done', 'recovered', 'notDone'])
    expect(buildHabitMonth(makeHabit(), completions, SEPTEMBER, TODAY).weeks.flat().find((d) => d?.date === '2026-09-29')?.state).toBe('late')
  })
})

describe('buildGlobalMonth', () => {
  const task: Task = { id: 't', name: 'Ancien', status: 'done', createdAt: '2026-07-01T08:00:00.000Z', completedAt: '2026-08-15T10:00:00.000Z' }

  it('agrège chaque jour du mois', () => {
    const habits = [makeHabit({ id: 'a' }), makeHabit({ id: 'b' })]
    const completions = [completion('2026-10-01', 'normal', 'a'), completion('2026-10-02', 'normal', 'a'), completion('2026-10-02', 'normal', 'b')]
    const month = buildGlobalMonth({ habits, completions, tasks: [] }, OCTOBER, TODAY, utcDay)
    const levels = month.weeks[0]!.map((day) => day?.level ?? null)
    expect(levels).toEqual([null, null, null, 2, 4, 0, 0])
  })

  it('commence la navigation au premier jour qui a une donnée (tâche comprise)', () => {
    const month = buildGlobalMonth({ habits: [makeHabit()], completions: [], tasks: [task] }, SEPTEMBER, TODAY, utcDay)
    expect(month.previous).toEqual({ year: 2026, month: 8 })
    const august = buildGlobalMonth({ habits: [makeHabit()], completions: [], tasks: [task] }, { year: 2026, month: 8 }, TODAY, utcDay)
    expect(august.previous).toBeNull()
  })

  it('sans aucune donnée : un seul mois, sans erreur', () => {
    const month = buildGlobalMonth({ habits: [], completions: [], tasks: [] }, OCTOBER, TODAY, utcDay)
    expect(month).toMatchObject({ previous: null, next: null })
    expect(month.weeks.flat().every((day) => day === null || day.level === null)).toBe(true)
  })
})
