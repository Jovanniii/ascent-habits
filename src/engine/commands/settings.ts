import type { AppData, Settings } from '../model.ts'

export function updateSettings(data: AppData, changes: Partial<Settings>): AppData {
  return { ...data, settings: { ...data.settings, ...changes } }
}
