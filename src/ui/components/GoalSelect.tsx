import type { Goal } from '../../engine/index.ts'

interface Props {
  goals: readonly Goal[]
  value: string
  onChange: (goalId: string) => void
}

/** Choix facultatif d'un objectif lié ; masqué s'il n'existe aucun objectif en cours. */
export function GoalSelect({ goals, value, onChange }: Props) {
  if (goals.length === 0) return null
  return (
    <label className="field">
      <span className="field__label">Objectif lié (facultatif)</span>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Aucun</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.name}
          </option>
        ))}
      </select>
    </label>
  )
}
