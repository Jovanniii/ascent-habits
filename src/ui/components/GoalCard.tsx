import { useEffect, useState, type ComponentType, type FormEvent } from 'react'
import {
  MAX_NAME_LENGTH,
  toLocalDate,
  addMilestone,
  computeGoalProgress,
  deleteGoal,
  deleteMilestone,
  markGoalAchieved,
  renameMilestone,
  reopenGoal,
  toggleMilestone,
  type Goal,
  type Milestone,
} from '../../engine/index.ts'
import { getTheme, type GoalSceneProps } from '../../themes/index.ts'
import { formatFullDate, plural } from '../format.ts'
import { useAppStore } from '../state/store.ts'
import { useMotionAllowed } from '../state/useMotionAllowed.ts'
import { Dialog } from './Dialog.tsx'
import { ProgressBar } from './ProgressBar.tsx'

interface Props {
  goal: Goal
  /** Appelé juste après « Marquer comme atteint » (célébration, focus). */
  onAchieved?: (goal: Goal) => void
}

/** Durée de la célébration qui suit « Marquer comme atteint ». */
export const CELEBRATION_DURATION_MS = 1800

/** « Atteint le 7 octobre 2026 », d'après l'instant enregistré. */
function achievedText(goal: Goal): string | null {
  if (!goal.achievedAt) return null
  const instant = new Date(goal.achievedAt)
  return Number.isNaN(instant.getTime()) ? null : `Atteint le ${formatFullDate(toLocalDate(instant))}`
}

export function GoalCard({ goal, onAchieved }: Props) {
  const { data, run } = useAppStore()
  const { allowed: motionAllowed } = useMotionAllowed(data.settings.animationsEnabled)
  const GoalScene = getTheme(data.settings.themeId).GoalScene
  const [newMilestone, setNewMilestone] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const milestones = data.milestones.filter((milestone) => milestone.goalId === goal.id)
  const progress = computeGoalProgress(goal.id, data.milestones)
  const linkedHabits = data.habits.filter((habit) => habit.goalId === goal.id && habit.status !== 'archived')
  const linkedTasks = data.tasks.filter((task) => task.goalId === goal.id)
  const achieved = goal.status === 'achieved'

  const handleAddMilestone = (event: FormEvent) => {
    event.preventDefault()
    if (newMilestone.trim().length === 0) return
    if (run((d, ctx) => addMilestone(d, goal.id, newMilestone, ctx), 'Jalon ajouté.')) {
      setNewMilestone('')
    }
  }

  return (
    <li className="card goal" data-status={goal.status}>
      <div className="goal__header">
        <h3 className="goal__name">{goal.name}</h3>
        {achieved
          ? achievedText(goal) && <p className="goal__meta">{achievedText(goal)}</p>
          : goal.dueDate && <p className="goal__meta">Échéance : {formatFullDate(goal.dueDate)}</p>}
      </div>

      {GoalScene && (
        <div className="goal__scene">
          <GoalScene progress={progress} achieved={achieved} celebrating={false} motionAllowed={motionAllowed} />
        </div>
      )}

      {achieved ? (
        // Trophée : vue compacte, jalons consultables à la demande.
        milestones.length > 0 && (
          <details className="disclosure">
            <summary>Jalons ({milestones.length})</summary>
            <ul className="milestones">
              {milestones.map((milestone) => (
                <MilestoneItem key={milestone.id} milestone={milestone} readOnly />
              ))}
            </ul>
          </details>
        )
      ) : (
        <>
          <ProgressBar percent={progress.percent} label={`Progression de « ${goal.name} »`} />
          <p className="goal__meta">
            {progress.total === 0
              ? 'Aucun jalon pour l’instant.'
              : `${progress.done} ${progress.done > 1 ? 'jalons terminés' : 'jalon terminé'} sur ${progress.total} · ${progress.percent} %`}
          </p>

          {milestones.length > 0 && (
            <ul className="milestones">
              {milestones.map((milestone) => (
                <MilestoneItem key={milestone.id} milestone={milestone} readOnly={false} />
              ))}
            </ul>
          )}
        </>
      )}

      {!achieved && (
        <form className="inline-form" onSubmit={handleAddMilestone}>
          <label className="visually-hidden" htmlFor={`milestone-${goal.id}`}>
            Nouveau jalon pour « {goal.name} »
          </label>
          <input
            id={`milestone-${goal.id}`}
            className="input"
            value={newMilestone}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Nouveau jalon"
            onChange={(event) => setNewMilestone(event.target.value)}
          />
          <button type="submit" className="button button--secondary" disabled={newMilestone.trim().length === 0}>
            Ajouter
          </button>
        </form>
      )}

      {(linkedHabits.length > 0 || linkedTasks.length > 0) && (
        <p className="goal__meta">
          Lié à :{' '}
          {[
            linkedHabits.length > 0 && plural(linkedHabits.length, 'habitude'),
            linkedTasks.length > 0 && plural(linkedTasks.length, 'tâche'),
          ]
            .filter(Boolean)
            .join(' et ')}
        </p>
      )}

      {!achieved && progress.allDone && <p className="callout">Tous les jalons sont terminés.</p>}

      <div className="actions actions--wrap">
        {achieved ? (
          <button type="button" className="button button--secondary" onClick={() => run((d) => reopenGoal(d, goal.id))}>
            Remettre en cours
          </button>
        ) : (
          <button
            type="button"
            className={`button ${progress.allDone ? 'button--primary' : 'button--secondary'}`}
            onClick={() => {
              if (run((d, ctx) => markGoalAchieved(d, goal.id, ctx), `« ${goal.name} » est atteint. Bravo !`)) {
                onAchieved?.(goal)
              }
            }}
          >
            Marquer comme atteint
          </button>
        )}
        <button type="button" className="button button--secondary" onClick={() => setConfirmingDelete(true)}>
          Supprimer
        </button>
      </div>

      <Dialog open={confirmingDelete} title="Supprimer cet objectif ?" onClose={() => setConfirmingDelete(false)}>
        <p>
          « {goal.name} » et ses jalons seront supprimés. Les habitudes et tâches liées sont conservées.
        </p>
        <div className="actions">
          <button type="button" className="button button--secondary" onClick={() => setConfirmingDelete(false)}>
            Annuler
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => run((d) => deleteGoal(d, goal.id), 'Objectif supprimé.')}
          >
            Supprimer
          </button>
        </div>
      </Dialog>
    </li>
  )
}

interface CelebrationProps {
  goal: Goal
  Scene?: ComponentType<GoalSceneProps>
  onDone: (goalId: string) => void
}

/**
 * Copie décorative d'un objectif qui vient d'être atteint : elle reste un instant
 * à sa place dans « En cours » pour la célébration, pendant que le vrai objectif
 * rejoint le tableau de trophées. Masquée aux lecteurs d'écran (le message
 * « … est atteint. Bravo ! » est annoncé), sans élément interactif.
 */
export function GoalCelebration({ goal, Scene, onDone }: CelebrationProps) {
  const { data } = useAppStore()
  const progress = computeGoalProgress(goal.id, data.milestones)

  useEffect(() => {
    const timer = setTimeout(() => onDone(goal.id), CELEBRATION_DURATION_MS)
    return () => clearTimeout(timer)
  }, [goal.id, onDone])

  return (
    <li className="card goal goal--celebrating" aria-hidden="true">
      <p className="goal__name">{goal.name}</p>
      {Scene ? (
        <div className="goal__scene">
          <Scene progress={progress} achieved celebrating motionAllowed />
        </div>
      ) : (
        <span className="goal__badge">
          <svg viewBox="0 0 24 24" className="check__icon">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
      <p className="callout">Objectif atteint. Bravo !</p>
    </li>
  )
}

function MilestoneItem({ milestone, readOnly }: { milestone: Milestone; readOnly: boolean }) {
  const { run } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(milestone.name)

  const handleRename = (event: FormEvent) => {
    event.preventDefault()
    if (run((d) => renameMilestone(d, milestone.id, name))) setEditing(false)
  }

  if (editing) {
    return (
      <li className="milestone">
        <form className="inline-form" onSubmit={handleRename}>
          <label className="visually-hidden" htmlFor={`rename-${milestone.id}`}>
            Nouveau nom du jalon
          </label>
          <input
            id={`rename-${milestone.id}`}
            className="input"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit" className="button button--secondary" disabled={name.trim().length === 0}>
            OK
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setName(milestone.name)
              setEditing(false)
            }}
          >
            Annuler
          </button>
        </form>
      </li>
    )
  }

  return (
    <li className="milestone" data-status={milestone.status}>
      <label className="milestone__toggle">
        <input
          type="checkbox"
          className="checkbox"
          checked={milestone.status === 'done'}
          disabled={readOnly}
          onChange={() => run((d) => toggleMilestone(d, milestone.id))}
        />
        <span className="milestone__name">{milestone.name}</span>
      </label>
      {!readOnly && (
        <span className="milestone__actions">
          <button
            type="button"
            className="icon-button"
            aria-label={`Renommer le jalon « ${milestone.name} »`}
            onClick={() => setEditing(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16v4z" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`Supprimer le jalon « ${milestone.name} »`}
            onClick={() => run((d) => deleteMilestone(d, milestone.id), 'Jalon supprimé.')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      )}
    </li>
  )
}
