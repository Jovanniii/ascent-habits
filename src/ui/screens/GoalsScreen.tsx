import { useCallback, useState } from 'react'
import type { Goal } from '../../engine/index.ts'
import { getTheme } from '../../themes/index.ts'
import { GoalCard, GoalCelebration } from '../components/GoalCard.tsx'
import { GoalForm } from '../components/GoalForm.tsx'
import { useAppStore } from '../state/store.ts'
import { useMotionAllowed } from '../state/useMotionAllowed.ts'

/** Trophées les plus récents d'abord. */
function compareTrophies(a: Goal, b: Goal): number {
  return (b.achievedAt ?? '').localeCompare(a.achievedAt ?? '')
}

export function GoalsScreen() {
  const { data } = useAppStore()
  const { allowed: motionAllowed } = useMotionAllowed(data.settings.animationsEnabled)
  const Scene = getTheme(data.settings.themeId).GoalScene
  // Objectifs qui viennent d'être atteints : leur célébration se joue un instant à leur place.
  const [celebrating, setCelebrating] = useState<readonly string[]>([])
  const finishCelebration = useCallback((goalId: string) => {
    setCelebrating((ids) => ids.filter((id) => id !== goalId))
  }, [])
  const startCelebration = useCallback(
    (goal: Goal) => {
      if (motionAllowed) setCelebrating((ids) => [...ids.filter((id) => id !== goal.id), goal.id])
      // Le bouton disparaît : le focus va au tableau de trophées, sans faire défiler la célébration.
      setTimeout(() => document.getElementById('goals-trophies')?.focus({ preventScroll: true }), 0)
    },
    [motionAllowed],
  )

  const active = data.goals.filter((goal) => goal.status === 'active')
  const shown = data.goals.filter(
    (goal) => goal.status === 'active' || (goal.status === 'achieved' && motionAllowed && celebrating.includes(goal.id)),
  )
  const trophies = data.goals.filter((goal) => goal.status === 'achieved').sort(compareTrophies)

  return (
    <section className="screen" aria-labelledby="goals-title">
      <header className="screen__header">
        <h1 id="goals-title" className="screen__title" tabIndex={-1}>Objectifs</h1>
      </header>
      <GoalForm />
      <section className="section" aria-labelledby="goals-active">
        <h2 id="goals-active" className="section__title">En cours</h2>
        {shown.length > 0 && (
          <ul className="list">
            {shown.map((goal) =>
              goal.status === 'active' ? (
                <GoalCard key={goal.id} goal={goal} onAchieved={startCelebration} />
              ) : (
                <GoalCelebration key={`celebration-${goal.id}`} goal={goal} Scene={Scene} onDone={finishCelebration} />
              ),
            )}
          </ul>
        )}
        {active.length === 0 && <p className="section__empty">Aucun objectif en cours.</p>}
      </section>
      {trophies.length > 0 && (
        <section className="section" aria-labelledby="goals-trophies">
          <h2 id="goals-trophies" className="section__title" tabIndex={-1}>
            Tableau de trophées
          </h2>
          <ul className="list">
            {trophies.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
