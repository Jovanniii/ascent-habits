import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  addDays,
  compareMonths,
  firstDayOfMonth,
  isoWeekday,
  lastDayOfMonth,
  monthOf,
  shiftMonth,
  type CalendarMonth,
  type IsoWeekday,
  type LocalDate,
} from '../../../engine/index.ts'
import { WEEKDAY_INITIALS, WEEKDAY_NAMES } from '../../format.ts'

export interface CellRender {
  ariaLabel: string
  content: ReactNode
  className?: string
  attributes?: Record<`data-${string}`, string | undefined>
}

interface Props<T extends { date: LocalDate }> {
  month: CalendarMonth
  weeks: (T | null)[][]
  /** Nom accessible de la grille (ex. « Lire, octobre 2026 »). */
  label: string
  className: string
  selected: LocalDate | null
  today: LocalDate
  onSelect: (date: LocalDate) => void
  /** Change de mois ; renvoie faux si ce mois n'est pas accessible. */
  onStepMonth: (delta: -1 | 1) => boolean
  renderCell: (day: T) => CellRender
}

const ISO_DAYS: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7]

/** Même jour du mois dans un autre mois, ramené au dernier jour si besoin (31 → 30). */
function sameDayIn(date: LocalDate, month: CalendarMonth): LocalDate {
  const candidate = `${firstDayOfMonth(month).slice(0, 8)}${date.slice(8, 10)}`
  const last = lastDayOfMonth(month)
  return candidate > last ? last : candidate
}

/**
 * Grille mensuelle accessible (motif « grid » de l'ARIA) : une seule case dans
 * l'ordre de tabulation, flèches pour changer de jour (y compris d'un mois à
 * l'autre), Début et Fin pour la semaine, Page précédente et Page suivante pour
 * le mois. Entrée ou Espace sélectionne le jour.
 */
export function CalendarGrid<T extends { date: LocalDate }>(props: Props<T>) {
  const { month, weeks, label, className, selected, today, onSelect, onStepMonth, renderCell } = props
  const [focusDate, setFocusDate] = useState<LocalDate | null>(null)
  const buttons = useRef(new Map<LocalDate, HTMLButtonElement>())
  const moveFocus = useRef(false)

  const inMonth = (date: LocalDate | null): date is LocalDate => date !== null && compareMonths(monthOf(date), month) === 0
  const first = firstDayOfMonth(month)
  let active: LocalDate = first
  if (inMonth(focusDate)) active = focusDate
  else if (inMonth(selected)) active = selected
  else if (inMonth(today)) active = today

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    buttons.current.get(active)?.focus()
  })

  const goTo = (target: LocalDate) => {
    const delta = compareMonths(monthOf(target), month)
    if (delta !== 0 && !onStepMonth(delta < 0 ? -1 : 1)) return
    setFocusDate(target)
    moveFocus.current = true
  }

  const onKeyDown = (date: LocalDate, event: KeyboardEvent<HTMLButtonElement>) => {
    const weekday = isoWeekday(date)
    let target: LocalDate
    switch (event.key) {
      case 'ArrowLeft':
        target = addDays(date, -1)
        break
      case 'ArrowRight':
        target = addDays(date, 1)
        break
      case 'ArrowUp':
        target = addDays(date, -7)
        break
      case 'ArrowDown':
        target = addDays(date, 7)
        break
      case 'Home':
        target = [addDays(date, 1 - weekday), first].sort().at(-1)!
        break
      case 'End':
        target = [addDays(date, 7 - weekday), lastDayOfMonth(month)].sort()[0]!
        break
      case 'PageUp':
        target = sameDayIn(date, shiftMonth(month, -1))
        break
      case 'PageDown':
        target = sameDayIn(date, shiftMonth(month, 1))
        break
      default:
        return
    }
    event.preventDefault()
    goTo(target)
  }

  return (
    <div role="grid" aria-label={label} className={`calendar ${className}`}>
      <div role="row" className="calendar__row calendar__row--head">
        {ISO_DAYS.map((day) => (
          <div key={day} role="columnheader" className="calendar__weekday">
            <span aria-hidden="true">{WEEKDAY_INITIALS[day]}</span>
            <span className="visually-hidden">{WEEKDAY_NAMES[day]}</span>
          </div>
        ))}
      </div>
      {weeks.map((week, row) => (
        <div key={row} role="row" className="calendar__row">
          {week.map((day, column) => {
            if (day === null) return <div key={column} role="gridcell" className="calendar__empty" />
            const cell = renderCell(day)
            const isSelected = day.date === selected
            return (
              <div key={day.date} role="gridcell" aria-selected={isSelected} className="calendar__cell">
                <button
                  ref={(element) => {
                    if (element) buttons.current.set(day.date, element)
                    else buttons.current.delete(day.date)
                  }}
                  type="button"
                  className={`calendar-day${cell.className ? ` ${cell.className}` : ''}`}
                  tabIndex={day.date === active ? 0 : -1}
                  aria-label={cell.ariaLabel}
                  aria-current={day.date === today ? 'date' : undefined}
                  onClick={() => {
                    setFocusDate(day.date)
                    onSelect(day.date)
                  }}
                  onFocus={() => setFocusDate(day.date)}
                  onKeyDown={(event) => onKeyDown(day.date, event)}
                  {...cell.attributes}
                >
                  {cell.content}
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
