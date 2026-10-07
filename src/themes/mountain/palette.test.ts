import { describe, expect, it } from 'vitest'
import { contrast } from '../testing/contrast.ts'
import css from './mountain.css?raw'

/** Variables de couleur de la scène, en clair et en sombre (le sombre surcharge le clair). */
function palettes(): { light: Record<string, string>; dark: Record<string, string> } {
  const [lightPart, darkPart = ''] = css.split('@media (prefers-color-scheme: dark)')
  const read = (part: string) =>
    Object.fromEntries([...part.matchAll(/(--mountain-[a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]))
  const light = read(lightPart!)
  return { light, dark: { ...light, ...read(darkPart.split('}')[0] ?? '') } }
}

describe('palette de la scène (Doc 07)', () => {
  it('reprend les couleurs de référence', () => {
    const { light } = palettes()
    expect(light).toMatchObject({
      '--mountain-sky-top': '#ffd9b0',
      '--mountain-far': '#a8b8d8',
      '--mountain-near': '#4f6d8f',
      '--mountain-snow': '#f7f4ef',
      '--mountain-accent': '#e8573c',
    })
    expect(palettes().dark['--mountain-sky-top']).toBe('#1f2a4d')
  })

  it.each(['light', 'dark'] as const)('garantit des contrastes d’au moins 3:1 pour les éléments porteurs de sens (%s)', (mode) => {
    const p = palettes()[mode]
    // Alpiniste, flamme et drapeau du sommet : accent posé sur un halo.
    expect(contrast(p['--mountain-accent']!, p['--mountain-halo']!)).toBeGreaterThanOrEqual(3)
    // Camps (tentes couleur neige) sur la montagne proche.
    expect(contrast(p['--mountain-snow']!, p['--mountain-near']!)).toBeGreaterThanOrEqual(3)
  })
})

describe('palette du calendrier', () => {
  const section = css.slice(css.indexOf('Calendrier « carnet de randonnée »'))
  const read = (part: string): Record<string, string> =>
    Object.fromEntries([...part.matchAll(/(--mountain-day-[a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]))
  const [lightPart, darkPart = ''] = section.split('@media (prefers-color-scheme: dark)')
  const modes: Record<'light' | 'dark', Record<string, string>> = { light: { ...read(lightPart!), surface: '#ffffff' }, dark: { ...read(darkPart), surface: '#27335a' } }

  it.each(['light', 'dark'] as const)('garantit des contrastes d’au moins 3:1 pour les symboles des jours (%s)', (mode) => {
    const p = modes[mode]
    expect(Object.keys(p)).toHaveLength(5)
    // Tampon (empreinte, corde, sac) : encre sur halo, et contour du tampon sur la case.
    expect(contrast(p['--mountain-day-ink']!, p['--mountain-day-halo']!)).toBeGreaterThanOrEqual(3)
    expect(contrast(p['--mountain-day-ink']!, p.surface!)).toBeGreaterThanOrEqual(3)
    expect(contrast(p['--mountain-day-ink']!, p['--mountain-day-ridge']!)).toBeGreaterThanOrEqual(3)
    // Tente, lune et cercle en attente : symboles neutres, mais lisibles.
    expect(contrast(p['--mountain-day-muted']!, p.surface!)).toBeGreaterThanOrEqual(3)
    expect(contrast(p['--mountain-day-muted']!, p['--mountain-day-ridge']!)).toBeGreaterThanOrEqual(3)
  })
})

describe('animations de la scène', () => {
  it('ne déclare aucune animation ni transition hors du bloc « opt-in »', () => {
    const marker = '@media (prefers-reduced-motion: no-preference)'
    expect(css).toContain(marker)
    const outside = css.slice(0, css.indexOf(marker))
    expect(outside).not.toMatch(/\b(animation|transition)\s*:/)
    const inside = css.slice(css.indexOf(marker))
    for (const rule of inside.match(/[^{}]+\{[^{}]*\b(animation|transition)\s*:[^}]*\}/g) ?? []) {
      expect(rule).toContain(":root[data-motion='full'] .mountain-scene[data-motion='on']")
    }
  })
})
