import { useEffect, useId, useRef, useState } from 'react'
import { createHabit, isScheduledOn, type Habit } from '../../engine/index.ts'
import { getTheme } from '../../themes/index.ts'
import { Dialog } from '../components/Dialog.tsx'
import { HabitCard } from '../components/HabitCard.tsx'
import { HabitForm, type HabitFormValues } from '../components/HabitForm.tsx'
import { TaskItem } from '../components/TaskItem.tsx'
import { capitalize, formatLongDate } from '../format.ts'
import { useAppStore } from '../state/store.ts'
import { PanoramaScreen } from './PanoramaScreen.tsx'

export function TodayScreen() {
  const { data, today, run } = useAppStore()
  const [creating, setCreating] = useState(false)
  const [panorama, setPanorama] = useState(false)
  const panoramaButton = useRef<HTMLButtonElement>(null)
  const leftPanorama = useRef(false)

  useEffect(() => {
    // Au retour du panorama, le focus revient sur le bouton qui l'a ouvert.
    if (!panorama && leftPanorama.current) panoramaButton.current?.focus()
  }, [panorama])

  const activeGoals = data.goals.filter((goal) => goal.status === 'active')
  const active = data.habits.filter((habit) => habit.status === 'active')
  const dueToday = active.filter((habit) => isScheduledOn(habit, today))
  const notDueToday = active.filter((habit) => !isScheduledOn(habit, today))
  const paused = data.habits.filter((habit) => habit.status === 'paused')
  const archived = data.habits.filter((habit) => habit.status === 'archived')
  const tasksForToday = data.tasks.filter((task) => task.status === 'todo' && task.dueDate !== undefined && task.dueDate <= today)
  const goalNames = new Map(data.goals.map((goal) => [goal.id, goal.name]))

  const create = (values: HabitFormValues) => {
    const created = run(
      (d, ctx) =>
        createHabit(d, { name: values.name, frequency: values.frequency, ...(values.goalId && { goalId: values.goalId }) }, ctx),
      'Habitude créée.',
    )
    if (created) setCreating(false)
  }

  const hasPanorama = Boolean(getTheme(data.settings.themeId).Panorama) && data.habits.some((h) => h.status !== 'archived')
  if (panorama) {
    return (
      <PanoramaScreen
        onBack={() => {
          leftPanorama.current = true
          setPanorama(false)
        }}
      />
    )
  }

  return (
    <section className="screen" aria-labelledby="today-title">
      <header className={hasPanorama ? 'screen__header screen__header--action' : 'screen__header'}>
        <h1 id="today-title" className="screen__title" tabIndex={-1}>Aujourd’hui</h1>
        {hasPanorama && (
          <button ref={panoramaButton} type="button" className="button button--secondary" onClick={() => setPanorama(true)}>
            Panorama
          </button>
        )}
        <p className="screen__subtitle">{capitalize(formatLongDate(today))}</p>
      </header>

      {data.habits.length === 0 ? (
        <div className="card empty">
          <h2 className="empty__title">Ajouter une habitude</h2>
          <p className="empty__text">Une habitude à cocher chaque jour ou certains jours de la semaine.</p>
          <HabitForm goals={activeGoals} submitLabel="Créer l’habitude" onSubmit={create} />
        </div>
      ) : (
        <>
          <HabitList
            title="À cocher aujourd’hui"
            habits={dueToday}
            variant="today"
            emptyText="Rien de prévu aujourd’hui."
          />
          {notDueToday.length > 0 && <HabitList title="Pas prévues aujourd’hui" habits={notDueToday} />}
          {paused.length > 0 && <HabitList title="En pause" habits={paused} />}
          <button type="button" className="button button--primary button--block" onClick={() => setCreating(true)}>
            Ajouter une habitude
          </button>
          {archived.length > 0 && (
            <details className="disclosure">
              <summary>Habitudes archivées ({archived.length})</summary>
              <ul className="list">
                {archived.map((habit) => (
                  <HabitCard key={habit.id} habit={habit} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {tasksForToday.length > 0 && (
        <section className="section" aria-labelledby="today-tasks">
          <h2 id="today-tasks" className="section__title" tabIndex={-1}>Tâches pour aujourd’hui</h2>
          <ul className="list">
            {tasksForToday.map((task) => (
              <TaskItem key={task.id} task={task} goalName={task.goalId && goalNames.get(task.goalId)} />
            ))}
          </ul>
        </section>
      )}

      <Dialog open={creating} title="Nouvelle habitude" onClose={() => setCreating(false)}>
        <HabitForm
          goals={activeGoals}
          submitLabel="Créer l’habitude"
          onSubmit={create}
          onCancel={() => setCreating(false)}
          autoFocus
        />
      </Dialog>
    </section>
  )
}

interface HabitListProps {
  title: string
  habits: Habit[]
  variant?: 'today' | 'compact'
  emptyText?: string
}

function HabitList({ title, habits, variant = 'compact', emptyText }: HabitListProps) {
  const headingId = useId()
  return (
    <section className="section" aria-labelledby={headingId}>
      <h2 id={headingId} className="section__title">{title}</h2>
      {habits.length === 0 && emptyText ? (
        <p className="section__empty">{emptyText}</p>
      ) : (
        <ul className="list">
          {habits.map((habit, index) => (
            <HabitCard key={habit.id} habit={habit} variant={variant} index={index} />
          ))}
        </ul>
      )}
    </section>
  )
}
