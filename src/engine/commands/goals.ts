/**
 * Commandes sur les objectifs et leurs jalons. Les jalons peuvent être ajoutés,
 * renommés, cochés ou supprimés à tout moment ; la progression est recalculée
 * à la lecture (voir goals/progress.ts).
 */
import type { LocalDate } from '../dates.ts'
import type { AppData, Goal, Milestone } from '../model.ts'
import { CommandError, type CommandContext } from './context.ts'
import { findOrThrow, normalizeName, normalizeOptionalDate, replaceById } from './validation.ts'

export interface NewGoalInput {
  name: string
  dueDate?: LocalDate
}

export interface GoalChanges {
  name?: string
  /** null retire l'échéance. */
  dueDate?: LocalDate | null
}

function findGoal(data: AppData, goalId: string): Goal {
  return findOrThrow(data.goals, goalId, 'Objectif')
}

function findMilestone(data: AppData, milestoneId: string): Milestone {
  return findOrThrow(data.milestones, milestoneId, 'Jalon')
}

export function createGoal(data: AppData, input: NewGoalInput, ctx: CommandContext): AppData {
  const dueDate = normalizeOptionalDate(input.dueDate)
  const goal: Goal = {
    id: ctx.newId(),
    name: normalizeName(input.name),
    status: 'active',
    createdAt: ctx.now,
    ...(dueDate !== undefined && { dueDate }),
  }
  return { ...data, goals: [...data.goals, goal] }
}

export function updateGoal(data: AppData, goalId: string, changes: GoalChanges): AppData {
  const updated: Goal = { ...findGoal(data, goalId) }
  if (changes.name !== undefined) {
    updated.name = normalizeName(changes.name)
  }
  if (changes.dueDate !== undefined) {
    const dueDate = normalizeOptionalDate(changes.dueDate)
    if (dueDate === undefined) delete updated.dueDate
    else updated.dueDate = dueDate
  }
  return { ...data, goals: replaceById(data.goals, updated) }
}

/**
 * Marque l'objectif comme atteint. C'est un choix explicite de l'utilisateur :
 * l'interface le suggère quand tous les jalons sont terminés, sans l'imposer.
 */
export function markGoalAchieved(data: AppData, goalId: string, ctx: CommandContext): AppData {
  const goal = findGoal(data, goalId)
  if (goal.status !== 'active') {
    throw new CommandError('invalid-state', "L'objectif n'est pas en cours.")
  }
  const updated: Goal = { ...goal, status: 'achieved', achievedAt: ctx.now }
  return { ...data, goals: replaceById(data.goals, updated) }
}

/** Remet en cours un objectif atteint ou archivé. */
export function reopenGoal(data: AppData, goalId: string): AppData {
  const updated: Goal = { ...findGoal(data, goalId), status: 'active' }
  delete updated.achievedAt
  return { ...data, goals: replaceById(data.goals, updated) }
}

export function archiveGoal(data: AppData, goalId: string): AppData {
  const updated: Goal = { ...findGoal(data, goalId), status: 'archived' }
  return { ...data, goals: replaceById(data.goals, updated) }
}

/** Supprime l'objectif et ses jalons ; les habitudes et tâches liées sont conservées, sans lien. */
export function deleteGoal(data: AppData, goalId: string): AppData {
  findGoal(data, goalId)
  return {
    ...data,
    goals: data.goals.filter((goal) => goal.id !== goalId),
    milestones: data.milestones.filter((milestone) => milestone.goalId !== goalId),
    habits: data.habits.map((habit) => {
      if (habit.goalId !== goalId) return habit
      const unlinked = { ...habit }
      delete unlinked.goalId
      return unlinked
    }),
    tasks: data.tasks.map((task) => {
      if (task.goalId !== goalId) return task
      const unlinked = { ...task }
      delete unlinked.goalId
      return unlinked
    }),
  }
}

export function addMilestone(data: AppData, goalId: string, name: string, ctx: CommandContext): AppData {
  findGoal(data, goalId)
  const milestone: Milestone = {
    id: ctx.newId(),
    goalId,
    name: normalizeName(name),
    status: 'todo',
    createdAt: ctx.now,
  }
  return { ...data, milestones: [...data.milestones, milestone] }
}

export function renameMilestone(data: AppData, milestoneId: string, name: string): AppData {
  const updated: Milestone = { ...findMilestone(data, milestoneId), name: normalizeName(name) }
  return { ...data, milestones: replaceById(data.milestones, updated) }
}

export function toggleMilestone(data: AppData, milestoneId: string): AppData {
  const milestone = findMilestone(data, milestoneId)
  const updated: Milestone = { ...milestone, status: milestone.status === 'done' ? 'todo' : 'done' }
  return { ...data, milestones: replaceById(data.milestones, updated) }
}

export function deleteMilestone(data: AppData, milestoneId: string): AppData {
  findMilestone(data, milestoneId)
  return { ...data, milestones: data.milestones.filter((milestone) => milestone.id !== milestoneId) }
}
