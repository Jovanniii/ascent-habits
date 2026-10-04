import { useId } from 'react'
import { ISO_WEEKDAYS, type Frequency, type IsoWeekday } from '../../engine/index.ts'
import { WEEKDAY_INITIALS, WEEKDAY_NAMES, capitalize } from '../format.ts'

interface Props {
  value: Frequency
  onChange: (frequency: Frequency) => void
}

const DEFAULT_DAYS: IsoWeekday[] = [1, 3, 5]

export function FrequencyPicker({ value, onChange }: Props) {
  const radioName = useId()
  const selectedDays = value.type === 'specificDays' ? value.days : []

  const toggleDay = (day: IsoWeekday) => {
    const days = selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day]
    onChange({ type: 'specificDays', days: days.sort((a, b) => a - b) })
  }

  return (
    <fieldset className="field">
      <legend className="field__label">Fréquence</legend>
      <div className="segmented">
        <label className="segmented__option">
          <input
            type="radio"
            name={radioName}
            checked={value.type === 'daily'}
            onChange={() => onChange({ type: 'daily' })}
          />
          <span>Tous les jours</span>
        </label>
        <label className="segmented__option">
          <input
            type="radio"
            name={radioName}
            checked={value.type === 'specificDays'}
            onChange={() => onChange({ type: 'specificDays', days: DEFAULT_DAYS })}
          />
          <span>Certains jours</span>
        </label>
      </div>
      {value.type === 'specificDays' && (
        <div className="weekdays" role="group" aria-label="Jours de la semaine">
          {ISO_WEEKDAYS.map((day) => (
            <button
              key={day}
              type="button"
              className="weekdays__day"
              aria-pressed={selectedDays.includes(day)}
              aria-label={capitalize(WEEKDAY_NAMES[day])}
              onClick={() => toggleDay(day)}
            >
              {WEEKDAY_INITIALS[day]}
            </button>
          ))}
        </div>
      )}
      {value.type === 'specificDays' && selectedDays.length === 0 && (
        <p className="field__hint">Choisir au moins un jour.</p>
      )}
    </fieldset>
  )
}
