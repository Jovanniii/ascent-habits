// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { applyTheme, themeStyleSheet } from './applyTheme.ts'
import { plainTheme } from './plain/index.ts'
import { DEFAULT_THEME_ID, THEMES, getTheme } from './registry.ts'

/** Rapport de contraste WCAG entre deux couleurs #rrggbb. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('registre des thèmes', () => {
  it('fournit le thème sobre par défaut', () => {
    expect(DEFAULT_THEME_ID).toBe('plain')
    expect(getTheme('plain')).toBe(plainTheme)
  })

  it('retombe sur le thème par défaut pour un identifiant inconnu', () => {
    expect(getTheme('inconnu')).toBe(plainTheme)
  })

  it('déclare les mêmes jetons pour tous les thèmes et modes', () => {
    const reference = Object.keys(plainTheme.tokens.light).sort()
    for (const theme of THEMES) {
      expect(Object.keys(theme.tokens.light).sort()).toEqual(reference)
      expect(Object.keys(theme.tokens.dark).sort()).toEqual(reference)
    }
  })
})

describe('contrastes du thème sobre (WCAG AA)', () => {
  it.each(['light', 'dark'] as const)('mode %s', (mode) => {
    const t = plainTheme.tokens[mode]
    expect(contrast(t['--color-text']!, t['--color-bg']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-text']!, t['--color-surface']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-text-muted']!, t['--color-surface']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-text-muted']!, t['--color-surface-muted']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-on-primary']!, t['--color-primary']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-on-done']!, t['--color-done']!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--color-border']!, t['--color-surface']!)).toBeGreaterThanOrEqual(1.4)
    expect(contrast(t['--color-focus']!, t['--color-surface']!)).toBeGreaterThanOrEqual(3)
  })
})

describe('applyTheme', () => {
  it('injecte les jetons et les préférences dans le document', () => {
    applyTheme(plainTheme, false)
    const style = document.getElementById('ascent-theme')
    expect(style?.textContent).toBe(themeStyleSheet(plainTheme))
    expect(style?.textContent).toContain('--color-bg: #f6f7f9;')
    expect(style?.textContent).toContain('prefers-color-scheme: dark')
    expect(document.documentElement.dataset).toMatchObject({ theme: 'plain', motion: 'reduced' })

    applyTheme(plainTheme, true)
    expect(document.querySelectorAll('#ascent-theme')).toHaveLength(1)
    expect(document.documentElement.dataset.motion).toBe('full')
  })
})
