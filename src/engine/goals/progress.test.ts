import { describe, expect, it } from 'vitest'
import type { Milestone } from '../model.ts'
import { computeGoalProgress } from './progress.ts'

function milestone(id: string, status: Milestone['status'], goalId = 'goal-1'): Milestone {
  return { id, goalId, name: `Jalon ${id}`, status, createdAt: '2026-10-01T09:00:00.000Z' }
}

describe('computeGoalProgress', () => {
  it('vaut 0 % sans jalon', () => {
    expect(computeGoalProgress('goal-1', [])).toEqual({ done: 0, total: 0, ratio: 0, percent: 0, allDone: false })
  })

  it('calcule la part des jalons terminés', () => {
    const progress = computeGoalProgress('goal-1', [
      milestone('a', 'done'),
      milestone('b', 'todo'),
      milestone('c', 'todo'),
      milestone('d', 'todo'),
    ])
    expect(progress).toMatchObject({ done: 1, total: 4, ratio: 0.25, percent: 25, allDone: false })
  })

  it('baisse quand un jalon est ajouté et remonte quand un jalon est retiré', () => {
    const initial = [milestone('a', 'done'), milestone('b', 'done')]
    expect(computeGoalProgress('goal-1', initial)).toMatchObject({ percent: 100, allDone: true })

    const withNewMilestone = [...initial, milestone('c', 'todo')]
    expect(computeGoalProgress('goal-1', withNewMilestone)).toMatchObject({ percent: 66, allDone: false })

    const withoutMilestone = withNewMilestone.filter((m) => m.id !== 'c')
    expect(computeGoalProgress('goal-1', withoutMilestone)).toMatchObject({ percent: 100, allDone: true })
  })

  it("n'affiche 100 % que lorsque tout est terminé", () => {
    const milestones = Array.from({ length: 200 }, (_, index) => milestone(String(index), index === 0 ? 'todo' : 'done'))
    expect(computeGoalProgress('goal-1', milestones).percent).toBe(99)
  })

  it("évite les erreurs d'arrondi", () => {
    const milestones = Array.from({ length: 100 }, (_, index) => milestone(String(index), index < 29 ? 'done' : 'todo'))
    expect(computeGoalProgress('goal-1', milestones).percent).toBe(29)
  })

  it("ignore les jalons des autres objectifs", () => {
    const progress = computeGoalProgress('goal-1', [milestone('a', 'done'), milestone('b', 'todo', 'goal-2')])
    expect(progress).toMatchObject({ done: 1, total: 1, percent: 100 })
  })
})
