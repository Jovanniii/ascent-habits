/**
 * Commandes sur les habitudes : (données, entrée, contexte) => nouvelles données.
 * Les données reçues ne sont jamais modifiées.
 */
import { addDays, type LocalDate } from '../dates.ts'
import { getRecoveryState } from '../habits/recovery.ts'
import { isScheduledOn } from '../habits/schedule.ts'
import type { AppData, Frequency, Habit, PausePeriod } from '../model.ts'
import { CommandError, type CommandContext } from './context.ts'
import { findOrThrow, normalizeFrequency, normalizeName, replaceById } from './validation.ts'

export interface NewHabitInput {
  name: string
  frequency: Frequency
  goalId?: string
}

export interface HabitChanges {
  name?: string
  frequency?: Frequency
  /** null retire le lien avec l'objectif. */
  goalId?: string | null
}

function findHabit(data: AppData, habitId: string): Habit {
  return findOrThrow(data.habits, habitId, 'Habitude')
}

function checkGoalExists(data: AppData, goalId: string | undefined): void {
  if (goalId !== undefined) {
    findOrThrow(data.goals, goalId, 'Objectif')
  }
}

function hasCompletion(data: AppData, habitId: string, date: LocalDate): boolean {
  return data.completions.some((c) => c.habitId === habitId && c.date === date)
}

/** Ouvre une période de pause aujourd'hui, ou demain si aujourd'hui est déjà validé. */
function openPause(data: AppData, habit: Habit, today: LocalDate): PausePeriod[] {
  if (habit.pauses.some((pause) => pause.to === undefined)) {
    return habit.pauses
  }
  const from = hasCompletion(data, habit.id, today) ? addDays(today, 1) : today
  return [...habit.pauses, { from }]
}

/** Ferme la période de pause en cours : l'habitude est de nouveau prévue dès aujourd'hui. */
function closePause(pauses: readonly PausePeriod[], today: LocalDate): PausePeriod[] {
  return pauses.flatMap((pause) => {
    if (pause.to !== undefined) return [pause]
    // Pause ouverte puis refermée avant d'avoir commencé : elle disparaît.
    if (pause.from >= today) return []
    return [{ from: pause.from, to: addDays(today, -1) }]
  })
}

export function createHabit(data: AppData, input: NewHabitInput, ctx: CommandContext): AppData {
  checkGoalExists(data, input.goalId)
  const habit: Habit = {
    id: ctx.newId(),
    name: normalizeName(input.name),
    frequency: normalizeFrequency(input.frequency),
    createdOn: ctx.today,
    status: 'active',
    pauses: [],
    ...(input.goalId !== undefined && { goalId: input.goalId }),
  }
  return { ...data, habits: [...data.habits, habit] }
}

/**
 * Modifie le nom, la fréquence ou l'objectif lié. Une nouvelle fréquence s'applique
 * à tout l'historique (voir previewFrequencyChange pour en mesurer l'effet).
 */
export function updateHabit(data: AppData, habitId: string, changes: HabitChanges): AppData {
  const habit = findHabit(data, habitId)
  const updated: Habit = { ...habit }
  if (changes.name !== undefined) {
    updated.name = normalizeName(changes.name)
  }
  if (changes.frequency !== undefined) {
    updated.frequency = normalizeFrequency(changes.frequency)
  }
  if (changes.goalId === null) {
    delete updated.goalId
  } else if (changes.goalId !== undefined) {
    checkGoalExists(data, changes.goalId)
    updated.goalId = changes.goalId
  }
  return { ...data, habits: replaceById(data.habits, updated) }
}

/** Coche l'habitude pour aujourd'hui, ou retire la coche si elle existe déjà. */
export function toggleHabitToday(data: AppData, habitId: string, ctx: CommandContext): AppData {
  const habit = findHabit(data, habitId)
  if (hasCompletion(data, habitId, ctx.today)) {
    return {
      ...data,
      completions: data.completions.filter((c) => !(c.habitId === habitId && c.date === ctx.today)),
    }
  }
  if (habit.status !== 'active') {
    throw new CommandError('invalid-state', "L'habitude n'est pas active.")
  }
  if (!isScheduledOn(habit, ctx.today)) {
    throw new CommandError('not-scheduled', "L'habitude n'est pas prévue aujourd'hui.")
  }
  return {
    ...data,
    completions: [...data.completions, { habitId, date: ctx.today, kind: 'normal' }],
  }
}

/** Valide le dernier jour prévu manqué (type rattrapage), si la récupération est possible. */
export function recoverMissedDay(data: AppData, habitId: string, ctx: CommandContext): AppData {
  const state = getRecoveryState(findHabit(data, habitId), data.completions, ctx.today)
  if (state.status !== 'available') {
    throw new CommandError('recovery-unavailable', 'Aucun jour ne peut être rattrapé.')
  }
  return {
    ...data,
    completions: [...data.completions, { habitId, date: state.missedDate, kind: 'recovery' }],
  }
}

/** Annule le rattrapage du dernier jour prévu (coche faite par erreur). */
export function cancelRecovery(data: AppData, habitId: string, ctx: CommandContext): AppData {
  const state = getRecoveryState(findHabit(data, habitId), data.completions, ctx.today)
  if (state.status !== 'recovered') {
    throw new CommandError('invalid-state', 'Aucun rattrapage à annuler.')
  }
  return {
    ...data,
    completions: data.completions.filter(
      (c) => !(c.habitId === habitId && c.date === state.missedDate && c.kind === 'recovery'),
    ),
  }
}

/**
 * Note un jour passé prévu comme « fait après coup » (depuis le calendrier).
 * Ce jour figure dans l'historique sans compter dans la série ni consommer le
 * quota de récupération. Si le jour peut être rattrapé (série à sauver), c'est
 * le rattrapage qui doit être utilisé : la commande le refuse.
 */
export function logLateDay(data: AppData, habitId: string, date: LocalDate, ctx: CommandContext): AppData {
  const habit = findHabit(data, habitId)
  if (date >= ctx.today) {
    throw new CommandError('invalid-date', 'Seul un jour passé peut être noté après coup.')
  }
  if (!isScheduledOn(habit, date)) {
    throw new CommandError('not-scheduled', "L'habitude n'était pas prévue ce jour-là.")
  }
  if (hasCompletion(data, habitId, date)) {
    throw new CommandError('invalid-state', 'Ce jour est déjà validé.')
  }
  const recovery = getRecoveryState(habit, data.completions, ctx.today)
  if (recovery.status === 'available' && recovery.missedDate === date) {
    throw new CommandError('invalid-state', 'Ce jour peut être rattrapé : le rattrapage préserve la série.')
  }
  return { ...data, completions: [...data.completions, { habitId, date, kind: 'late' }] }
}

/** Retire un jour noté « fait après coup ». */
export function removeLateDay(data: AppData, habitId: string, date: LocalDate): AppData {
  findHabit(data, habitId)
  if (!data.completions.some((c) => c.habitId === habitId && c.date === date && c.kind === 'late')) {
    throw new CommandError('invalid-state', 'Aucun jour noté après coup à retirer.')
  }
  return {
    ...data,
    completions: data.completions.filter((c) => !(c.habitId === habitId && c.date === date && c.kind === 'late')),
  }
}

export function pauseHabit(data: AppData, habitId: string, ctx: CommandContext): AppData {
  const habit = findHabit(data, habitId)
  if (habit.status !== 'active') {
    throw new CommandError('invalid-state', "Seule une habitude active peut être mise en pause.")
  }
  const updated: Habit = { ...habit, status: 'paused', pauses: openPause(data, habit, ctx.today) }
  return { ...data, habits: replaceById(data.habits, updated) }
}

export function resumeHabit(data: AppData, habitId: string, ctx: CommandContext): AppData {
  const habit = findHabit(data, habitId)
  if (habit.status !== 'paused') {
    throw new CommandError('invalid-state', "L'habitude n'est pas en pause.")
  }
  const updated: Habit = { ...habit, status: 'active', pauses: closePause(habit.pauses, ctx.today) }
  return { ...data, habits: replaceById(data.habits, updated) }
}

/**
 * Archive l'habitude. Les jours d'archivage sont traités comme une pause : une
 * habitude restaurée retrouve sa série.
 */
export function archiveHabit(data: AppData, habitId: string, ctx: CommandContext): AppData {
  const habit = findHabit(data, habitId)
  if (habit.status === 'archived') {
    return data
  }
  const updated: Habit = { ...habit, status: 'archived', pauses: openPause(data, habit, ctx.today) }
  return { ...data, habits: replaceById(data.habits, updated) }
}

export function restoreHabit(data: AppData, habitId: string, ctx: CommandContext): AppData {
  const habit = findHabit(data, habitId)
  if (habit.status !== 'archived') {
    throw new CommandError('invalid-state', "L'habitude n'est pas archivée.")
  }
  const updated: Habit = { ...habit, status: 'active', pauses: closePause(habit.pauses, ctx.today) }
  return { ...data, habits: replaceById(data.habits, updated) }
}

/** Supprime définitivement l'habitude et son historique de validations. */
export function deleteHabit(data: AppData, habitId: string): AppData {
  findHabit(data, habitId)
  return {
    ...data,
    habits: data.habits.filter((habit) => habit.id !== habitId),
    completions: data.completions.filter((c) => c.habitId !== habitId),
  }
}
