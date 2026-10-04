import { useState, type FormEvent } from 'react'
import { MAX_NAME_LENGTH, addTask, type Goal } from '../../engine/index.ts'
import { useAppStore } from '../state/store.ts'
import { GoalSelect } from './GoalSelect.tsx'

interface Props {
  goals: readonly Goal[]
}

export function TaskForm({ goals }: Props) {
  const { run } = useAppStore()
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [goalId, setGoalId] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length === 0) return
    const added = run(
      (d, ctx) =>
        addTask(d, { name, ...(dueDate && { dueDate }), ...(goalId && { goalId }) }, ctx),
      'Tâche ajoutée.',
    )
    if (added) {
      setName('')
      setDueDate('')
      setGoalId('')
    }
  }

  return (
    <form className="form card" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Nouvelle tâche</span>
        <input
          className="input"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Ex. Appeler le garage"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="field">
        <span className="field__label">Échéance (facultatif)</span>
        <input className="input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </label>
      <GoalSelect goals={goals} value={goalId} onChange={setGoalId} />
      <div className="actions">
        <button type="submit" className="button button--primary" disabled={name.trim().length === 0}>
          Ajouter la tâche
        </button>
      </div>
    </form>
  )
}
