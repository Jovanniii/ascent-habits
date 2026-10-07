import { useEffect, useRef, type ComponentType, type MouseEvent } from 'react'
import { deleteTask, restoreTask, toggleTask, type Task } from '../../engine/index.ts'
import type { TaskIllustrationProps } from '../../themes/index.ts'
import { focusTask, prepareFocusAfterRemoval } from '../focus.ts'
import { formatDueDate } from '../format.ts'
import { useAppStore } from '../state/store.ts'

interface Props {
  task: Task
  /** Nom de l'objectif lié, s'il y en a un. */
  goalName?: string
  /** Illustration décorative fournie par le thème (tâches à faire seulement). */
  Illustration?: ComponentType<TaskIllustrationProps>
  motionAllowed?: boolean
  /** Appelé quand la tâche vient d'être cochée (pour l'animation de dégagement). */
  onCompleted?: (task: Task) => void
}

/** Durée de l'animation de dégagement après la coche. */
export const CLEARING_DURATION_MS = 700

function taskDetails(task: Task, today: string, goalName: string | undefined): string {
  return [task.dueDate && `Pour ${formatDueDate(task.dueDate, today)}`, goalName && `Objectif : ${goalName}`]
    .filter(Boolean)
    .join(' · ')
}

export function TaskItem({ task, goalName, Illustration, motionAllowed = false, onCompleted }: Props) {
  const { data, today, run } = useAppStore()
  const checkboxRef = useRef<HTMLInputElement>(null)
  const done = task.status === 'done'
  const details = taskDetails(task, today, goalName)
  const illustrated = Illustration !== undefined && !done

  const toggle = () => {
    // La tâche change de liste : le focus est déplacé, et le changement est annoncé
    // aux lecteurs d'écran sans message visible (une coche reste silencieuse).
    const restoreFocus = prepareFocusAfterRemoval(checkboxRef.current)
    const toggled = run((d, ctx) => toggleTask(d, task.id, ctx), {
      kind: 'info',
      message: done ? `« ${task.name} » remise à faire.` : `« ${task.name} » terminée.`,
      srOnly: true,
    })
    if (toggled) {
      restoreFocus()
      if (!done) onCompleted?.(task)
    }
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
    <li className={`card task${illustrated ? ' task--illustrated' : ''}`} data-status={task.status} data-task-id={task.id}>
      <label className="task__toggle">
        <input ref={checkboxRef} type="checkbox" className="checkbox" checked={done} onChange={toggle} />
        {illustrated && (
          <span className="task__illustration">
            <Illustration taskId={task.id} clearing={false} motionAllowed={motionAllowed} />
          </span>
        )}
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

interface ClearingProps {
  task: Task
  goalName?: string
  Illustration: ComponentType<TaskIllustrationProps>
  onDone: (taskId: string) => void
}

/**
 * Copie décorative d'une tâche qui vient d'être cochée : elle reste un instant à
 * sa place dans « À faire » pour jouer l'animation de dégagement. La vraie tâche
 * est déjà dans « Terminées » ; cette copie est masquée aux lecteurs d'écran et
 * ne contient aucun élément interactif.
 */
export function ClearingTask({ task, goalName, Illustration, onDone }: ClearingProps) {
  const { today } = useAppStore()
  const details = taskDetails(task, today, goalName)

  useEffect(() => {
    const timer = setTimeout(() => onDone(task.id), CLEARING_DURATION_MS)
    return () => clearTimeout(timer)
  }, [task.id, onDone])

  return (
    <li className="card task task--illustrated task--clearing" aria-hidden="true">
      <span className="task__toggle">
        <span className="task__checked">
          <svg viewBox="0 0 24 24" className="check__icon">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="task__illustration">
          <Illustration taskId={task.id} clearing motionAllowed />
        </span>
        <span className="task__text">
          <span className="task__name">{task.name}</span>
          {details && <span className="task__meta">{details}</span>}
        </span>
      </span>
    </li>
  )
}
