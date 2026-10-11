import { useEffect, useMemo, useRef, useState } from 'react'
import { deriveHabitProgress, getTheme } from '../../themes/index.ts'
import { formatStage, formatValidations, plural } from '../format.ts'
import { useAppStore } from '../state/store.ts'
import { formatDecorHour, useDecorHour } from '../state/useDecorHour.ts'
import { useMotionAllowed } from '../state/useMotionAllowed.ts'
import { useSceneData } from '../state/useSceneData.ts'

interface Props {
  onBack: () => void
}

/** Vitesse du défilement de l'heure : une heure du décor par seconde. */
const HOURS_PER_SECOND = 1
const TICK_MS = 50

/**
 * Vue d'ensemble en lecture seule : toutes les habitudes en cours ou en pause,
 * les objectifs en cours et les tâches du jour. Le décor vient du thème
 * (décoratif) ; les mêmes informations sont données en texte en dessous.
 * Aucune case à cocher ici. Le curseur « Heure du décor » permet de parcourir
 * la journée ; « Maintenant » revient à l'heure réelle.
 */
export function PanoramaScreen({ onBack }: Props) {
  const { data, today, now } = useAppStore()
  const { allowed: motionAllowed } = useMotionAllowed(data.settings.animationsEnabled)
  const theme = getTheme(data.settings.themeId)
  const { Scene, Panorama } = theme
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scene = useSceneData(data, today)
  const liveHour = useDecorHour(now)
  const [chosenHour, setChosenHour] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const hour = chosenHour ?? liveHour

  useEffect(() => {
    // À l'ouverture, le focus va au titre (lecteurs d'écran) et l'écran revient en haut.
    titleRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setChosenHour((current) => ((current ?? liveHour) + (HOURS_PER_SECOND * TICK_MS) / 1000) % 24)
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [playing, liveHour])

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
        <p className="screen__subtitle">{Scene ? 'Habitudes, objectifs et tâches du jour.' : 'Toutes les habitudes.'}</p>
      </header>

      {Scene ? (
        <>
          <Scene
            habits={scene.habits}
            goals={scene.goals}
            pendingTasks={scene.pendingTasks}
            hour={hour}
            variant="full"
            motionAllowed={motionAllowed}
          />
          <div className="decor-time">
            <div className="decor-time__head">
              <label htmlFor="decor-hour" className="decor-time__label">
                Heure du décor
              </label>
              <output htmlFor="decor-hour" className="decor-time__value">
                {formatDecorHour(hour)}
              </output>
            </div>
            <input
              id="decor-hour"
              type="range"
              className="decor-time__range"
              min={0}
              max={24}
              step={0.25}
              value={Math.round(hour * 4) / 4}
              aria-valuetext={formatDecorHour(hour)}
              onChange={(event) => {
                setPlaying(false)
                setChosenHour(Number(event.target.value) % 24)
              }}
            />
            <div className="decor-time__actions">
              <button type="button" className="button button--secondary" aria-pressed={playing} onClick={() => setPlaying((on) => !on)}>
                {playing ? 'Arrêter' : 'Faire défiler'}
              </button>
              <button
                type="button"
                className="button button--secondary"
                disabled={chosenHour === null}
                onClick={() => {
                  setPlaying(false)
                  setChosenHour(null)
                }}
              >
                Maintenant
              </button>
            </div>
          </div>
        </>
      ) : (
        Panorama &&
        items.length > 0 && (
          <Panorama
            habits={items.map(({ habit, derived }) => ({ id: habit.id, label: habit.name, progress: derived.visual }))}
            motionAllowed={motionAllowed}
          />
        )
      )}

      {items.length === 0 ? (
        <p className="section__empty">Aucune habitude en cours.</p>
      ) : (
        <ul className="list panorama-list" aria-label="Habitudes">
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

      {Scene && scene.goals.length > 0 && (
        <ul className="list panorama-list" aria-label="Objectifs en cours">
          {scene.goals.map((goal) => (
            <li key={goal.id} className="card panorama-list__item">
              <h2 className="panorama-list__name">{goal.label}</h2>
              <p className="panorama-list__detail">
                Objectif · jalons terminés : {goal.progress.done} sur {goal.progress.total}
              </p>
            </li>
          ))}
        </ul>
      )}

      {Scene && (
        <p className="panorama-tasks">
          {scene.pendingTasks === 0 ? 'Aucune tâche pour aujourd’hui.' : `${plural(scene.pendingTasks, 'tâche')} pour aujourd’hui.`}
        </p>
      )}
    </section>
  )
}
