import type { Task } from '../../engine/index.ts'
import { TaskForm } from '../components/TaskForm.tsx'
import { TaskItem } from '../components/TaskItem.tsx'
import { useAppStore } from '../state/store.ts'

/** Tâches datées d'abord (par échéance), puis les autres par ordre de création. */
function compareTasks(a: Task, b: Task): number {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt)
  if (a.dueDate) return -1
  if (b.dueDate) return 1
  return a.createdAt.localeCompare(b.createdAt)
}

export function TasksScreen() {
  const { data } = useAppStore()
  const goalNames = new Map(data.goals.map((goal) => [goal.id, goal.name]))
  const todo = data.tasks.filter((task) => task.status === 'todo').sort(compareTasks)
  const done = data.tasks
    .filter((task) => task.status === 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  return (
    <section className="screen" aria-labelledby="tasks-title">
      <header className="screen__header">
        <h1 id="tasks-title" className="screen__title" tabIndex={-1}>Tâches</h1>
      </header>
      <TaskForm goals={data.goals.filter((goal) => goal.status === 'active')} />
      <section className="section" aria-labelledby="tasks-todo">
        <h2 id="tasks-todo" className="section__title">À faire</h2>
        {todo.length === 0 ? (
          <p className="section__empty">Aucune tâche pour l’instant.</p>
        ) : (
          <ul className="list">
            {todo.map((task) => (
              <TaskItem key={task.id} task={task} goalName={task.goalId && goalNames.get(task.goalId)} />
            ))}
          </ul>
        )}
      </section>
      {done.length > 0 && (
        <details className="disclosure">
          <summary>Terminées ({done.length})</summary>
          <ul className="list">
            {done.map((task) => (
              <TaskItem key={task.id} task={task} goalName={task.goalId && goalNames.get(task.goalId)} deletable />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
