import { useState, type FormEvent } from 'react'
import { MAX_NAME_LENGTH, createGoal } from '../../engine/index.ts'
import { useAppStore } from '../state/store.ts'

export function GoalForm() {
  const { run } = useAppStore()
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length === 0) return
    if (run((d, ctx) => createGoal(d, { name, ...(dueDate && { dueDate }) }, ctx), 'Objectif créé.')) {
      setName('')
      setDueDate('')
    }
  }

  return (
    <form className="form card" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Nouvel objectif</span>
        <input
          className="input"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Ex. Courir 10 km"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="field">
        <span className="field__label">Échéance (facultatif)</span>
        <input className="input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </label>
      <div className="actions">
        <button type="submit" className="button button--primary" disabled={name.trim().length === 0}>
          Créer l’objectif
        </button>
      </div>
    </form>
  )
}
