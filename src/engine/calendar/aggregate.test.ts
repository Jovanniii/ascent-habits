import { describe, expect, it } from 'vitest'
import type { Task } from '../model.ts'
import { completion, makeHabit } from '../testing/factories.ts'
import { heatLevel, summarizeDay, type CalendarSource } from './aggregate.ts'

const TODAY = '2026-10-04'
/** Conversion déterministe pour les tests : le jour de l'horodatage UTC. */
const utcDay = (timestamp: string) => timestamp.slice(0, 10)

function task(overrides: Partial<Task>): Task {
  return { id: 'task-1', name: 'Courses', status: 'done', createdAt: '2026-09-30T08:00:00.000Z', ...overrides }
}

describe('heatLevel : niveaux d’intensité', () => {
  it('vaut null quand rien n’est prévu', () => {
    expect(heatLevel(0, 0)).toBeNull()
  })

  it('va de 0 (rien) à 4 (tout)', () => {
    expect(heatLevel(0, 3)).toBe(0)
    expect(heatLevel(3, 3)).toBe(4)
    expect(heatLevel(1, 1)).toBe(4)
  })

  it('place les niveaux intermédiaires par tiers', () => {
    expect(heatLevel(1, 4)).toBe(1) // 25 %
    expect(heatLevel(1, 3)).toBe(2) // 33 % : un tiers tout juste
    expect(heatLevel(1, 2)).toBe(2) // 50 %
    expect(heatLevel(2, 3)).toBe(3) // 67 % : deux tiers tout juste
    expect(heatLevel(4, 5)).toBe(3) // 80 %
    expect(heatLevel(1, 10)).toBe(1)
    expect(heatLevel(9, 10)).toBe(3)
  })

  it('ne dépasse jamais 4', () => {
    expect(heatLevel(5, 3)).toBe(4)
  })
})

describe('summarizeDay : agrégation globale', () => {
  const source: CalendarSource = {
    habits: [
      makeHabit({ id: 'lire', name: 'Lire' }),
      makeHabit({ id: 'mediter', name: 'Méditer' }),
      makeHabit({ id: 'courir', name: 'Courir', frequency: { type: 'specificDays', days: [1, 3, 5] } }),
      makeHabit({ id: 'yoga', name: 'Yoga', pauses: [{ from: '2026-09-25' }] }),
      makeHabit({ id: 'dessin', name: 'Dessin', createdOn: '2026-10-02' }),
    ],
    completions: [
      completion('2026-10-01', 'normal', 'lire'),
      completion('2026-10-01', 'recovery', 'mediter'),
      completion('2026-09-30', 'late', 'lire'),
      completion('2026-09-30', 'normal', 'courir'),
    ],
    tasks: [
      task({ id: 't1', completedAt: '2026-10-01T18:00:00.000Z' }),
      task({ id: 't2', completedAt: '2026-10-01T07:00:00.000Z' }),
      task({ id: 't3', status: 'todo' }),
      task({ id: 't4', completedAt: '2026-10-02T07:00:00.000Z' }),
    ],
  }

  it('compte prévues, validées et rattrapées ; ignore les habitudes non prévues, en pause ou pas encore créées', () => {
    // Jeudi 1er octobre : lire et méditer prévus (courir non, yoga en pause, dessin pas encore créé).
    const day = summarizeDay(source, '2026-10-01', TODAY, utcDay)
    expect(day).toMatchObject({ scheduled: 2, completed: 2, done: 1, recovered: 1, late: 0, level: 4 })
    expect(day.habits).toEqual([
      { habitId: 'lire', state: 'done' },
      { habitId: 'mediter', state: 'recovered' },
    ])
  })

  it('compte un jour noté après coup comme fait, à part', () => {
    // Mercredi 30 septembre : lire (après coup), méditer (non validé), courir (validé).
    const day = summarizeDay(source, '2026-09-30', TODAY, utcDay)
    expect(day).toMatchObject({ scheduled: 3, completed: 2, done: 1, late: 1, level: 3 })
    expect(day.habits.find((h) => h.habitId === 'mediter')?.state).toBe('notDone')
  })

  it('liste les tâches terminées ce jour-là', () => {
    expect(summarizeDay(source, '2026-10-01', TODAY, utcDay).completedTaskIds).toEqual(['t1', 't2'])
    expect(summarizeDay(source, '2026-09-30', TODAY, utcDay).completedTaskIds).toEqual([])
  })

  it("aujourd'hui : les habitudes en attente comptent comme prévues", () => {
    const day = summarizeDay(source, TODAY, TODAY, utcDay)
    expect(day).toMatchObject({ isToday: true, scheduled: 3, completed: 0, level: 0 })
    expect(day.habits.every((h) => h.state === 'pending')).toBe(true)
  })

  it('jour futur : rien de prévu à afficher', () => {
    const day = summarizeDay(source, '2026-10-05', TODAY, utcDay)
    expect(day).toMatchObject({ isFuture: true, scheduled: 0, level: null, habits: [], completedTaskIds: [] })
  })

  it('jour sans habitude prévue : niveau null mais tâches visibles', () => {
    const onlyTask: CalendarSource = { habits: [], completions: [], tasks: [task({ completedAt: '2026-10-01T10:00:00.000Z' })] }
    expect(summarizeDay(onlyTask, '2026-10-01', TODAY, utcDay)).toMatchObject({ level: null, completedTaskIds: ['task-1'] })
  })

  it('une validation hors programme apparaît dans le détail sans compter dans l’intensité', () => {
    const offSchedule: CalendarSource = { ...source, completions: [completion('2026-10-01', 'normal', 'courir')] }
    const day = summarizeDay(offSchedule, '2026-10-01', TODAY, utcDay)
    expect(day).toMatchObject({ scheduled: 2, completed: 0, level: 0 })
    expect(day.habits).toContainEqual({ habitId: 'courir', state: 'offSchedule' })
  })
})
