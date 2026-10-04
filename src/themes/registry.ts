import { plainTheme } from './plain/index.ts'
import type { Theme } from './types.ts'

/** Thèmes disponibles. Le thème illustré s'ajoutera ici. */
export const THEMES: readonly Theme[] = [plainTheme]

export const DEFAULT_THEME_ID = plainTheme.id

/** Thème demandé, ou thème par défaut s'il est inconnu (ex. sauvegarde d'une autre version). */
export function getTheme(themeId: string): Theme {
  return THEMES.find((theme) => theme.id === themeId) ?? plainTheme
}
