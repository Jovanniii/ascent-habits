import { describe, expect, it } from 'vitest'
import { makeAppData, makeContext } from '../testing/factories.ts'
import { CommandError } from './context.ts'
import { addTask, deleteTask, toggleTask, updateTask } from './tasks.ts'

const goal = { id: 'goal-1', name: 'Déménager', status: 'active' as const, createdAt: '' }

describe('addTask', () => {
  it('ajoute une tâche à faire, avec ou sans échéance', () => {
    const ctx = makeContext()
    let data = addTask(makeAppData(), { name: 'Appeler le plombier' }, ctx)
    data = addTask(data, { name: 'Payer le loyer', dueDate: '2026-10-05' }, ctx)
    expect(data.tasks).toEqual([
      { id: 'id-1', name: 'Appeler le plombier', status: 'todo', createdAt: '2026-10-04T09:00:00.000Z' },
      {
        id: 'id-2',
        name: 'Payer le loyer',
        status: 'todo',
        createdAt: '2026-10-04T09:00:00.000Z',
        dueDate: '2026-10-05',
      },
    ])
  })

  it('ignore une échéance vide et refuse une date invalide', () => {
    expect(addTask(makeAppData(), { name: 'Tâche', dueDate: '' }, makeContext()).tasks[0]).not.toHaveProperty('dueDate')
    expect(() => addTask(makeAppData(), { name: 'Tâche', dueDate: '2026-02-30' }, makeContext())).toThrow(CommandError)
  })

  it('peut être liée à un objectif existant uniquement', () => {
    const data = addTask(makeAppData({ goals: [goal] }), { name: 'Cartons', goalId: 'goal-1' }, makeContext())
    expect(data.tasks[0]?.goalId).toBe('goal-1')
    expect(() => addTask(makeAppData(), { name: 'Cartons', goalId: 'goal-1' }, makeContext())).toThrow(CommandError)
  })
})

describe('toggleTask', () => {
  it("passe la tâche dans l'historique puis la remet à faire", () => {
    const created = addTask(makeAppData(), { name: 'Courses' }, makeContext())
    const done = toggleTask(created, 'id-1', makeContext())
    expect(done.tasks[0]).toMatchObject({ status: 'done', completedAt: '2026-10-04T09:00:00.000Z' })

    const reopened = toggleTask(done, 'id-1', makeContext())
    expect(reopened.tasks[0]?.status).toBe('todo')
    expect(reopened.tasks[0]).not.toHaveProperty('completedAt')
  })
})

describe('updateTask et deleteTask', () => {
  it("modifie le nom, l'échéance et le lien avec un objectif", () => {
    const created = addTask(makeAppData({ goals: [goal] }), { name: 'Courses', dueDate: '2026-10-05' }, makeContext())
    const updated = updateTask(created, 'id-1', { name: 'Grandes courses', dueDate: null, goalId: 'goal-1' })
    expect(updated.tasks[0]).toMatchObject({ name: 'Grandes courses', goalId: 'goal-1' })
    expect(updated.tasks[0]).not.toHaveProperty('dueDate')
    expect(updateTask(updated, 'id-1', { goalId: null }).tasks[0]).not.toHaveProperty('goalId')
  })

  it('supprime une tâche', () => {
    const created = addTask(makeAppData(), { name: 'Courses' }, makeContext())
    expect(deleteTask(created, 'id-1').tasks).toEqual([])
    expect(() => deleteTask(created, 'inconnue')).toThrow(CommandError)
  })
})
