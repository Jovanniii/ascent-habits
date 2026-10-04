/**
 * Validation des données lues depuis le stockage ou un fichier importé.
 *
 * Toute donnée externe est considérée comme non fiable : chaque champ est vérifié,
 * les champs inconnus sont écartés et la cohérence entre objets est contrôlée.
 */
import {
  ISO_WEEKDAYS,
  SCHEMA_VERSION,
  isLocalDate,
  type AppData,
  type Completion,
  type Frequency,
  type Goal,
  type Habit,
  type IsoWeekday,
  type Milestone,
  type PausePeriod,
  type Settings,
  type Task,
} from '../engine/index.ts'

/** Nombre maximal d'anomalies détaillées dans un message d'erreur. */
const MAX_REPORTED_ISSUES = 10

export class DataValidationError extends Error {
  readonly issues: string[]

  constructor(message: string, issues: string[] = []) {
    super(message)
    this.name = 'DataValidationError'
    this.issues = issues.slice(0, MAX_REPORTED_ISSUES)
  }
}

type UnknownRecord = Record<string, unknown>

class Checker {
  readonly issues: string[] = []

  fail(path: string, message: string): void {
    this.issues.push(`${path} : ${message}`)
  }

  record(value: unknown, path: string): UnknownRecord | null {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as UnknownRecord
    }
    this.fail(path, 'objet attendu')
    return null
  }

  array(value: unknown, path: string): unknown[] {
    if (Array.isArray(value)) return value
    this.fail(path, 'liste attendue')
    return []
  }

  text(value: unknown, path: string): string {
    if (typeof value === 'string' && value.trim().length > 0) return value
    this.fail(path, 'texte non vide attendu')
    return ''
  }

  optionalText(value: unknown, path: string): string | undefined {
    return value === undefined ? undefined : this.text(value, path)
  }

  date(value: unknown, path: string): string {
    if (isLocalDate(value)) return value
    this.fail(path, 'date AAAA-MM-JJ attendue')
    return ''
  }

  optionalDate(value: unknown, path: string): string | undefined {
    return value === undefined ? undefined : this.date(value, path)
  }

  oneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
    if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T
    this.fail(path, `valeur attendue parmi ${allowed.join(', ')}`)
    return allowed[0]!
  }

  boolean(value: unknown, path: string): boolean {
    if (typeof value === 'boolean') return value
    this.fail(path, 'booléen attendu')
    return false
  }
}

function withOptional<T extends object, K extends string, V>(target: T, key: K, value: V | undefined): T {
  return value === undefined ? target : { ...target, [key]: value }
}

function parseFrequency(c: Checker, value: unknown, path: string): Frequency {
  const raw = c.record(value, path)
  if (!raw) return { type: 'daily' }
  const type = c.oneOf(raw.type, ['daily', 'specificDays'] as const, `${path}.type`)
  if (type === 'daily') return { type: 'daily' }
  const days = c.array(raw.days, `${path}.days`)
  if (days.length === 0 || days.some((day) => !ISO_WEEKDAYS.includes(day as IsoWeekday))) {
    c.fail(`${path}.days`, 'jours de 1 (lundi) à 7 (dimanche) attendus')
  }
  return { type: 'specificDays', days: [...new Set(days as IsoWeekday[])].sort((a, b) => a - b) }
}

function parsePause(c: Checker, value: unknown, path: string): PausePeriod {
  const raw = c.record(value, path) ?? {}
  const from = c.date(raw.from, `${path}.from`)
  const to = c.optionalDate(raw.to, `${path}.to`)
  if (to !== undefined && to < from) c.fail(path, 'fin de pause avant son début')
  return withOptional({ from }, 'to', to)
}

function parseHabit(c: Checker, value: unknown, path: string): Habit {
  const raw = c.record(value, path) ?? {}
  const habit: Habit = {
    id: c.text(raw.id, `${path}.id`),
    name: c.text(raw.name, `${path}.name`),
    frequency: parseFrequency(c, raw.frequency, `${path}.frequency`),
    createdOn: c.date(raw.createdOn, `${path}.createdOn`),
    status: c.oneOf(raw.status, ['active', 'paused', 'archived'] as const, `${path}.status`),
    pauses: c.array(raw.pauses, `${path}.pauses`).map((pause, i) => parsePause(c, pause, `${path}.pauses[${i}]`)),
  }
  return withOptional(habit, 'goalId', c.optionalText(raw.goalId, `${path}.goalId`))
}

function parseCompletion(c: Checker, value: unknown, path: string): Completion {
  const raw = c.record(value, path) ?? {}
  return {
    habitId: c.text(raw.habitId, `${path}.habitId`),
    date: c.date(raw.date, `${path}.date`),
    kind: c.oneOf(raw.kind, ['normal', 'recovery'] as const, `${path}.kind`),
  }
}

function parseTask(c: Checker, value: unknown, path: string): Task {
  const raw = c.record(value, path) ?? {}
  let task: Task = {
    id: c.text(raw.id, `${path}.id`),
    name: c.text(raw.name, `${path}.name`),
    status: c.oneOf(raw.status, ['todo', 'done'] as const, `${path}.status`),
    createdAt: c.text(raw.createdAt, `${path}.createdAt`),
  }
  task = withOptional(task, 'dueDate', c.optionalDate(raw.dueDate, `${path}.dueDate`))
  task = withOptional(task, 'completedAt', c.optionalText(raw.completedAt, `${path}.completedAt`))
  return withOptional(task, 'goalId', c.optionalText(raw.goalId, `${path}.goalId`))
}

function parseGoal(c: Checker, value: unknown, path: string): Goal {
  const raw = c.record(value, path) ?? {}
  let goal: Goal = {
    id: c.text(raw.id, `${path}.id`),
    name: c.text(raw.name, `${path}.name`),
    status: c.oneOf(raw.status, ['active', 'achieved', 'archived'] as const, `${path}.status`),
    createdAt: c.text(raw.createdAt, `${path}.createdAt`),
  }
  goal = withOptional(goal, 'dueDate', c.optionalDate(raw.dueDate, `${path}.dueDate`))
  return withOptional(goal, 'achievedAt', c.optionalText(raw.achievedAt, `${path}.achievedAt`))
}

function parseMilestone(c: Checker, value: unknown, path: string): Milestone {
  const raw = c.record(value, path) ?? {}
  return {
    id: c.text(raw.id, `${path}.id`),
    goalId: c.text(raw.goalId, `${path}.goalId`),
    name: c.text(raw.name, `${path}.name`),
    status: c.oneOf(raw.status, ['todo', 'done'] as const, `${path}.status`),
    createdAt: c.text(raw.createdAt, `${path}.createdAt`),
  }
}

function parseSettings(c: Checker, value: unknown, path: string): Settings {
  const raw = c.record(value, path) ?? {}
  return {
    themeId: c.text(raw.themeId, `${path}.themeId`),
    animationsEnabled: c.boolean(raw.animationsEnabled, `${path}.animationsEnabled`),
  }
}

function checkUniqueIds(c: Checker, items: readonly { id: string }[], path: string): void {
  const seen = new Set<string>()
  items.forEach((item, i) => {
    if (seen.has(item.id)) c.fail(`${path}[${i}].id`, `identifiant en double « ${item.id} »`)
    seen.add(item.id)
  })
}

function checkReferences(c: Checker, data: Omit<AppData, 'schemaVersion' | 'settings'>): void {
  const habitIds = new Set(data.habits.map((habit) => habit.id))
  const goalIds = new Set(data.goals.map((goal) => goal.id))
  const completionKeys = new Set<string>()

  data.completions.forEach((completion, i) => {
    if (!habitIds.has(completion.habitId)) c.fail(`completions[${i}].habitId`, 'habitude inconnue')
    const key = `${completion.habitId}|${completion.date}`
    if (completionKeys.has(key)) c.fail(`completions[${i}]`, 'validation en double pour ce jour')
    completionKeys.add(key)
  })
  data.milestones.forEach((milestone, i) => {
    if (!goalIds.has(milestone.goalId)) c.fail(`milestones[${i}].goalId`, 'objectif inconnu')
  })
  data.habits.forEach((habit, i) => {
    if (habit.goalId !== undefined && !goalIds.has(habit.goalId)) c.fail(`habits[${i}].goalId`, 'objectif inconnu')
  })
  data.tasks.forEach((task, i) => {
    if (task.goalId !== undefined && !goalIds.has(task.goalId)) c.fail(`tasks[${i}].goalId`, 'objectif inconnu')
  })
}

/**
 * Vérifie et reconstruit les données de l'application.
 * @throws DataValidationError si les données sont invalides ou d'une version inconnue.
 */
export function parseAppData(value: unknown): AppData {
  const c = new Checker()
  const raw = c.record(value, 'données')
  if (!raw) {
    throw new DataValidationError('Les données ne sont pas un objet.', c.issues)
  }
  const version = raw.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new DataValidationError('Version des données absente ou invalide.')
  }
  if (version > SCHEMA_VERSION) {
    throw new DataValidationError(
      "Ces données viennent d'une version plus récente de l'application. Mettre l'application à jour puis réessayer.",
    )
  }
  // Les migrations des futures versions du schéma s'insèreront ici (version < SCHEMA_VERSION).

  const parsed = {
    habits: c.array(raw.habits, 'habits').map((v, i) => parseHabit(c, v, `habits[${i}]`)),
    completions: c.array(raw.completions, 'completions').map((v, i) => parseCompletion(c, v, `completions[${i}]`)),
    tasks: c.array(raw.tasks, 'tasks').map((v, i) => parseTask(c, v, `tasks[${i}]`)),
    goals: c.array(raw.goals, 'goals').map((v, i) => parseGoal(c, v, `goals[${i}]`)),
    milestones: c.array(raw.milestones, 'milestones').map((v, i) => parseMilestone(c, v, `milestones[${i}]`)),
  }
  const settings = parseSettings(c, raw.settings, 'settings')

  checkUniqueIds(c, parsed.habits, 'habits')
  checkUniqueIds(c, parsed.tasks, 'tasks')
  checkUniqueIds(c, parsed.goals, 'goals')
  checkUniqueIds(c, parsed.milestones, 'milestones')
  checkReferences(c, parsed)

  if (c.issues.length > 0) {
    throw new DataValidationError(`Données invalides (${c.issues.length} anomalie(s)).`, c.issues)
  }
  return { schemaVersion: SCHEMA_VERSION, ...parsed, settings }
}
