/**
 * Export et import des données au format JSON (sauvegarde manuelle).
 */
import { SCHEMA_VERSION, type AppData, type LocalDate, type Timestamp } from '../engine/index.ts'
import { DataValidationError, parseAppData } from './validation.ts'

export const BACKUP_APP_ID = 'ascent'

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  schemaVersion: number
  exportedAt: Timestamp
  data: AppData
}

export type BackupParseResult =
  | { ok: true; data: AppData; exportedAt: Timestamp | null }
  | { ok: false; message: string; issues: string[] }

export function createBackup(data: AppData, now: Timestamp): BackupFile {
  return { app: BACKUP_APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: now, data }
}

export function serializeBackup(backup: BackupFile): string {
  return `${JSON.stringify(backup, null, 2)}\n`
}

export function backupFileName(today: LocalDate): string {
  return `ascent-sauvegarde-${today}.json`
}

/** Lit un fichier de sauvegarde ; ne lève jamais d'exception. */
export function parseBackup(text: string): BackupParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, message: "Ce fichier n'est pas un fichier JSON valide.", issues: [] }
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== BACKUP_APP_ID) {
    return { ok: false, message: "Ce fichier n'est pas une sauvegarde Ascent.", issues: [] }
  }
  const { data, exportedAt } = raw as { data?: unknown; exportedAt?: unknown }
  try {
    return {
      ok: true,
      data: parseAppData(data),
      exportedAt: typeof exportedAt === 'string' && !Number.isNaN(Date.parse(exportedAt)) ? exportedAt : null,
    }
  } catch (error) {
    if (error instanceof DataValidationError) {
      return { ok: false, message: error.message, issues: error.issues }
    }
    throw error
  }
}

export interface DataSummary {
  habits: number
  tasks: number
  goals: number
  completions: number
}

export function summarizeData(data: AppData): DataSummary {
  return {
    habits: data.habits.length,
    tasks: data.tasks.length,
    goals: data.goals.length,
    completions: data.completions.length,
  }
}

/** Vrai si les données contiennent au moins un élément créé par l'utilisateur. */
export function hasUserContent(data: AppData): boolean {
  return data.habits.length + data.tasks.length + data.goals.length > 0
}
