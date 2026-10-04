import { useState, type FormEvent } from 'react'
import { MAX_NAME_LENGTH, type Frequency, type Goal } from '../../engine/index.ts'
import { FrequencyPicker } from './FrequencyPicker.tsx'
import { GoalSelect } from './GoalSelect.tsx'

export interface HabitFormValues {
  name: string
  frequency: Frequency
  /** Chaîne vide = aucun objectif lié. */
  goalId: string
}

interface Props {
  initialValues?: HabitFormValues
  goals: readonly Goal[]
  submitLabel: string
  onSubmit: (values: HabitFormValues) => void
  onCancel?: () => void
  autoFocus?: boolean
}

const EMPTY_VALUES: HabitFormValues = { name: '', frequency: { type: 'daily' }, goalId: '' }

export function HabitForm({ initialValues = EMPTY_VALUES, goals, submitLabel, onSubmit, onCancel, autoFocus }: Props) {
  const [values, setValues] = useState(initialValues)
  const canSubmit =
    values.name.trim().length > 0 && (values.frequency.type === 'daily' || values.frequency.days.length > 0)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (canSubmit) onSubmit(values)
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Nom de l'habitude</span>
        <input
          className="input"
          value={values.name}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Ex. Lire 10 pages"
          autoFocus={autoFocus}
          required
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
      </label>
      <FrequencyPicker value={values.frequency} onChange={(frequency) => setValues({ ...values, frequency })} />
      <GoalSelect goals={goals} value={values.goalId} onChange={(goalId) => setValues({ ...values, goalId })} />
      <div className="actions">
        {onCancel && (
          <button type="button" className="button button--secondary" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" className="button button--primary" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
