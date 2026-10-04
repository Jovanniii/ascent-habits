import { useState } from 'react'
import {
  cancelRecovery,
  computeStreak,
  computeTierProgress,
  getRecoveryState,
  recoverMissedDay,
  resumeHabit,
  toggleHabitToday,
  type Habit,
} from '../../engine/index.ts'
import { TIER_LABELS, capitalize, formatFrequency, formatMissedDay, formatValidations, plural } from '../format.ts'
import { useAppStore } from '../state/store.ts'
import { HabitManageDialog } from './HabitManageDialog.tsx'

interface Props {
  habit: Habit
}

export function HabitCard({ habit }: Props) {
  const { data, today, run } = useAppStore()
  const [managing, setManaging] = useState(false)

  const streak = computeStreak(habit, data.completions, today)
  const tiers = computeTierProgress(streak)
  const recovery = getRecoveryState(habit, data.completions, today)
  const canCheck = habit.status === 'active' && streak.today !== 'unscheduled'
  const done = streak.today === 'done'

  return (
    <li
      className="card habit"
      data-status={habit.status}
      data-today={streak.today}
      // Repères pour le futur thème illustré : décor du plus haut palier atteint.
      data-highest-tier={tiers.highest?.id ?? 'none'}
    >
      <div className="habit__header">
        {canCheck ? (
          <button
            type="button"
            className="check"
            aria-pressed={done}
            aria-label={`Valider « ${habit.name} » pour aujourd'hui`}
            onClick={() => run((d, ctx) => toggleHabitToday(d, habit.id, ctx))}
          >
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
        <button
          type="button"
          className="icon-button"
          aria-label={`Gérer « ${habit.name} »`}
          onClick={() => setManaging(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      <div className="habit__progress">
        <p className="streak">
          <span className="streak__label">Série actuelle</span>
          <span className="streak__value">{formatValidations(streak.current)}</span>
        </p>
        <div className="tiers">
          {tiers.highest && (
            <p className="tier-badge" data-tier={tiers.highest.id}>
              Plus haut palier atteint : {TIER_LABELS[tiers.highest.id]}
            </p>
          )}
          <p className="tiers__next">
            {tiers.next && tiers.daysToNext !== null
              ? `Prochain palier : ${TIER_LABELS[tiers.next.id]}, encore ${plural(tiers.daysToNext, 'jour')}`
              : 'Tous les paliers sont atteints, l’habitude continue.'}
          </p>
        </div>
      </div>

      {recovery.status === 'available' && (
        <button
          type="button"
          className="button button--secondary button--small"
          aria-label={`Rattraper ${formatMissedDay(recovery.missedDate, today)} pour « ${habit.name} »`}
          onClick={() =>
            run(
              (d, ctx) => recoverMissedDay(d, habit.id, ctx),
              `${capitalize(formatMissedDay(recovery.missedDate, today))} rattrapé.`,
            )
          }
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
