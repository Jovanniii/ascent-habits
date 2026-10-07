/**
 * Chaînes de séries : jours validés consécutifs, avec les mêmes règles que
 * computeStreak (un jour non prévu ou en pause ne coupe pas la chaîne, aujourd'hui
 * en attente non plus, un jour noté « fait après coup » si).
 *
 * Les chaînes sont calculées sur tout l'historique, si bien qu'une série
 * commencée le mois précédent reste continue à l'affichage.
 */
import { addDays, type LocalDate } from '../dates.ts'
import type { Completion, Habit } from '../model.ts'
import { isPausedOn, matchesFrequency, validatedDates } from '../habits/schedule.ts'

export type ChainPosition = 'start' | 'middle' | 'end' | 'single'

export interface ChainMark {
  position: ChainPosition
  /** Nombre de validations de la chaîne entière. */
  length: number
}

export interface HabitChains {
  /** Position de chaque jour validé dans sa chaîne. */
  marks: Map<LocalDate, ChainMark>
  /** Jours non validés situés à l'intérieur d'une chaîne (non prévus ou en pause). */
  bridges: Set<LocalDate>
}

export function computeChains(
  habit: Pick<Habit, 'id' | 'frequency' | 'createdOn' | 'pauses'>,
  completions: readonly Completion[],
  today: LocalDate,
): HabitChains {
  const validated = validatedDates(habit.id, completions)
  const marks = new Map<LocalDate, ChainMark>()
  const bridges = new Set<LocalDate>()
  let run: LocalDate[] = []
  // Jours sans validation qui suivent le dernier jour validé de la chaîne en cours.
  let gap: LocalDate[] = []

  const closeRun = () => {
    run.forEach((day, index) => {
      let position: ChainPosition = 'middle'
      if (run.length === 1) position = 'single'
      else if (index === 0) position = 'start'
      else if (index === run.length - 1) position = 'end'
      marks.set(day, { position, length: run.length })
    })
    run = []
    gap = []
  }

  for (let day = habit.createdOn; day <= today; day = addDays(day, 1)) {
    const scheduled = !isPausedOn(habit, day) && matchesFrequency(habit.frequency, day)
    if (scheduled && validated.has(day)) {
      for (const bridge of gap) bridges.add(bridge)
      gap = []
      run.push(day)
    } else if (scheduled && day !== today) {
      closeRun()
    } else if (run.length > 0) {
      gap.push(day)
    }
  }
  closeRun()
  return { marks, bridges }
}
