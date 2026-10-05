import type { Theme } from './types.ts'

/**
 * Thèmes disponibles, découverts automatiquement : chaque dossier src/themes/<id>/
 * exporte `theme` depuis son fichier theme.ts. Aucun thème n'est nommé ici.
 */
const modules = import.meta.glob<Theme>('./*/theme.ts', { eager: true, import: 'theme' })

export const THEMES: readonly Theme[] = Object.values(modules).sort((a, b) => a.name.localeCompare(b.name, 'fr'))

/** Thème des nouvelles installations : celui qui se déclare par défaut. */
export const DEFAULT_THEME: Theme = THEMES.find((theme) => theme.isDefault) ?? THEMES[0]!

export const DEFAULT_THEME_ID = DEFAULT_THEME.id

/** Thème demandé, ou thème par défaut s'il est inconnu (ex. sauvegarde d'une autre version). */
export function getTheme(themeId: string): Theme {
  return THEMES.find((theme) => theme.id === themeId) ?? DEFAULT_THEME
}
