import { useCallback, useState } from 'react'
import type { Task } from '../../engine/index.ts'
import { getTheme } from '../../themes/index.ts'
import { TaskForm } from '../components/TaskForm.tsx'
import { ClearingTask, TaskItem } from '../components/TaskItem.tsx'
import { useAppStore } from '../state/store.ts'
import { useMotionAllowed } from '../state/useMotionAllowed.ts'

/** Tâches datées d'abord (par échéance), puis les autres par ordre de création. */
function compareTasks(a: Task, b: Task): number {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt)
  if (a.dueDate) return -1
  if (b.dueDate) return 1
  return a.createdAt.localeCompare(b.createdAt)
}

export function TasksScreen() {
  const { data } = useAppStore()
  const { allowed: motionAllowed } = useMotionAllowed(data.settings.animationsEnabled)
  const Illustration = getTheme(data.settings.themeId).TaskIllustration
  // Tâches qui viennent d'être cochées : leur obstacle se dégage un instant à leur place.
  const [clearing, setClearing] = useState<readonly string[]>([])
  const finishClearing = useCallback((taskId: string) => {
    setClearing((ids) => ids.filter((id) => id !== taskId))
  }, [])
  const startClearing = useCallback((task: Task) => {
    setClearing((ids) => [...ids.filter((id) => id !== task.id), task.id])
  }, [])

  const goalNames = new Map(data.goals.map((goal) => [goal.id, goal.name]))
  const todo = data.tasks.filter((task) => task.status === 'todo').sort(compareTasks)
  const done = data.tasks
    .filter((task) => task.status === 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const showClearing = Illustration !== undefined && motionAllowed
  const trail = data.tasks
    .filter((task) => task.status === 'todo' || (showClearing && task.status === 'done' && clearing.includes(task.id)))
    .sort(compareTasks)

  return (
    <section className="screen" aria-labelledby="tasks-title">
      <header className="screen__header">
        <h1 id="tasks-title" className="screen__title" tabIndex={-1}>Tâches</h1>
      </header>
      <TaskForm goals={data.goals.filter((goal) => goal.status === 'active')} />
      <section className="section" aria-labelledby="tasks-todo">
        <h2 id="tasks-todo" className="section__title" tabIndex={-1}>À faire</h2>
        {trail.length > 0 && (
          <ul className={`list${Illustration ? ' list--illustrated' : ''}`}>
            {trail.map((task) =>
              task.status === 'todo' ? (
                <TaskItem
                  key={task.id}
                  task={task}
                  goalName={task.goalId && goalNames.get(task.goalId)}
                  Illustration={Illustration}
                  motionAllowed={motionAllowed}
                  onCompleted={startClearing}
                />
              ) : (
                <ClearingTask
                  key={`clearing-${task.id}`}
                  task={task}
                  goalName={task.goalId && goalNames.get(task.goalId)}
                  Illustration={Illustration!}
                  onDone={finishClearing}
                />
              ),
            )}
          </ul>
        )}
        {todo.length === 0 && <p className="section__empty">Aucune tâche pour l’instant.</p>}
      </section>
      {done.length > 0 && (
        <details className="disclosure">
          <summary>Terminées ({done.length})</summary>
          <ul className="list">
            {done.map((task) => (
              <TaskItem key={task.id} task={task} goalName={task.goalId && goalNames.get(task.goalId)} />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
