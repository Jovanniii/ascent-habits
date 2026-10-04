import { deleteTask, toggleTask, type Task } from '../../engine/index.ts'
import { formatDueDate } from '../format.ts'
import { useAppStore } from '../state/store.ts'

interface Props {
  task: Task
  /** Nom de l'objectif lié, s'il y en a un. */
  goalName?: string
  /** Affiche le bouton de suppression (historique). */
  deletable?: boolean
}

export function TaskItem({ task, goalName, deletable = false }: Props) {
  const { today, run } = useAppStore()
  const done = task.status === 'done'
  const details = [task.dueDate && `Pour ${formatDueDate(task.dueDate, today)}`, goalName && `Objectif : ${goalName}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="card task" data-status={task.status}>
      <label className="task__toggle">
        <input
          type="checkbox"
          className="checkbox"
          checked={done}
          onChange={() => run((d, ctx) => toggleTask(d, task.id, ctx), done ? undefined : 'Tâche terminée.')}
        />
        <span className="task__text">
          <span className="task__name">{task.name}</span>
          {details && <span className="task__meta">{details}</span>}
        </span>
      </label>
      {deletable && (
        <button
          type="button"
          className="icon-button"
          aria-label={`Supprimer « ${task.name} »`}
          onClick={() => run((d) => deleteTask(d, task.id), 'Tâche supprimée.')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </li>
  )
}
