import { useMemo } from 'react'
import {
  buildHabitMonth,
  getRecoveryState,
  logLateDay,
  recoverMissedDay,
  removeLateDay,
  type CalendarMonth,
  type Habit,
  type HabitCalendarDay,
  type HabitDayState,
  type LocalDate,
} from '../../../engine/index.ts'
import { getTheme } from '../../../themes/index.ts'
import { capitalize, formatDayMonth, formatLongDate, formatValidations } from '../../format.ts'
import { recoveryFeedback } from '../../recoveryFeedback.ts'
import { useAppStore } from '../../state/store.ts'
import { CalendarGrid } from './CalendarGrid.tsx'
import { DayGlyph } from './DayGlyph.tsx'
import { MonthNav } from './MonthNav.tsx'
import { HABIT_DAY_LABELS, habitDayAriaLabel } from './labels.ts'

interface Props {
  habit: Habit
  month: CalendarMonth
  onMonthChange: (month: CalendarMonth) => void
  selected: LocalDate | null
  onSelect: (date: LocalDate) => void
}

const LEGEND: HabitDayState[] = ['done', 'recovered', 'late', 'notDone', 'paused']

function DayVisual({ day, Mark }: { day: Pick<HabitCalendarDay, 'state' | 'chain' | 'bridge'>; Mark: ReturnType<typeof getTheme>['CalendarDayMark'] }) {
  if (Mark) {
    return (
      <span className="calendar-day__mark" aria-hidden="true">
        <Mark state={day.state} chain={day.chain} bridge={day.bridge} />
      </span>
    )
  }
  return <DayGlyph state={day.state} />
}

/** Vue par habitude : un mois de validations, avec les séries mises en évidence. */
export function HabitCalendar({ habit, month, onMonthChange, selected, onSelect }: Props) {
  const { data, today } = useAppStore()
  const Mark = getTheme(data.settings.themeId).CalendarDayMark
  const view = useMemo(() => buildHabitMonth(habit, data.completions, month, today), [habit, data.completions, month, today])
  const selectedDay = view.weeks.flat().find((day) => day?.date === selected) ?? null

  const step = (delta: -1 | 1) => {
    const target = delta < 0 ? view.previous : view.next
    if (!target) return false
    onMonthChange(target)
    return true
  }

  return (
    <>
      <dl className="calendar-stats">
        <div className="calendar-stat">
          <dt className="calendar-stat__label">Série actuelle</dt>
          <dd className="calendar-stat__value">{formatValidations(view.streak.current)}</dd>
        </div>
        <div className="calendar-stat">
          <dt className="calendar-stat__label">Meilleure série</dt>
          <dd className="calendar-stat__value">{formatValidations(view.streak.best)}</dd>
        </div>
      </dl>
      <MonthNav month={month} previous={view.previous} next={view.next} onChange={onMonthChange} />
      <CalendarGrid
        month={month}
        weeks={view.weeks}
        label={`${habit.name}, jours du mois`}
        className={`calendar--habit${Mark ? ' calendar--themed' : ''}`}
        selected={selected}
        today={today}
        onSelect={onSelect}
        onStepMonth={step}
        renderCell={(day) => ({
          ariaLabel: habitDayAriaLabel(day),
          attributes: {
            'data-state': day.state,
            'data-chain': day.chain && day.chain.length > 1 ? day.chain.position : undefined,
            'data-bridge': day.bridge ? 'true' : undefined,
          },
          content: (
            <>
              <span className="calendar-day__number">{Number(day.date.slice(8))}</span>
              <DayVisual day={day} Mark={Mark} />
            </>
          ),
        })}
      />
      <ul className="calendar-legend" aria-label="Légende">
        {LEGEND.map((state) => (
          <li key={state} className="calendar-legend__item">
            <span className="calendar-legend__swatch" data-state={state}>
              <DayVisual day={{ state, chain: null, bridge: false }} Mark={Mark} />
            </span>
            {capitalize(HABIT_DAY_LABELS[state])}
          </li>
        ))}
      </ul>
      {selectedDay && <HabitDayDetail habit={habit} day={selectedDay} />}
    </>
  )
}

function HabitDayDetail({ habit, day }: { habit: Habit; day: HabitCalendarDay }) {
  const { data, today, run } = useAppStore()
  const recovery = getRecoveryState(habit, data.completions, today)
  const recoverable = day.state === 'notDone' && recovery.status === 'available' && recovery.missedDate === day.date
  const dayName = formatDayMonth(day.date)

  let text: string
  let action: { label: string; ariaLabel: string; onClick: () => void } | null = null
  let hint: string | null = null
  switch (day.state) {
    case 'done':
      text = day.chain && day.chain.length > 1 ? `Validé, dans une série de ${formatValidations(day.chain.length)}.` : 'Validé.'
      break
    case 'recovered':
      text = 'Rattrapé : ce jour compte dans la série.'
      break
    case 'late':
      text = 'Fait après coup : noté dans l’historique, sans effet sur la série.'
      action = {
        label: 'Retirer',
        ariaLabel: `Retirer le ${dayName} pour « ${habit.name} »`,
        onClick: () => run((d) => removeLateDay(d, habit.id, day.date), `${capitalize(dayName)} retiré.`),
      }
      break
    case 'notDone':
      if (recoverable) {
        text = 'Ce jour peut encore être rattrapé : la série est préservée.'
        action = {
          label: 'Rattraper ce jour',
          ariaLabel: `Rattraper le ${dayName} pour « ${habit.name} »`,
          onClick: () =>
            run((d, ctx) => recoverMissedDay(d, habit.id, ctx), recoveryFeedback(habit, data.completions, day.date, today)),
        }
      } else {
        text = 'Non validé.'
        hint = 'Fait ce jour-là ? Il sera noté dans l’historique, sans changer la série.'
        action = {
          label: 'Noter comme fait',
          ariaLabel: `Noter le ${dayName} comme fait pour « ${habit.name} »`,
          onClick: () => run((d, ctx) => logLateDay(d, habit.id, day.date, ctx), `${capitalize(dayName)} noté comme fait.`),
        }
      }
      break
    case 'pending':
      text = 'À cocher aujourd’hui, depuis l’écran Aujourd’hui.'
      break
    case 'offSchedule':
      text = 'Validé un jour qui n’est plus prévu : ne compte pas dans la série.'
      break
    case 'unscheduled':
      text = 'Pas prévue ce jour-là.'
      break
    case 'paused':
      text = 'En pause ce jour-là.'
      break
    case 'beforeCreation':
      text = 'Avant la création de l’habitude.'
      break
    case 'future':
      text = 'À venir.'
      break
  }

  return (
    <section className="card calendar-detail" aria-labelledby="calendar-detail-title" aria-live="polite">
      <h3 id="calendar-detail-title" className="calendar-detail__title">
        {capitalize(formatLongDate(day.date))}
      </h3>
      <p>{text}</p>
      {hint && <p className="field__hint">{hint}</p>}
      {action && (
        <button type="button" className="button button--secondary button--small" aria-label={action.ariaLabel} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </section>
  )
}
