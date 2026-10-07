import { useMemo } from 'react'
import { buildGlobalMonth, type CalendarMonth, type DaySummary, type HabitDayState, type LocalDate } from '../../../engine/index.ts'
import { capitalize, formatLongDate } from '../../format.ts'
import { useAppStore } from '../../state/store.ts'
import { CalendarGrid } from './CalendarGrid.tsx'
import { MonthNav } from './MonthNav.tsx'
import { globalDayAriaLabel } from './labels.ts'

interface Props {
  month: CalendarMonth
  onMonthChange: (month: CalendarMonth) => void
  selected: LocalDate | null
  onSelect: (date: LocalDate) => void
}

const HEAT_LEGEND = [
  { level: 0, label: 'Aucune' },
  { level: 1, label: 'Moins d’un tiers' },
  { level: 2, label: 'Moins de deux tiers' },
  { level: 3, label: 'Presque toutes' },
  { level: 4, label: 'Toutes' },
]

/** Vue globale : carte de chaleur selon la part des habitudes prévues validées. */
export function GlobalCalendar({ month, onMonthChange, selected, onSelect }: Props) {
  const { data, today } = useAppStore()
  const view = useMemo(() => buildGlobalMonth(data, month, today), [data, month, today])
  const habitNames = useMemo(() => new Map(data.habits.map((habit) => [habit.id, habit.name])), [data.habits])
  const selectedDay = view.weeks.flat().find((day) => day?.date === selected) ?? null

  const step = (delta: -1 | 1) => {
    const target = delta < 0 ? view.previous : view.next
    if (!target) return false
    onMonthChange(target)
    return true
  }

  return (
    <>
      <MonthNav month={month} previous={view.previous} next={view.next} onChange={onMonthChange} />
      <CalendarGrid
        month={month}
        weeks={view.weeks}
        label="Toutes les habitudes, jours du mois"
        className="calendar--heat"
        selected={selected}
        today={today}
        onSelect={onSelect}
        onStepMonth={step}
        renderCell={(day) => ({
          ariaLabel: globalDayAriaLabel(day, habitNames),
          attributes: {
            'data-level': day.level === null ? undefined : String(day.level),
            'data-future': day.isFuture ? 'true' : undefined,
          },
          content: (
            <>
              <span className="calendar-day__number">{Number(day.date.slice(8))}</span>
              {day.scheduled > 0 && (
                <span className="calendar-day__fraction">
                  {day.completed}/{day.scheduled}
                </span>
              )}
            </>
          ),
        })}
      />
      <div className="heat-legend">
        <p className="heat-legend__title">Habitudes prévues validées</p>
        <ul className="heat-legend__list">
          {HEAT_LEGEND.map((item) => (
            <li key={item.level} className="heat-legend__item">
              <span className="heat-legend__swatch" data-level={item.level} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      {selectedDay && <GlobalDayDetail day={selectedDay} />}
    </>
  )
}

const GROUPS: { title: string; states: HabitDayState[] }[] = [
  { title: 'Validées', states: ['done', 'offSchedule'] },
  { title: 'Rattrapées', states: ['recovered'] },
  { title: 'Faites après coup', states: ['late'] },
  { title: 'À faire', states: ['pending'] },
  { title: 'Non validées', states: ['notDone'] },
]

function GlobalDayDetail({ day }: { day: DaySummary }) {
  const { data } = useAppStore()
  const habitNames = new Map(data.habits.map((habit) => [habit.id, habit.name]))
  const taskNames = new Map(data.tasks.map((task) => [task.id, task.name]))
  const groups = GROUPS.map((group) => ({
    title: group.title,
    names: day.habits
      .filter((entry) => group.states.includes(entry.state))
      .map((entry) => {
        const name = habitNames.get(entry.habitId) ?? 'Habitude'
        return entry.state === 'offSchedule' ? `${name} (jour non prévu)` : name
      }),
  })).filter((group) => group.names.length > 0)
  const tasks = day.completedTaskIds.map((id) => taskNames.get(id) ?? 'Tâche')

  return (
    <section className="card calendar-detail" aria-labelledby="calendar-detail-title" aria-live="polite">
      <h3 id="calendar-detail-title" className="calendar-detail__title">
        {capitalize(formatLongDate(day.date))}
      </h3>
      {day.isFuture && <p>À venir.</p>}
      {!day.isFuture && groups.length === 0 && <p>Aucune habitude prévue ce jour-là.</p>}
      {groups.map((group) => (
        <div key={group.title} className="calendar-detail__group">
          <h4 className="calendar-detail__subtitle">{group.title}</h4>
          <ul className="calendar-detail__list">
            {group.names.map((name, index) => (
              <li key={`${name}-${index}`}>{name}</li>
            ))}
          </ul>
        </div>
      ))}
      {tasks.length > 0 && (
        <div className="calendar-detail__group">
          <h4 className="calendar-detail__subtitle">Tâches terminées</h4>
          <ul className="calendar-detail__list">
            {tasks.map((name, index) => (
              <li key={`${name}-${index}`}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
