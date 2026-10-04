import { useState, type FormEvent } from 'react'
import {
  MAX_NAME_LENGTH,
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
import { formatFullDate, plural } from '../format.ts'
import { useAppStore } from '../state/store.ts'
import { Dialog } from './Dialog.tsx'
import { ProgressBar } from './ProgressBar.tsx'

interface Props {
  goal: Goal
}

export function GoalCard({ goal }: Props) {
  const { data, run } = useAppStore()
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
        {goal.dueDate && <p className="goal__meta">Échéance : {formatFullDate(goal.dueDate)}</p>}
      </div>

      <ProgressBar percent={progress.percent} label={`Progression de « ${goal.name} »`} />
      <p className="goal__meta">
        {progress.total === 0
          ? 'Aucun jalon pour l’instant.'
          : `${progress.done} ${progress.done > 1 ? 'jalons terminés' : 'jalon terminé'} sur ${progress.total} · ${progress.percent} %`}
      </p>

      {milestones.length > 0 && (
        <ul className="milestones">
          {milestones.map((milestone) => (
            <MilestoneItem key={milestone.id} milestone={milestone} readOnly={achieved} />
          ))}
        </ul>
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
            onClick={() => run((d, ctx) => markGoalAchieved(d, goal.id, ctx), `« ${goal.name} » est atteint. Bravo !`)}
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
