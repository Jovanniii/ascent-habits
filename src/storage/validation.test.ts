import { describe, expect, it } from 'vitest'
import { DataValidationError, parseAppData } from './validation.ts'
import { sampleAppData } from './testing.ts'

function issuesOf(value: unknown): string[] {
  try {
    parseAppData(value)
  } catch (error) {
    if (error instanceof DataValidationError) return error.issues
    throw error
  }
  throw new Error('Une DataValidationError était attendue.')
}

describe('parseAppData', () => {
  it('accepte des données valides et les restitue à l’identique', () => {
    const data = sampleAppData()
    expect(parseAppData(JSON.parse(JSON.stringify(data)))).toEqual(data)
  })

  it('accepte les jours notés « fait après coup »', () => {
    const data = sampleAppData()
    const withLate = { ...data, completions: [{ habitId: data.habits[0]!.id, date: data.habits[0]!.createdOn, kind: 'late' as const }] }
    expect(parseAppData(JSON.parse(JSON.stringify(withLate))).completions).toEqual(withLate.completions)
  })

  it('écarte les champs inconnus', () => {
    const data = sampleAppData()
    const raw = JSON.parse(JSON.stringify(data))
    raw.habits[0].script = '<script>'
    raw.extra = true
    const parsed = parseAppData(raw)
    expect(parsed.habits[0]).not.toHaveProperty('script')
    expect(parsed).not.toHaveProperty('extra')
  })

  it('refuse une valeur qui n’est pas un objet', () => {
    expect(() => parseAppData(null)).toThrow(DataValidationError)
    expect(() => parseAppData([])).toThrow(DataValidationError)
  })

  it('refuse une version absente ou plus récente', () => {
    const raw = JSON.parse(JSON.stringify(sampleAppData()))
    expect(() => parseAppData({ ...raw, schemaVersion: undefined })).toThrow(/Version/)
    expect(() => parseAppData({ ...raw, schemaVersion: 99 })).toThrow(/plus récente/)
  })

  it('signale précisément les champs invalides', () => {
    const raw = JSON.parse(JSON.stringify(sampleAppData()))
    raw.habits[0].name = ''
    raw.habits[0].frequency = { type: 'specificDays', days: [0, 8] }
    raw.completions[0].date = '2026-02-30'
    raw.tasks[0].status = 'deleted'
    raw.settings.animationsEnabled = 'oui'
    expect(issuesOf(raw)).toEqual([
      'habits[0].name : texte non vide attendu',
      'habits[0].frequency.days : jours de 1 (lundi) à 7 (dimanche) attendus',
      'completions[0].date : date AAAA-MM-JJ attendue',
      'tasks[0].status : valeur attendue parmi todo, done',
      'settings.animationsEnabled : booléen attendu',
    ])
  })

  it('vérifie la cohérence entre les objets', () => {
    const raw = JSON.parse(JSON.stringify(sampleAppData()))
    raw.completions.push({ ...raw.completions[0] })
    raw.completions.push({ habitId: 'fantôme', date: '2026-10-01', kind: 'normal' })
    raw.milestones[0].goalId = 'fantôme'
    raw.tasks.push({ ...raw.tasks[0] })
    expect(issuesOf(raw)).toEqual([
      'tasks[2].id : identifiant en double « 2026-10-01-1 »',
      'completions[3] : validation en double pour ce jour',
      'completions[4].habitId : habitude inconnue',
      'milestones[0].goalId : objectif inconnu',
    ])
  })

  it('refuse une pause qui se termine avant de commencer', () => {
    const raw = JSON.parse(JSON.stringify(sampleAppData()))
    raw.habits[0].pauses = [{ from: '2026-10-05', to: '2026-10-01' }]
    expect(issuesOf(raw)).toEqual(['habits[0].pauses[0] : fin de pause avant son début'])
  })

  it('limite le nombre d’anomalies détaillées', () => {
    const raw = JSON.parse(JSON.stringify(sampleAppData()))
    raw.completions = Array.from({ length: 30 }, () => ({ habitId: 1, date: 'x', kind: 'y' }))
    expect(issuesOf(raw)).toHaveLength(10)
  })
})
