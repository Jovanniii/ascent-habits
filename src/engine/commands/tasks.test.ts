import { describe, expect, it } from 'vitest'
import { makeAppData, makeContext } from '../testing/factories.ts'
import { CommandError } from './context.ts'
import { addTask, deleteTask, restoreTask, toggleTask, updateTask } from './tasks.ts'

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

describe('restoreTask', () => {
  function threeTasks() {
    const ctx = makeContext()
    let data = addTask(makeAppData({ goals: [goal] }), { name: 'Une' }, ctx)
    data = addTask(data, { name: 'Deux', goalId: 'goal-1' }, ctx)
    return addTask(data, { name: 'Trois' }, ctx)
  }

  it('remet la tâche supprimée à sa place', () => {
    const data = threeTasks()
    const removed = data.tasks[1]!
    const restored = restoreTask(deleteTask(data, removed.id), removed, 1)
    expect(restored).toEqual(data)
  })

  it('borne la position et retire un lien vers un objectif disparu', () => {
    const data = threeTasks()
    const removed = data.tasks[1]!
    const withoutGoal = { ...deleteTask(data, removed.id), goals: [] }
    const restored = restoreTask(withoutGoal, removed, 99)
    expect(restored.tasks.map((task) => task.name)).toEqual(['Une', 'Trois', 'Deux'])
    expect(restored.tasks[2]).not.toHaveProperty('goalId')
  })

  it('refuse de dupliquer une tâche existante', () => {
    const data = threeTasks()
    expect(() => restoreTask(data, data.tasks[0]!, 0)).toThrow(CommandError)
  })
})
