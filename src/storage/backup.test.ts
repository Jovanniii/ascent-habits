import { describe, expect, it } from 'vitest'
import { createEmptyAppData } from '../engine/index.ts'
import {
  backupFileName,
  createBackup,
  hasUserContent,
  parseBackup,
  serializeBackup,
  summarizeData,
} from './backup.ts'
import { sampleAppData } from './testing.ts'

const NOW = '2026-10-04T10:00:00.000Z'

describe('export', () => {
  it('produit un fichier JSON lisible et identifiable', () => {
    const text = serializeBackup(createBackup(sampleAppData(), NOW))
    const parsed = JSON.parse(text)
    expect(parsed).toMatchObject({ app: 'ascent', schemaVersion: 1, exportedAt: NOW })
    expect(text).toContain('\n  "app": "ascent"')
  })

  it('nomme le fichier avec la date du jour', () => {
    expect(backupFileName('2026-10-04')).toBe('ascent-sauvegarde-2026-10-04.json')
  })
})

describe('parseBackup', () => {
  it("relit exactement les données exportées (aller-retour)", () => {
    const data = sampleAppData()
    const result = parseBackup(serializeBackup(createBackup(data, NOW)))
    expect(result).toEqual({ ok: true, data, exportedAt: NOW })
  })

  it("refuse un fichier qui n'est pas du JSON", () => {
    expect(parseBackup('bonjour')).toMatchObject({ ok: false, message: expect.stringMatching(/JSON/) })
  })

  it("refuse un JSON qui n'est pas une sauvegarde Ascent", () => {
    expect(parseBackup('{"habits": []}')).toMatchObject({ ok: false, message: expect.stringMatching(/Ascent/) })
    expect(parseBackup('null')).toMatchObject({ ok: false })
  })

  it('détaille les anomalies d’une sauvegarde corrompue', () => {
    const backup = JSON.parse(serializeBackup(createBackup(sampleAppData(), NOW)))
    backup.data.goals[0].status = 'oublié'
    const result = parseBackup(JSON.stringify(backup))
    expect(result).toMatchObject({ ok: false, issues: ['goals[0].status : valeur attendue parmi active, achieved, archived'] })
  })

  it("refuse une sauvegarde d'une version plus récente", () => {
    const backup = JSON.parse(serializeBackup(createBackup(sampleAppData(), NOW)))
    backup.data.schemaVersion = 2
    expect(parseBackup(JSON.stringify(backup))).toMatchObject({ ok: false, message: expect.stringMatching(/plus récente/) })
  })
})

describe('résumé des données', () => {
  it('compte les éléments pour la confirmation d’import', () => {
    expect(summarizeData(sampleAppData())).toEqual({ habits: 2, tasks: 2, goals: 1, completions: 3 })
  })

  it('détecte des données vides', () => {
    expect(hasUserContent(createEmptyAppData({ themeId: 'plain', animationsEnabled: true }))).toBe(false)
    expect(hasUserContent(sampleAppData())).toBe(true)
  })
})
