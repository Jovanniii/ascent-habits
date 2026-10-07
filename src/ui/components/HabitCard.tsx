import { useEffect, useId, useMemo, useState } from 'react'
import {
  cancelRecovery,
  recoverMissedDay,
  resumeHabit,
  toggleHabitToday,
  type Habit,
} from '../../engine/index.ts'
import { deriveHabitProgress, getTheme, type HabitGesture, type HabitProgress } from '../../themes/index.ts'
import { capitalize, formatFrequency, formatMissedDay, formatStage, formatValidations, plural } from '../format.ts'
import { useAppStore } from '../state/store.ts'
import { useMotionAllowed } from '../state/useMotionAllowed.ts'
import { HabitManageDialog } from './HabitManageDialog.tsx'

interface Props {
  habit: Habit
  /**
   * « today » : habitude à cocher aujourd'hui, illustrée si le thème le propose.
   * « compact » : habitude non prévue aujourd'hui, en pause ou archivée.
   */
  variant?: 'today' | 'compact'
  /** Rang dans la liste (décalage des animations d'un thème). */
  index?: number
}

/** Durée pendant laquelle un geste reste « en cours » pour l'animation. */
const GESTURE_DURATION_MS = 1200
let gestureCounter = 0

/** Prochain palier visé, cohérent avec la position affichée par le thème. */
function nextStageText(progress: HabitProgress): string {
  return `Prochain palier : ${formatStage(progress.next)}, encore ${plural(progress.next.daysRemaining, 'jour')}`
}

/** Version courte sur une ligne, pour la carte illustrée (la version complète est lue par les lecteurs d'écran). */
function compactTiersText(progress: HabitProgress): string {
  const next = `${formatStage(progress.next)} dans ${progress.next.daysRemaining} j`
  return progress.highestStage ? `Palier ${formatStage(progress.highestStage)} · prochain ${next}` : `Prochain palier ${next}`
}

/** Message positif quand une action fait atteindre une nouvelle étape. */
function celebrationText(habit: Habit, progress: HabitProgress): string | undefined {
  return progress.celebrated
    ? `Nouveau palier atteint pour « ${habit.name} » : ${formatStage(progress.celebrated)}. Bravo !`
    : undefined
}

export function HabitCard({ habit, variant = 'compact', index = 0 }: Props) {
  const { data, today, run } = useAppStore()
  const [managing, setManaging] = useState(false)
  const [gesture, setGesture] = useState<HabitGesture | null>(null)
  const { allowed: motionAllowed } = useMotionAllowed(data.settings.animationsEnabled)
  const summaryId = useId()

  useEffect(() => {
    if (!gesture) return
    const timer = setTimeout(() => setGesture(null), GESTURE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [gesture])

  // Recalcul seulement quand l'habitude, ses données ou le jour changent (pas à chaque message).
  const progress = useMemo(() => deriveHabitProgress(habit, data.completions, today), [habit, data.completions, today])
  const { streak, recovery } = progress
  const canCheck = habit.status === 'active' && streak.today !== 'unscheduled'
  const done = streak.today === 'done'
  const HabitScene = variant === 'today' && canCheck ? getTheme(data.settings.themeId).HabitScene : undefined

  const toggle = () => {
    const checking = !done
    // Un palier atteint grâce à cette coche est annoncé, avec un message positif.
    const feedback = checking
      ? celebrationText(
          habit,
          deriveHabitProgress(habit, [...data.completions, { habitId: habit.id, date: today, kind: 'normal' }], today)
            .actual,
        )
      : undefined
    if (run((d, ctx) => toggleHabitToday(d, habit.id, ctx), feedback)) {
      gestureCounter += 1
      setGesture({ kind: checking ? 'checked' : 'unchecked', id: gestureCounter })
    }
  }

  const checkLabel = `Valider « ${habit.name} » pour aujourd'hui`
  const menuButton = (
    <button
      type="button"
      className={`icon-button${HabitScene ? ' habit-scene__menu' : ''}`}
      aria-label={`Gérer « ${habit.name} »`}
      onClick={() => setManaging(true)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
      </svg>
    </button>
  )
  const highestText = progress.actual.highestStage
    ? `Plus haut palier atteint : ${formatStage(progress.actual.highestStage)}`
    : null

  return (
    <li
      className={`card habit${HabitScene ? ' habit--scene' : ''}`}
      data-status={habit.status}
      data-today={streak.today}
    >
      {HabitScene ? (
        <>
          <div className="habit-scene">
            <button
              type="button"
              className="habit-scene__toggle"
              aria-pressed={done}
              aria-label={checkLabel}
              aria-describedby={summaryId}
              onClick={toggle}
            >
              <HabitScene progress={progress.visual} gesture={gesture} motionAllowed={motionAllowed} index={index} />
              <span className="habit-scene__badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="check__icon">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
            </button>
            {menuButton}
          </div>
          <div className="habit__line">
            <h3 className="habit__name">{habit.name}</h3>
            <p className="streak streak--compact">
              <span className="visually-hidden">Série actuelle : </span>
              <span className="streak__value">{formatValidations(streak.current)}</span>
            </p>
          </div>
          <p id={summaryId} className="habit__tiers">
            <span aria-hidden="true">{compactTiersText(progress.actual)}</span>
            <span className="visually-hidden">
              {highestText && `${highestText}. `}
              {nextStageText(progress.actual)}.
            </span>
          </p>
        </>
      ) : (
        <>
          <div className="habit__header">
            {canCheck ? (
              <button type="button" className="check" aria-pressed={done} aria-label={checkLabel} onClick={toggle}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="check__icon">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </button>
            ) : (
              <span className="check check--placeholder" aria-hidden="true" />
            )}
            <div className="habit__titles">
              <h3 className="habit__name">{habit.name}</h3>
              <p className="habit__meta">
                {habit.status === 'paused' ? 'En pause' : formatFrequency(habit.frequency)}
                {habit.status === 'active' && streak.today === 'unscheduled' && ' · pas prévue aujourd’hui'}
              </p>
            </div>
            {menuButton}
          </div>

          <div className="habit__progress">
            <p className="streak">
              <span className="streak__label">Série actuelle</span>
              <span className="streak__value">{formatValidations(streak.current)}</span>
            </p>
            <div className="tiers">
              {highestText && <p className="tier-badge">{highestText}</p>}
              <p className="tiers__next">{nextStageText(progress.actual)}</p>
            </div>
          </div>
        </>
      )}

      {recovery.status === 'available' && (
        <button
          type="button"
          className="button button--secondary button--small"
          aria-label={`Rattraper ${formatMissedDay(recovery.missedDate, today)} pour « ${habit.name} »`}
          onClick={() => {
            // Si la coche du jour est déjà faite, le rattrapage peut faire atteindre un palier :
            // il est célébré comme une coche, quel que soit l'ordre des gestes.
            const after = deriveHabitProgress(
              habit,
              [...data.completions, { habitId: habit.id, date: recovery.missedDate, kind: 'recovery' }],
              today,
            ).actual
            const recovered = `${capitalize(formatMissedDay(recovery.missedDate, today))} rattrapé.`
            const celebration = celebrationText(habit, after)
            run((d, ctx) => recoverMissedDay(d, habit.id, ctx), celebration ? `${recovered} ${celebration}` : recovered)
          }}
        >
          Rattraper {formatMissedDay(recovery.missedDate, today)}
        </button>
      )}
      {recovery.status === 'recovered' && (
        <p className="habit__recovery">
          {capitalize(formatMissedDay(recovery.missedDate, today))} rattrapé.{' '}
          <button
            type="button"
            className="link-button"
            aria-label={`Annuler le rattrapage de ${formatMissedDay(recovery.missedDate, today)} pour « ${habit.name} »`}
            onClick={() => run((d, ctx) => cancelRecovery(d, habit.id, ctx))}
          >
            Annuler
          </button>
        </p>
      )}
      {recovery.status === 'limitReached' && (
        <p className="habit__recovery">Rattrapage de la semaine déjà utilisé.</p>
      )}
      {habit.status === 'paused' && (
        <button
          type="button"
          className="button button--secondary button--small"
          onClick={() => run((d, ctx) => resumeHabit(d, habit.id, ctx), `« ${habit.name} » a repris.`)}
        >
          Reprendre
        </button>
      )}

      <HabitManageDialog habit={habit} open={managing} onClose={() => setManaging(false)} />
    </li>
  )
}
