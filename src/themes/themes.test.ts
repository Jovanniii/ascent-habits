// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { applyTheme, themeStyleSheet } from './applyTheme.ts'
import { theme as plainTheme } from './plain/theme.ts'
import { DEFAULT_THEME, DEFAULT_THEME_ID, THEMES, getTheme } from './registry.ts'
import { contrast } from './testing/contrast.ts'


describe('registre des thèmes', () => {
  it('découvre au moins deux thèmes aux identifiants uniques', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(2)
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length)
    expect(THEMES).toContain(plainTheme)
  })

  it('a exactement un thème par défaut, déclaré par le thème lui-même', () => {
    const defaults = THEMES.filter((theme) => theme.isDefault)
    expect(defaults).toHaveLength(1)
    expect(DEFAULT_THEME).toBe(defaults[0])
    expect(DEFAULT_THEME_ID).toBe(defaults[0]?.id)
  })

  it('trouve un thème par son identifiant, et retombe sur le thème par défaut sinon', () => {
    expect(getTheme('plain')).toBe(plainTheme)
    expect(getTheme('inconnu')).toBe(DEFAULT_THEME)
  })

  it('déclare les mêmes jetons d’interface pour tous les thèmes et modes', () => {
    const reference = Object.keys(plainTheme.tokens.light).sort()
    for (const theme of THEMES) {
      expect(Object.keys(theme.tokens.light).sort()).toEqual(reference)
      expect(Object.keys(theme.tokens.dark).sort()).toEqual(reference)
    }
  })
})

describe('contrastes des jetons d’interface (WCAG AA)', () => {
  const cases = THEMES.flatMap((theme) => (['light', 'dark'] as const).map((mode) => [theme.name, mode, theme] as const))

  it.each(cases)('%s, mode %s', (_name, mode, theme) => {
    const t = theme.tokens[mode]
    expect(contrast(t['--color-text']!, t['--color-bg']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-text']!, t['--color-surface']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-text-muted']!, t['--color-surface']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-text-muted']!, t['--color-surface-muted']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-text-muted']!, t['--color-bg']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-on-primary']!, t['--color-primary']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-on-done']!, t['--color-done']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-done']!, t['--color-surface']!)).toBeGreaterThanOrEqual(3)
    expect(contrast(t['--color-border']!, t['--color-surface']!)).toBeGreaterThanOrEqual(1.4)
    expect(contrast(t['--color-focus']!, t['--color-surface']!)).toBeGreaterThanOrEqual(3)
    expect(contrast(t['--color-focus']!, t['--color-bg']!)).toBeGreaterThanOrEqual(3)
  })
})

describe('applyTheme', () => {
  it('injecte les jetons, les préférences et la couleur de barre d’état', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#000000'
    document.head.append(meta)

    applyTheme(plainTheme, false)
    const style = document.getElementById('ascent-theme')
    expect(style?.textContent).toBe(themeStyleSheet(plainTheme))
    expect(style?.textContent).toContain('--color-bg: #f6f7f9;')
    expect(style?.textContent).toContain('prefers-color-scheme: dark')
    expect(document.documentElement.dataset).toMatchObject({ theme: 'plain', motion: 'reduced' })
    expect(meta.content).toBe(plainTheme.tokens.light['--color-primary'])

    for (const theme of THEMES) {
      applyTheme(theme, true)
      expect(document.documentElement.dataset.theme).toBe(theme.id)
    }
    expect(document.querySelectorAll('#ascent-theme')).toHaveLength(1)
    expect(document.documentElement.dataset.motion).toBe('full')
  })
})
