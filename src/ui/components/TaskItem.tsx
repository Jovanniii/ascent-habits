import { useRef, type MouseEvent } from 'react'
import { deleteTask, restoreTask, toggleTask, type Task } from '../../engine/index.ts'
import { focusTask, prepareFocusAfterRemoval } from '../focus.ts'
import { formatDueDate } from '../format.ts'
import { useAppStore } from '../state/store.ts'

interface Props {
  task: Task
  /** Nom de l'objectif lié, s'il y en a un. */
  goalName?: string
}

export function TaskItem({ task, goalName }: Props) {
  const { data, today, run } = useAppStore()
  const checkboxRef = useRef<HTMLInputElement>(null)
  const done = task.status === 'done'
  const details = [task.dueDate && `Pour ${formatDueDate(task.dueDate, today)}`, goalName && `Objectif : ${goalName}`]
    .filter(Boolean)
    .join(' · ')

  const toggle = () => {
    // La tâche change de liste : le focus est déplacé, et le changement est annoncé
    // aux lecteurs d'écran sans message visible (une coche reste silencieuse).
    const restoreFocus = prepareFocusAfterRemoval(checkboxRef.current)
    const toggled = run((d, ctx) => toggleTask(d, task.id, ctx), {
      kind: 'info',
      message: done ? `« ${task.name} » remise à faire.` : `« ${task.name} » terminée.`,
      srOnly: true,
    })
    if (toggled) restoreFocus()
  }

  const remove = (event: MouseEvent<HTMLButtonElement>) => {
    // Activation au clavier (detail = 0) : le focus ira au bouton « Annuler ».
    // Au toucher ou à la souris : il va à l'élément voisin.
    const fromKeyboard = event.detail === 0
    const restoreFocus = fromKeyboard ? null : prepareFocusAfterRemoval(event.currentTarget)
    const index = data.tasks.findIndex((candidate) => candidate.id === task.id)
    const removed = run((d) => deleteTask(d, task.id), {
      kind: 'info',
      message: 'Tâche supprimée.',
      action: {
        label: 'Annuler',
        ariaLabel: `Annuler la suppression de « ${task.name} »`,
        takeFocus: fromKeyboard,
        onAction: () => {
          if (run((d) => restoreTask(d, task, index), 'Tâche restaurée.')) focusTask(task.id)
        },
      },
    })
    if (removed) restoreFocus?.()
  }

  return (
    <li className="card task" data-status={task.status} data-task-id={task.id}>
      <label className="task__toggle">
        <input ref={checkboxRef} type="checkbox" className="checkbox" checked={done} onChange={toggle} />
        <span className="task__text">
          <span className="task__name">{task.name}</span>
          {details && <span className="task__meta">{details}</span>}
        </span>
      </label>
      <button type="button" className="icon-button" aria-label={`Supprimer « ${task.name} »`} onClick={remove}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </li>
  )
}
