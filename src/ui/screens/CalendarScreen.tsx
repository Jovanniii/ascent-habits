import { useId, useState } from 'react'
import { compareMonths, monthOf, type CalendarMonth, type LocalDate } from '../../engine/index.ts'
import { GlobalCalendar } from '../components/calendar/GlobalCalendar.tsx'
import { HabitCalendar } from '../components/calendar/HabitCalendar.tsx'
import { useAppStore } from '../state/store.ts'

const ALL = 'all'

/** Calendrier de réalisations (US-16) : vue globale ou vue par habitude. */
export function CalendarScreen() {
  const { data, today } = useAppStore()
  const selectId = useId()
  const [habitId, setHabitId] = useState<string>(ALL)
  const [month, setMonth] = useState<CalendarMonth>(() => monthOf(today))
  const [selected, setSelected] = useState<LocalDate | null>(today)

  const habit = data.habits.find((h) => h.id === habitId) ?? null
  // Une habitude créée après le mois affiché s'ouvre sur son premier mois.
  const shownMonth = habit && compareMonths(month, monthOf(habit.createdOn)) < 0 ? monthOf(habit.createdOn) : month

  return (
    <section className="screen screen--calendar" aria-labelledby="calendar-title">
      <header className="screen__header">
        <h1 id="calendar-title" className="screen__title" tabIndex={-1}>
          Calendrier
        </h1>
      </header>

      {data.habits.length === 0 && data.tasks.every((task) => task.status !== 'done') ? (
        <div className="card empty">
          <p className="empty__text">Le calendrier se remplira jour après jour, dès la première habitude cochée.</p>
        </div>
      ) : (
        <>
          {data.habits.length > 0 && (
            <div className="field">
              <label className="visually-hidden" htmlFor={selectId}>
                Afficher
              </label>
              <select id={selectId} className="input" value={habit ? habit.id : ALL} onChange={(event) => setHabitId(event.target.value)}>
                <option value={ALL}>Toutes les habitudes</option>
                {data.habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.status === 'archived' ? `${h.name} (archivée)` : h.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {habit ? (
            <HabitCalendar habit={habit} month={shownMonth} onMonthChange={setMonth} selected={selected} onSelect={setSelected} />
          ) : (
            <GlobalCalendar month={shownMonth} onMonthChange={setMonth} selected={selected} onSelect={setSelected} />
          )}
        </>
      )}
    </section>
  )
}
