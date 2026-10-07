import { useEffect, useMemo, useRef } from 'react'
import { deriveHabitProgress, getTheme } from '../../themes/index.ts'
import { formatStage, formatValidations } from '../format.ts'
import { useAppStore } from '../state/store.ts'
import { useMotionAllowed } from '../state/useMotionAllowed.ts'

interface Props {
  onBack: () => void
}

/**
 * Vue d'ensemble en lecture seule : toutes les habitudes en cours ou en pause,
 * côte à côte. Le décor vient du thème (décoratif) ; les mêmes informations sont
 * données en texte en dessous. Aucune case à cocher ici.
 */
export function PanoramaScreen({ onBack }: Props) {
  const { data, today } = useAppStore()
  const { allowed: motionAllowed } = useMotionAllowed(data.settings.animationsEnabled)
  const Panorama = getTheme(data.settings.themeId).Panorama
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // À l'ouverture, le focus va au titre (lecteurs d'écran) et l'écran revient en haut.
    titleRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [])

  const items = useMemo(
    () =>
      data.habits
        .filter((habit) => habit.status !== 'archived')
        .map((habit) => ({ habit, derived: deriveHabitProgress(habit, data.completions, today) })),
    [data.habits, data.completions, today],
  )

  return (
    <section className="screen" aria-labelledby="panorama-title">
      <header className="screen__header screen__header--action">
        <h1 id="panorama-title" ref={titleRef} className="screen__title" tabIndex={-1}>
          Panorama
        </h1>
        <button type="button" className="button button--secondary" aria-label="Retour à Aujourd’hui" onClick={onBack}>
          Retour
        </button>
        <p className="screen__subtitle">Toutes les habitudes.</p>
      </header>

      {Panorama && items.length > 0 && (
        <Panorama
          habits={items.map(({ habit, derived }) => ({ id: habit.id, label: habit.name, progress: derived.visual }))}
          motionAllowed={motionAllowed}
        />
      )}

      {items.length === 0 ? (
        <p className="section__empty">Aucune habitude en cours.</p>
      ) : (
        <ul className="list panorama-list">
          {items.map(({ habit, derived }) => (
            <li key={habit.id} className="card panorama-list__item">
              <h2 className="panorama-list__name">{habit.name}</h2>
              <p className="panorama-list__detail">
                {habit.status === 'paused' ? 'En pause · ' : ''}
                Série actuelle : {formatValidations(derived.streak.current)}
                {derived.actual.highestStage && ` · palier ${formatStage(derived.actual.highestStage)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
