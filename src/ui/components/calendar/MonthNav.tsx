import type { CalendarMonth } from '../../../engine/index.ts'
import { capitalize, formatMonthYear } from '../../format.ts'

interface Props {
  month: CalendarMonth
  previous: CalendarMonth | null
  next: CalendarMonth | null
  onChange: (month: CalendarMonth) => void
}

/** Titre du mois et boutons mois précédent / suivant (désactivés hors de l'historique). */
export function MonthNav({ month, previous, next, onChange }: Props) {
  return (
    <div className="month-nav">
      <button
        type="button"
        className="icon-button month-nav__button"
        disabled={previous === null}
        aria-label={previous ? `Mois précédent, ${formatMonthYear(previous)}` : 'Mois précédent'}
        onClick={() => previous && onChange(previous)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <h2 className="month-nav__title" aria-live="polite">
        {capitalize(formatMonthYear(month))}
      </h2>
      <button
        type="button"
        className="icon-button month-nav__button"
        disabled={next === null}
        aria-label={next ? `Mois suivant, ${formatMonthYear(next)}` : 'Mois suivant'}
        onClick={() => next && onChange(next)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
