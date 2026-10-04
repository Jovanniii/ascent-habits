import type { Theme, ThemeTokens } from './types.ts'

const STYLE_ELEMENT_ID = 'ascent-theme'

function declarations(tokens: ThemeTokens): string {
  return Object.entries(tokens)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
}

/** Feuille de style qui déclare les jetons du thème, en clair et en sombre. */
export function themeStyleSheet(theme: Theme): string {
  return [
    `:root {\n${declarations(theme.tokens.light)}\n}`,
    `@media (prefers-color-scheme: dark) {\n:root {\n${declarations(theme.tokens.dark)}\n}\n}`,
  ].join('\n')
}

/** Applique le thème au document et indique les préférences d'animation. */
export function applyTheme(theme: Theme, animationsEnabled: boolean, doc: Document = document): void {
  let style = doc.getElementById(STYLE_ELEMENT_ID)
  if (!style) {
    style = doc.createElement('style')
    style.id = STYLE_ELEMENT_ID
    doc.head.append(style)
  }
  style.textContent = themeStyleSheet(theme)
  doc.documentElement.dataset.theme = theme.id
  doc.documentElement.dataset.motion = animationsEnabled ? 'full' : 'reduced'
}
