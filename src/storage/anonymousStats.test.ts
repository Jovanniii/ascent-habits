import { describe, expect, it } from 'vitest'
import {
  addMilestone,
  addTask,
  createEmptyAppData,
  createGoal,
  createHabit,
  markGoalAchieved,
  toggleHabitToday,
  toggleMilestone,
  toggleTask,
  type AppData,
  type CommandContext,
} from '../engine/index.ts'
import {
  ANONYMOUS_STATS_FORMAT,
  analyzeStats,
  anonymousStatsFileName,
  computeUserMetrics,
  createAnonymousStats,
  formatStatsReport,
  parseAnonymousStats,
  retentionAt,
  serializeAnonymousStats,
  type AnonymousStats,
} from './anonymousStats.ts'
import { sampleAppData } from './testing.ts'

const CONTEXT = { today: '2026-10-04', appVersion: '0.1.0', knownThemeIds: ['alpha', 'plain'] }

function context(today: string): CommandContext {
  let counter = 0
  return { today, now: `${today}T08:00:00.000Z`, newId: () => `${today}-${++counter}` }
}

/** Textes « libres » piégés : chacun ne doit jamais apparaître dans l'export. */
const SECRET_TEXTS = [
  'Secret-habitude-Zébulon',
  'Tâche privée : appeler le docteur Martin',
  'Objectif intime 🌙',
  'Jalon confidentiel « 42 »',
  '<script>alert(1)</script>',
  'normal',
  'alpha',
]

/** Données dont chaque texte saisi est un texte piégé, sur tous les types d'objets. */
function dataWithSecrets(texts: readonly string[], themeId = 'alpha'): AppData {
  let data = createEmptyAppData({ themeId, animationsEnabled: true })
  texts.forEach((text, index) => {
    const ctx = context(`2026-09-${String(10 + index).padStart(2, '0')}`)
    const prefix = `${ctx.today}-`
    data = createGoal(data, { name: `${text} (objectif)`, dueDate: '2027-01-01' }, ctx)
    data = addMilestone(data, `${prefix}1`, `${text} (jalon)`, ctx)
    data = toggleMilestone(data, `${prefix}2`)
    data = createHabit(data, { name: `${text} (habitude)`, frequency: { type: 'daily' }, goalId: `${prefix}1` }, ctx)
    data = toggleHabitToday(data, `${prefix}3`, ctx)
    data = addTask(data, { name: `${text} (tâche)`, dueDate: '2026-12-01', goalId: `${prefix}1` }, ctx)
    data = toggleTask(data, `${prefix}4`, ctx)
    data = markGoalAchieved(data, `${prefix}1`, ctx)
  })
  return data
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const ALLOWED_STRINGS = new Set([ANONYMOUS_STATS_FORMAT, 'normal', 'recovery', 'alpha', 'plain', 'autre', 'inconnue'])
const ALLOWED_KEYS = new Set([
  'format',
  'formatVersion',
  'appVersion',
  'themeId',
  'exportedOn',
  'habits',
  'completions',
  'tasks',
  'goals',
  'createdOn',
  'daysPerWeek',
  'habit',
  'date',
  'kind',
  'completedOn',
  'achievedOn',
  'milestones',
  'milestonesDone',
])

/** Parcourt tout le JSON et relève chaque chaîne et chaque clé rencontrée. */
function collect(value: unknown, strings: string[], keys: string[]): void {
  if (typeof value === 'string') strings.push(value)
  else if (Array.isArray(value)) value.forEach((item) => collect(item, strings, keys))
  else if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      keys.push(key)
      collect(item, strings, keys)
    }
  }
}

describe('createAnonymousStats : aucun texte libre ne sort', () => {
  it("ne contient aucun des textes saisis par l'utilisateur", () => {
    const data = dataWithSecrets(SECRET_TEXTS)
    const json = serializeAnonymousStats(createAnonymousStats(data, CONTEXT))
    // Les noms piégés existent bien dans les données d'origine…
    expect(JSON.stringify(data)).toContain('Secret-habitude-Zébulon')
    // … mais aucun nom saisi ne se retrouve dans l'export.
    const names = [...data.habits, ...data.tasks, ...data.goals, ...data.milestones].map((item) => item.name)
    expect(names.length).toBe(SECRET_TEXTS.length * 4)
    for (const name of names) expect(json).not.toContain(name)
    for (const text of SECRET_TEXTS.slice(0, 5)) expect(json).not.toContain(text)
  })

  it("ne contient que des dates, des types de coche, des nombres, le thème et la version", () => {
    const stats = createAnonymousStats(dataWithSecrets(SECRET_TEXTS), CONTEXT)
    const strings: string[] = []
    const keys: string[] = []
    collect(JSON.parse(serializeAnonymousStats(stats)), strings, keys)

    for (const value of strings) {
      const allowed = DATE.test(value) || ALLOWED_STRINGS.has(value) || value === CONTEXT.appVersion
      expect(allowed, `chaîne inattendue dans l'export : « ${value} »`).toBe(true)
    }
    for (const key of keys) expect(ALLOWED_KEYS.has(key), `clé inattendue : « ${key} »`).toBe(true)
  })

  it("n'exporte aucun identifiant interne ni horodatage précis", () => {
    const data = dataWithSecrets(['A'])
    const json = serializeAnonymousStats(createAnonymousStats(data, CONTEXT))
    for (const habit of data.habits) expect(json).not.toContain(habit.id)
    expect(json).not.toMatch(/T\d{2}:\d{2}/)
  })

  it('remplace un thème inconnu (texte libre possible) par « autre »', () => {
    const stats = createAnonymousStats(dataWithSecrets([], 'Thème de Victor'), CONTEXT)
    expect(stats.themeId).toBe('autre')
  })

  it("remplace une version d'application inattendue par « inconnue »", () => {
    const stats = createAnonymousStats(sampleAppData(), { ...CONTEXT, appVersion: '1.0.0-Victor' })
    expect(stats.appVersion).toBe('inconnue')
  })

  it('reste sans texte libre quels que soient les noms saisis (200 noms aléatoires)', () => {
    let seed = 7
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const alphabet = 'abcdefghijklmnopqrstuvwxyzéèàçùœ ABCXYZ0123456789-_:«»"\'{}[]<>🌙'
    const texts = Array.from({ length: 200 }, () =>
      Array.from({ length: 8 + Math.floor(random() * 20) }, () => alphabet[Math.floor(random() * alphabet.length)]).join(''),
    )
    const data = dataWithSecrets(texts.slice(0, 19))
    const stats = createAnonymousStats(data, CONTEXT)
    const strings: string[] = []
    collect(stats, strings, [])
    for (const value of strings) {
      expect(DATE.test(value) || ALLOWED_STRINGS.has(value) || value === CONTEXT.appVersion).toBe(true)
    }
  })
})

describe('createAnonymousStats : contenu', () => {
  it('résume les habitudes, coches, tâches et objectifs', () => {
    const stats = createAnonymousStats(sampleAppData(), CONTEXT)
    expect(stats).toMatchObject({
      format: ANONYMOUS_STATS_FORMAT,
      formatVersion: 1,
      appVersion: '0.1.0',
      themeId: 'plain',
      exportedOn: '2026-10-04',
    })
    expect(stats.habits).toEqual([
      { createdOn: '2026-09-01', daysPerWeek: 3 },
      { createdOn: '2026-09-28', daysPerWeek: 7 },
    ])
    expect(stats.completions).toEqual([
      { habit: 1, date: '2026-09-28', kind: 'normal' },
      { habit: 1, date: '2026-09-29', kind: 'recovery' },
      { habit: 1, date: '2026-09-30', kind: 'normal' },
    ])
    expect(stats.tasks).toEqual([
      { createdOn: '2026-10-01' },
      { createdOn: '2026-10-02', completedOn: '2026-10-03' },
    ])
    expect(stats.goals).toEqual([{ createdOn: '2026-09-01', milestones: 2, milestonesDone: 1 }])
  })

  it("ignore une coche dont l'habitude n'existe plus", () => {
    const data = { ...sampleAppData() }
    data.completions = [...data.completions, { habitId: 'disparue', date: '2026-10-01', kind: 'normal' }]
    expect(createAnonymousStats(data, CONTEXT).completions).toHaveLength(3)
  })

  it('nomme le fichier avec la date du jour', () => {
    expect(anonymousStatsFileName('2026-10-04')).toBe('ascent-statistiques-anonymes-2026-10-04.json')
  })
})

describe('parseAnonymousStats', () => {
  const valid = createAnonymousStats(sampleAppData(), CONTEXT)

  it('relit un export (aller-retour)', () => {
    expect(parseAnonymousStats(JSON.parse(serializeAnonymousStats(valid)))).toEqual(valid)
  })

  it('écarte les champs inconnus', () => {
    const parsed = parseAnonymousStats({ ...valid, notes: 'texte', habits: [{ ...valid.habits[0], name: 'Lire' }] })
    expect(JSON.stringify(parsed)).not.toContain('Lire')
    expect(JSON.stringify(parsed)).not.toContain('notes')
  })

  it.each([
    ['pas un objet', 'texte'],
    ['format inconnu', { ...valid, format: 'autre' }],
    ['version inconnue', { ...valid, formatVersion: 2 }],
    ['date invalide', { ...valid, exportedOn: '2026-02-30' }],
    ['liste manquante', { ...valid, tasks: undefined }],
    ['habitude invalide', { ...valid, habits: [{ createdOn: '2026-09-01', daysPerWeek: 8 }] }],
    ['coche vers une habitude absente', { ...valid, completions: [{ habit: 5, date: '2026-09-01', kind: 'normal' }] }],
    ['type de coche inconnu', { ...valid, completions: [{ habit: 0, date: '2026-09-01', kind: 'bonus' }] }],
    ['tâche invalide', { ...valid, tasks: [{ createdOn: '2026-09-01', completedOn: 'hier' }] }],
    ['objectif invalide', { ...valid, goals: [{ createdOn: '2026-09-01', milestones: 1, milestonesDone: 2 }] }],
    ['objectif sans nombres', { ...valid, goals: [{ createdOn: '2026-09-01', achievedOn: '2026-09-02' }] }],
  ])('refuse un fichier invalide : %s', (_label, raw) => {
    expect(parseAnonymousStats(raw)).toBeNull()
  })

  it('accepte des dates facultatives', () => {
    const raw = {
      ...valid,
      tasks: [{ createdOn: '2026-09-01', completedOn: '2026-09-02' }],
      goals: [{ createdOn: '2026-09-01', achievedOn: '2026-09-03', milestones: 0, milestonesDone: 0 }],
    }
    expect(parseAnonymousStats(raw)?.goals[0]?.achievedOn).toBe('2026-09-03')
  })
})

/** Fichier de test minimal : habitudes créées et coches aux dates données. */
function statsFile(overrides: Partial<AnonymousStats>): AnonymousStats {
  return {
    format: ANONYMOUS_STATS_FORMAT,
    formatVersion: 1,
    appVersion: '0.1.0',
    themeId: 'alpha',
    exportedOn: '2026-10-31',
    habits: [],
    completions: [],
    tasks: [],
    goals: [],
    ...overrides,
  }
}

function checks(dates: string[], kind: 'normal' | 'recovery' = 'normal') {
  return dates.map((date) => ({ habit: 0, date, kind }))
}

describe('analyse', () => {
  // Testeur A : 31 jours observés (1er → 31 octobre), 31 coches dont 1 rattrapage, actif jusqu'au bout.
  const userA = statsFile({
    habits: [{ createdOn: '2026-10-01', daysPerWeek: 7 }],
    completions: [
      ...checks(Array.from({ length: 30 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)),
      ...checks(['2026-10-31'], 'recovery'),
    ],
  })
  // Testeur B : commence par une tâche le 1er, habitude le 2, s'arrête le 5 ; export le 31.
  const userB = statsFile({
    habits: [{ createdOn: '2026-10-02', daysPerWeek: 3 }],
    completions: checks(['2026-10-02', '2026-10-05']),
    tasks: [{ createdOn: '2026-10-01' }],
  })
  // Testeur C : 3 jours d'usage seulement, pas encore éligible à J7.
  const userC = statsFile({
    exportedOn: '2026-10-03',
    habits: [{ createdOn: '2026-10-01', daysPerWeek: 7 }],
    completions: checks(['2026-10-01', '2026-10-02', '2026-10-03']),
    goals: [{ createdOn: '2026-10-02', achievedOn: '2026-10-03', milestones: 2, milestonesDone: 2 }],
  })
  const empty = statsFile({ themeId: 'plain' })

  it('calcule les indicateurs d’un testeur', () => {
    expect(computeUserMetrics(userB)).toMatchObject({
      firstDay: '2026-10-01',
      observedDays: 31,
      checks: 2,
      habitOnFirstDay: false,
      recoveries: 0,
    })
    expect(computeUserMetrics(userC)?.checksPerWeek).toBe(3) // moins d'une semaine : une semaine au dénominateur
    expect(computeUserMetrics(userA)?.checksPerWeek).toBeCloseTo(31 / (31 / 7))
    expect(computeUserMetrics(empty)).toBeNull()
  })

  it('mesure la rétention à J7 et J30 parmi les testeurs éligibles', () => {
    const users = [userA, userB, userC].map((file) => computeUserMetrics(file)!)
    expect(retentionAt(users, 7)).toEqual({ eligible: 2, retained: 1 })
    expect(retentionAt(users, 30)).toEqual({ eligible: 2, retained: 1 })
  })

  it('agrège tous les fichiers', () => {
    const report = analyzeStats([userA, userB, userC, empty])
    expect(report).toMatchObject({
      files: 4,
      emptyFiles: 1,
      users: 3,
      habitOnFirstDay: 2,
      usersWithRecovery: 1,
      recoveries: 1,
      checks: 36,
      themes: { alpha: 3, plain: 1 },
    })
    expect(report.medianChecksPerWeek).toBe(3)
    expect(report.meanChecksPerWeek).toBeCloseTo((7 + 2 / (31 / 7) + 3) / 3)
  })

  it('produit un tableau Markdown lisible', () => {
    const markdown = formatStatsReport(analyzeStats([userA, userB, userC, empty]))
    expect(markdown).toContain('| Indicateur | Valeur | Base |')
    expect(markdown).toContain('| Rétention à J7 | 50 % (1/2) |')
    expect(markdown).toContain('| Habitude créée le premier jour | 67 % (2/3) |')
    expect(markdown).toContain('Fichiers lus : 4 (dont 1 sans donnée). Thèmes : alpha : 3, plain : 1.')
  })

  it('reste lisible sans aucun fichier', () => {
    const markdown = formatStatsReport(analyzeStats([]))
    expect(markdown).toContain('| – |')
    expect(markdown).toContain('Thèmes : –.')
  })
})
