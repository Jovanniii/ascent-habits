import { describe, expect, it } from 'vitest'
import { computeGoalProgress } from '../goals/progress.ts'
import type { AppData } from '../model.ts'
import { makeAppData, makeContext, makeHabit } from '../testing/factories.ts'
import { CommandError } from './context.ts'
import {
  addMilestone,
  archiveGoal,
  createGoal,
  deleteGoal,
  deleteMilestone,
  markGoalAchieved,
  renameMilestone,
  reopenGoal,
  toggleMilestone,
  updateGoal,
} from './goals.ts'
import { addTask } from './tasks.ts'

function goalWithMilestones(names: string[]): AppData {
  const ctx = makeContext()
  let data = createGoal(makeAppData(), { name: 'Courir un semi-marathon', dueDate: '2027-04-01' }, ctx)
  for (const name of names) {
    data = addMilestone(data, 'id-1', name, ctx)
  }
  return data
}

describe('createGoal et updateGoal', () => {
  it('crée un objectif en cours avec une échéance optionnelle', () => {
    const data = createGoal(makeAppData(), { name: 'Apprendre le piano' }, makeContext())
    expect(data.goals).toEqual([
      { id: 'id-1', name: 'Apprendre le piano', status: 'active', createdAt: '2026-10-04T09:00:00.000Z' },
    ])
  })

  it("modifie le nom et l'échéance", () => {
    const data = goalWithMilestones([])
    const updated = updateGoal(data, 'id-1', { name: 'Courir un marathon', dueDate: null })
    expect(updated.goals[0]?.name).toBe('Courir un marathon')
    expect(updated.goals[0]).not.toHaveProperty('dueDate')
    expect(() => updateGoal(data, 'id-1', { dueDate: 'demain' })).toThrow(CommandError)
  })
})

describe('jalons', () => {
  it('ajoute, renomme, coche et supprime des jalons à tout moment', () => {
    let data = goalWithMilestones(['5 km', '10 km'])
    expect(data.milestones.map((m) => m.name)).toEqual(['5 km', '10 km'])

    data = renameMilestone(data, 'id-2', '5 km sans pause')
    data = toggleMilestone(data, 'id-2')
    expect(data.milestones[0]).toMatchObject({ name: '5 km sans pause', status: 'done', goalId: 'id-1' })

    data = deleteMilestone(data, 'id-3')
    expect(data.milestones).toHaveLength(1)

    data = toggleMilestone(data, 'id-2')
    expect(data.milestones[0]?.status).toBe('todo')
  })

  it('recalcule la progression quand des jalons sont ajoutés ou retirés', () => {
    const ctx = makeContext()
    let data = goalWithMilestones(['5 km', '10 km'])
    data = toggleMilestone(data, 'id-2')
    expect(computeGoalProgress('id-1', data.milestones).percent).toBe(50)

    data = addMilestone(data, 'id-1', '15 km', { ...ctx, newId: () => 'id-4' })
    expect(computeGoalProgress('id-1', data.milestones).percent).toBe(33)

    data = deleteMilestone(data, 'id-3')
    data = deleteMilestone(data, 'id-4')
    expect(computeGoalProgress('id-1', data.milestones)).toMatchObject({ percent: 100, allDone: true })
  })

  it('refuse un jalon sans nom ou pour un objectif inconnu', () => {
    expect(() => addMilestone(goalWithMilestones([]), 'id-1', ' ', makeContext())).toThrow(CommandError)
    expect(() => addMilestone(makeAppData(), 'inconnu', 'Jalon', makeContext())).toThrow(CommandError)
  })
})

describe('cycle de vie d’un objectif', () => {
  it('marque un objectif comme atteint puis le remet en cours', () => {
    const achieved = markGoalAchieved(goalWithMilestones([]), 'id-1', makeContext())
    expect(achieved.goals[0]).toMatchObject({ status: 'achieved', achievedAt: '2026-10-04T09:00:00.000Z' })
    expect(() => markGoalAchieved(achieved, 'id-1', makeContext())).toThrow(CommandError)

    const reopened = reopenGoal(achieved, 'id-1')
    expect(reopened.goals[0]?.status).toBe('active')
    expect(reopened.goals[0]).not.toHaveProperty('achievedAt')
  })

  it('archive un objectif', () => {
    expect(archiveGoal(goalWithMilestones([]), 'id-1').goals[0]?.status).toBe('archived')
  })

  it('supprime un objectif, ses jalons et les liens, sans supprimer habitudes ni tâches', () => {
    let data = goalWithMilestones(['5 km'])
    data = { ...data, habits: [makeHabit({ goalId: 'id-1' })] }
    data = addTask(data, { name: 'Acheter des chaussures', goalId: 'id-1' }, { ...makeContext(), newId: () => 'task-1' })

    const deleted = deleteGoal(data, 'id-1')
    expect(deleted.goals).toEqual([])
    expect(deleted.milestones).toEqual([])
    expect(deleted.habits[0]).not.toHaveProperty('goalId')
    expect(deleted.tasks[0]).not.toHaveProperty('goalId')
    expect(deleted.tasks).toHaveLength(1)
  })
})
