/**
 * Statistiques anonymes d'usage, exportées volontairement par un testeur.
 *
 * Vie privée (voir P6-D5 et P6-D6 dans docs/journal-decisions.md) :
 * - le fichier ne contient AUCUN texte saisi par l'utilisateur (noms d'habitudes,
 *   de tâches, d'objectifs ou de jalons) ni aucun identifiant interne ;
 * - seulement des dates, des types de coche, des nombres, l'identifiant du thème
 *   (pris dans une liste connue) et la version de l'application ;
 * - rien n'est envoyé : l'utilisateur télécharge le fichier et choisit de le transmettre.
 *
 * Le même module contient l'analyse agrégée de plusieurs fichiers
 * (utilisée par scripts/analyse-stats.ts) : fonctions pures, sans accès aux fichiers.
 */
import { addDays, daysBetween, isLocalDate, toLocalDate, type LocalDate } from '../engine/dates.ts'
import type { AppData, CompletionKind, Frequency, Timestamp } from '../engine/model.ts'

export const ANONYMOUS_STATS_FORMAT = 'ascent-statistiques-anonymes'
export const ANONYMOUS_STATS_VERSION = 1

/** Valeur exportée quand le thème enregistré n'est pas dans la liste connue. */
export const UNKNOWN_THEME = 'autre'
/** Valeur exportée quand la version de l'application n'a pas la forme attendue. */
export const UNKNOWN_VERSION = 'inconnue'

const COMPLETION_KINDS: readonly CompletionKind[] = ['normal', 'recovery']
const VERSION_PATTERN = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/

export interface AnonymousHabit {
  createdOn: LocalDate
  /** Nombre de jours prévus par semaine (7 pour une habitude quotidienne). */
  daysPerWeek: number
}

export interface AnonymousCompletion {
  /** Rang de l'habitude dans `habits` (aucun identifiant interne n'est exporté). */
  habit: number
  date: LocalDate
  kind: CompletionKind
}

export interface AnonymousTask {
  createdOn: LocalDate
  completedOn?: LocalDate
}

export interface AnonymousGoal {
  createdOn: LocalDate
  achievedOn?: LocalDate
  milestones: number
  milestonesDone: number
}

export interface AnonymousStats {
  format: typeof ANONYMOUS_STATS_FORMAT
  formatVersion: typeof ANONYMOUS_STATS_VERSION
  appVersion: string
  themeId: string
  exportedOn: LocalDate
  habits: AnonymousHabit[]
  completions: AnonymousCompletion[]
  tasks: AnonymousTask[]
  goals: AnonymousGoal[]
}

export interface AnonymousStatsContext {
  /** Jour de l'export. */
  today: LocalDate
  /** Version de l'application (ex. « 0.1.0 »). */
  appVersion: string
  /** Identifiants des thèmes connus : tout autre valeur est remplacée par « autre ». */
  knownThemeIds: readonly string[]
}

function daysPerWeek(frequency: Frequency): number {
  return frequency.type === 'daily' ? 7 : frequency.days.length
}

/** Jour local d'un horodatage : l'heure exacte n'est jamais exportée. */
function dayOf(timestamp: Timestamp): LocalDate {
  return toLocalDate(new Date(timestamp))
}

/**
 * Construit les statistiques anonymes à partir des données de l'application.
 * Chaque champ est recopié explicitement : un nouveau champ du modèle n'est
 * jamais exporté par accident.
 */
export function createAnonymousStats(data: AppData, context: AnonymousStatsContext): AnonymousStats {
  const habitIndex = new Map(data.habits.map((habit, index) => [habit.id, index]))
  const completions: AnonymousCompletion[] = []
  for (const completion of data.completions) {
    const habit = habitIndex.get(completion.habitId)
    if (habit === undefined) continue
    completions.push({ habit, date: completion.date, kind: completion.kind === 'recovery' ? 'recovery' : 'normal' })
  }
  completions.sort((a, b) => a.date.localeCompare(b.date) || a.habit - b.habit)

  return {
    format: ANONYMOUS_STATS_FORMAT,
    formatVersion: ANONYMOUS_STATS_VERSION,
    appVersion: VERSION_PATTERN.test(context.appVersion) ? context.appVersion : UNKNOWN_VERSION,
    themeId: context.knownThemeIds.includes(data.settings.themeId) ? data.settings.themeId : UNKNOWN_THEME,
    exportedOn: context.today,
    habits: data.habits.map((habit) => ({ createdOn: habit.createdOn, daysPerWeek: daysPerWeek(habit.frequency) })),
    completions,
    tasks: data.tasks.map((task) => ({
      createdOn: dayOf(task.createdAt),
      ...(task.status === 'done' && task.completedAt && { completedOn: dayOf(task.completedAt) }),
    })),
    goals: data.goals.map((goal) => {
      const milestones = data.milestones.filter((milestone) => milestone.goalId === goal.id)
      return {
        createdOn: dayOf(goal.createdAt),
        ...(goal.status === 'achieved' && goal.achievedAt && { achievedOn: dayOf(goal.achievedAt) }),
        milestones: milestones.length,
        milestonesDone: milestones.filter((milestone) => milestone.status === 'done').length,
      }
    }),
  }
}

export function serializeAnonymousStats(stats: AnonymousStats): string {
  return `${JSON.stringify(stats, null, 2)}\n`
}

export function anonymousStatsFileName(today: LocalDate): string {
  return `ascent-statistiques-anonymes-${today}.json`
}

// ---------------------------------------------------------------------------
// Lecture d'un fichier reçu (analyse) : toute donnée externe est vérifiée.
// ---------------------------------------------------------------------------

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function optionalDate(value: unknown): LocalDate | undefined | false {
  if (value === undefined) return undefined
  return isLocalDate(value) ? value : false
}

/** Lit un fichier de statistiques anonymes ; renvoie null s'il est invalide. */
export function parseAnonymousStats(raw: unknown): AnonymousStats | null {
  if (!isRecord(raw) || raw.format !== ANONYMOUS_STATS_FORMAT || raw.formatVersion !== ANONYMOUS_STATS_VERSION) {
    return null
  }
  const { appVersion, themeId, exportedOn, habits, completions, tasks, goals } = raw
  if (typeof appVersion !== 'string' || typeof themeId !== 'string' || !isLocalDate(exportedOn)) return null
  if (![habits, completions, tasks, goals].every(Array.isArray)) return null

  const parsedHabits: AnonymousHabit[] = []
  for (const habit of habits as unknown[]) {
    if (!isRecord(habit) || !isLocalDate(habit.createdOn) || !isCount(habit.daysPerWeek) || habit.daysPerWeek > 7) {
      return null
    }
    parsedHabits.push({ createdOn: habit.createdOn, daysPerWeek: habit.daysPerWeek })
  }
  const parsedCompletions: AnonymousCompletion[] = []
  for (const completion of completions as unknown[]) {
    if (
      !isRecord(completion) ||
      !isCount(completion.habit) ||
      completion.habit >= parsedHabits.length ||
      !isLocalDate(completion.date) ||
      !COMPLETION_KINDS.includes(completion.kind as CompletionKind)
    ) {
      return null
    }
    parsedCompletions.push({ habit: completion.habit, date: completion.date, kind: completion.kind as CompletionKind })
  }
  const parsedTasks: AnonymousTask[] = []
  for (const task of tasks as unknown[]) {
    const completedOn = isRecord(task) ? optionalDate(task.completedOn) : false
    if (!isRecord(task) || !isLocalDate(task.createdOn) || completedOn === false) return null
    parsedTasks.push({ createdOn: task.createdOn, ...(completedOn && { completedOn }) })
  }
  const parsedGoals: AnonymousGoal[] = []
  for (const goal of goals as unknown[]) {
    const achievedOn = isRecord(goal) ? optionalDate(goal.achievedOn) : false
    if (
      !isRecord(goal) ||
      !isLocalDate(goal.createdOn) ||
      achievedOn === false ||
      !isCount(goal.milestones) ||
      !isCount(goal.milestonesDone) ||
      goal.milestonesDone > goal.milestones
    ) {
      return null
    }
    parsedGoals.push({
      createdOn: goal.createdOn,
      ...(achievedOn && { achievedOn }),
      milestones: goal.milestones,
      milestonesDone: goal.milestonesDone,
    })
  }

  return {
    format: ANONYMOUS_STATS_FORMAT,
    formatVersion: ANONYMOUS_STATS_VERSION,
    appVersion,
    themeId,
    exportedOn,
    habits: parsedHabits,
    completions: parsedCompletions,
    tasks: parsedTasks,
    goals: parsedGoals,
  }
}

// ---------------------------------------------------------------------------
// Analyse d'un ensemble de fichiers (un fichier = un testeur, voir P6-D7).
// ---------------------------------------------------------------------------

/** Indicateurs d'un testeur, calculés à partir de son fichier. */
export interface UserMetrics {
  /** Premier jour d'usage : première création ou première coche. */
  firstDay: LocalDate
  /** Jours observés, du premier jour au jour de l'export inclus. */
  observedDays: number
  checks: number
  /** Coches d'habitudes par semaine observée (au moins une semaine au dénominateur). */
  checksPerWeek: number
  /** Jours distincts avec au moins une action (création, coche, tâche terminée…). */
  activeDays: LocalDate[]
  habitOnFirstDay: boolean
  recoveries: number
}

/** Calcule les indicateurs d'un testeur ; null s'il n'a encore rien créé ni coché. */
export function computeUserMetrics(stats: AnonymousStats): UserMetrics | null {
  const activity = new Set<LocalDate>()
  for (const habit of stats.habits) activity.add(habit.createdOn)
  for (const completion of stats.completions) activity.add(completion.date)
  for (const task of stats.tasks) {
    activity.add(task.createdOn)
    if (task.completedOn) activity.add(task.completedOn)
  }
  for (const goal of stats.goals) {
    activity.add(goal.createdOn)
    if (goal.achievedOn) activity.add(goal.achievedOn)
  }
  const activeDays = [...activity].filter((day) => day <= stats.exportedOn).sort()
  const firstDay = activeDays[0]
  if (firstDay === undefined) return null

  const observedDays = daysBetween(firstDay, stats.exportedOn) + 1
  const checks = stats.completions.length
  return {
    firstDay,
    observedDays,
    checks,
    checksPerWeek: checks / Math.max(1, observedDays / 7),
    activeDays,
    habitOnFirstDay: stats.habits.some((habit) => habit.createdOn === firstDay),
    recoveries: stats.completions.filter((completion) => completion.kind === 'recovery').length,
  }
}

export interface RetentionResult {
  /** Testeurs dont l'export date d'au moins `day` jours après le premier jour. */
  eligible: number
  /** Parmi eux, ceux qui ont eu au moins une action à partir du jour `day`. */
  retained: number
}

/**
 * Rétention à J`day` : part des testeurs revenus au moins une fois à partir du
 * `day`-ième jour après leur premier jour (définition « non bornée », adaptée
 * aux petits échantillons ; voir P6-D8).
 */
export function retentionAt(users: readonly UserMetrics[], day: number): RetentionResult {
  const eligible = users.filter((user) => user.observedDays > day)
  const retained = eligible.filter((user) => {
    const threshold = addDays(user.firstDay, day)
    return user.activeDays.some((active) => active >= threshold)
  })
  return { eligible: eligible.length, retained: retained.length }
}

export interface StatsReport {
  files: number
  /** Fichiers sans aucune donnée (aucune création ni coche) : exclus des indicateurs. */
  emptyFiles: number
  users: number
  meanChecksPerWeek: number | null
  medianChecksPerWeek: number | null
  retentionD7: RetentionResult
  retentionD30: RetentionResult
  habitOnFirstDay: number
  usersWithRecovery: number
  recoveries: number
  checks: number
  themes: Record<string, number>
}

function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

export function analyzeStats(files: readonly AnonymousStats[]): StatsReport {
  const users = files.map(computeUserMetrics).filter((user): user is UserMetrics => user !== null)
  const themes: Record<string, number> = {}
  for (const file of files) themes[file.themeId] = (themes[file.themeId] ?? 0) + 1
  const perWeek = users.map((user) => user.checksPerWeek)
  return {
    files: files.length,
    emptyFiles: files.length - users.length,
    users: users.length,
    meanChecksPerWeek: mean(perWeek),
    medianChecksPerWeek: median(perWeek),
    retentionD7: retentionAt(users, 7),
    retentionD30: retentionAt(users, 30),
    habitOnFirstDay: users.filter((user) => user.habitOnFirstDay).length,
    usersWithRecovery: users.filter((user) => user.recoveries > 0).length,
    recoveries: users.reduce((sum, user) => sum + user.recoveries, 0),
    checks: users.reduce((sum, user) => sum + user.checks, 0),
    themes,
  }
}

function formatNumber(value: number | null): string {
  return value === null ? '–' : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

function count(value: number, word: string): string {
  return `${value} ${word}${value > 1 ? 's' : ''}`
}

function formatShare(part: number, total: number): string {
  return total === 0 ? '–' : `${Math.round((part / total) * 100)} % (${part}/${total})`
}

/** Rapport en tableau Markdown, en français. */
export function formatStatsReport(report: StatsReport): string {
  const themes = Object.entries(report.themes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([theme, count]) => `${theme} : ${count}`)
    .join(', ')
  const rows: [string, string, string][] = [
    [
      '**Coches par testeur et par semaine (moyenne)** – indicateur principal',
      formatNumber(report.meanChecksPerWeek),
      count(report.users, 'testeur'),
    ],
    ['Coches par testeur et par semaine (médiane)', formatNumber(report.medianChecksPerWeek), count(report.users, 'testeur')],
    ['Rétention à J7', formatShare(report.retentionD7.retained, report.retentionD7.eligible), 'testeurs observés au moins 8 jours'],
    ['Rétention à J30', formatShare(report.retentionD30.retained, report.retentionD30.eligible), 'testeurs observés au moins 31 jours'],
    ['Habitude créée le premier jour', formatShare(report.habitOnFirstDay, report.users), count(report.users, 'testeur')],
    ['Testeurs ayant utilisé la récupération', formatShare(report.usersWithRecovery, report.users), count(report.users, 'testeur')],
    ['Part des coches faites par récupération', formatShare(report.recoveries, report.checks), count(report.checks, 'coche')],
  ]
  return [
    '| Indicateur | Valeur | Base |',
    '| --- | --- | --- |',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
    '',
    `Fichiers lus : ${report.files} (dont ${report.emptyFiles} sans donnée). Thèmes : ${themes || '–'}.`,
    '',
  ].join('\n')
}
