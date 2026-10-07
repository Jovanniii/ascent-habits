/**
 * Commandes sur les tâches ponctuelles.
 */
import type { LocalDate } from '../dates.ts'
import type { AppData, Task } from '../model.ts'
import { CommandError, type CommandContext } from './context.ts'
import { findOrThrow, normalizeName, normalizeOptionalDate, replaceById } from './validation.ts'

export interface NewTaskInput {
  name: string
  dueDate?: LocalDate
  goalId?: string
}

export interface TaskChanges {
  name?: string
  /** null retire l'échéance. */
  dueDate?: LocalDate | null
  /** null retire le lien avec l'objectif. */
  goalId?: string | null
}

export function addTask(data: AppData, input: NewTaskInput, ctx: CommandContext): AppData {
  if (input.goalId !== undefined) findOrThrow(data.goals, input.goalId, 'Objectif')
  const dueDate = normalizeOptionalDate(input.dueDate)
  const task: Task = {
    id: ctx.newId(),
    name: normalizeName(input.name),
    status: 'todo',
    createdAt: ctx.now,
    ...(dueDate !== undefined && { dueDate }),
    ...(input.goalId !== undefined && { goalId: input.goalId }),
  }
  return { ...data, tasks: [...data.tasks, task] }
}

export function updateTask(data: AppData, taskId: string, changes: TaskChanges): AppData {
  const updated: Task = { ...findOrThrow(data.tasks, taskId, 'Tâche') }
  if (changes.name !== undefined) {
    updated.name = normalizeName(changes.name)
  }
  if (changes.dueDate !== undefined) {
    const dueDate = normalizeOptionalDate(changes.dueDate)
    if (dueDate === undefined) delete updated.dueDate
    else updated.dueDate = dueDate
  }
  if (changes.goalId === null) {
    delete updated.goalId
  } else if (changes.goalId !== undefined) {
    findOrThrow(data.goals, changes.goalId, 'Objectif')
    updated.goalId = changes.goalId
  }
  return { ...data, tasks: replaceById(data.tasks, updated) }
}

/** Coche la tâche (elle passe dans l'historique) ou la remet à faire. */
export function toggleTask(data: AppData, taskId: string, ctx: CommandContext): AppData {
  const task = findOrThrow(data.tasks, taskId, 'Tâche')
  let updated: Task
  if (task.status === 'todo') {
    updated = { ...task, status: 'done', completedAt: ctx.now }
  } else {
    updated = { ...task, status: 'todo' }
    delete updated.completedAt
  }
  return { ...data, tasks: replaceById(data.tasks, updated) }
}

export function deleteTask(data: AppData, taskId: string): AppData {
  findOrThrow(data.tasks, taskId, 'Tâche')
  return { ...data, tasks: data.tasks.filter((task) => task.id !== taskId) }
}

/**
 * Remet une tâche supprimée à sa place (annulation d'une suppression). Le lien
 * avec un objectif supprimé entre-temps est retiré pour garder des données cohérentes.
 */
export function restoreTask(data: AppData, task: Task, index: number): AppData {
  if (data.tasks.some((existing) => existing.id === task.id)) {
    throw new CommandError('invalid-state', 'La tâche existe déjà.')
  }
  const restored: Task = { ...task }
  if (restored.goalId !== undefined && !data.goals.some((goal) => goal.id === restored.goalId)) {
    delete restored.goalId
  }
  const position = Math.min(Math.max(0, Math.trunc(index)), data.tasks.length)
  const tasks = [...data.tasks]
  tasks.splice(position, 0, restored)
  return { ...data, tasks }
}
