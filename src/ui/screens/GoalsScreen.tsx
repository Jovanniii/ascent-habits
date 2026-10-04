import { GoalCard } from '../components/GoalCard.tsx'
import { GoalForm } from '../components/GoalForm.tsx'
import { useAppStore } from '../state/store.ts'

export function GoalsScreen() {
  const { data } = useAppStore()
  const active = data.goals.filter((goal) => goal.status === 'active')
  const achieved = data.goals.filter((goal) => goal.status === 'achieved')

  return (
    <section className="screen" aria-labelledby="goals-title">
      <header className="screen__header">
        <h1 id="goals-title" className="screen__title" tabIndex={-1}>Objectifs</h1>
      </header>
      <GoalForm />
      <section className="section" aria-labelledby="goals-active">
        <h2 id="goals-active" className="section__title">En cours</h2>
        {active.length === 0 ? (
          <p className="section__empty">Aucun objectif en cours.</p>
        ) : (
          <ul className="list">
            {active.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </ul>
        )}
      </section>
      {achieved.length > 0 && (
        <section className="section" aria-labelledby="goals-achieved">
          <h2 id="goals-achieved" className="section__title">Objectifs atteints</h2>
          <ul className="list">
            {achieved.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
