import { useMemo } from 'react'
import { computeGoalProgress, type AppData, type LocalDate } from '../../engine/index.ts'
import { deriveHabitProgress, type SceneGoal, type SceneHabit } from '../../themes/index.ts'

export interface SceneData {
  habits: SceneHabit[]
  goals: SceneGoal[]
  pendingTasks: number
}

/** Tâches du jour : à faire, prévues aujourd'hui ou en retard (même règle que l'écran Aujourd'hui). */
export function isTaskForToday(task: AppData['tasks'][number], today: LocalDate): boolean {
  return task.status === 'todo' && task.dueDate !== undefined && task.dueDate <= today
}

/** Données neutres du grand décor : habitudes en cours ou en pause, objectifs en cours, tâches du jour. */
export function sceneData(data: AppData, today: LocalDate): SceneData {
  return {
    habits: data.habits
      .filter((habit) => habit.status !== 'archived')
      .map((habit) => ({
        id: habit.id,
        label: habit.name,
        progress: deriveHabitProgress(habit, data.completions, today).visual,
        paused: habit.status === 'paused',
      })),
    goals: data.goals
      .filter((goal) => goal.status === 'active')
      .map((goal) => ({ id: goal.id, label: goal.name, progress: computeGoalProgress(goal.id, data.milestones), achieved: false })),
    pendingTasks: data.tasks.filter((task) => isTaskForToday(task, today)).length,
  }
}

export function useSceneData(data: AppData, today: LocalDate): SceneData {
  return useMemo(() => sceneData(data, today), [data, today])
}
