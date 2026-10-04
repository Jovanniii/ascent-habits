/**
 * Modèle de données du moteur.
 *
 * Ces types ne contiennent aucune notion visuelle : un thème interprète ces données
 * (séries, paliers, progression) pour les mettre en scène.
 */
import type { IsoWeekday, LocalDate } from './dates.ts'

/** Instant précis au format ISO 8601 (ex. « 2026-10-04T08:30:00.000Z »). */
export type Timestamp = string

export type Frequency =
  | { type: 'daily' }
  /** Jours précis de la semaine, triés et sans doublon. */
  | { type: 'specificDays'; days: IsoWeekday[] }

export type HabitStatus = 'active' | 'paused' | 'archived'

/**
 * Période pendant laquelle l'habitude n'est pas attendue (pause ou archivage).
 * Bornes incluses ; `to` absent = période en cours.
 */
export interface PausePeriod {
  from: LocalDate
  to?: LocalDate
}

export interface Habit {
  id: string
  name: string
  frequency: Frequency
  /** Premier jour où l'habitude peut être prévue. */
  createdOn: LocalDate
  status: HabitStatus
  /** Historique des pauses : ces jours ne sont pas prévus, la série n'est donc pas cassée. */
  pauses: PausePeriod[]
  goalId?: string
}

export type TaskStatus = 'todo' | 'done'

export interface Task {
  id: string
  name: string
  dueDate?: LocalDate
  status: TaskStatus
  createdAt: Timestamp
  completedAt?: Timestamp
  goalId?: string
}

export type GoalStatus = 'active' | 'achieved' | 'archived'

export interface Goal {
  id: string
  name: string
  dueDate?: LocalDate
  status: GoalStatus
  createdAt: Timestamp
  achievedAt?: Timestamp
}

export type MilestoneStatus = 'todo' | 'done'

export interface Milestone {
  id: string
  goalId: string
  name: string
  status: MilestoneStatus
  createdAt: Timestamp
}

/** `recovery` : jour manqué validé après coup grâce à la récupération. */
export type CompletionKind = 'normal' | 'recovery'

/** Validation d'une habitude pour un jour donné (au plus une par habitude et par jour). */
export interface Completion {
  habitId: string
  date: LocalDate
  kind: CompletionKind
}

export interface Settings {
  themeId: string
  animationsEnabled: boolean
}

export const SCHEMA_VERSION = 1

/** Ensemble des données de l'application, tel qu'il est enregistré et exporté. */
export interface AppData {
  schemaVersion: typeof SCHEMA_VERSION
  habits: Habit[]
  completions: Completion[]
  tasks: Task[]
  goals: Goal[]
  milestones: Milestone[]
  settings: Settings
}

export function createEmptyAppData(settings: Settings): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    habits: [],
    completions: [],
    tasks: [],
    goals: [],
    milestones: [],
    settings,
  }
}
