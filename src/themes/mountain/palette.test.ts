import { describe, expect, it } from 'vitest'
import type { DayPeriod } from '../ambiance.ts'
import { contrast } from '../testing/contrast.ts'
import css from './mountain.css?raw'
import { SCENE_PALETTES, lightFor, paletteFor, paletteStyle } from './scene/palettes.ts'

const PERIODS: DayPeriod[] = ['morning', 'day', 'evening', 'night']

describe('palettes de la scène (Doc 07)', () => {
  it('reprend les couleurs de référence', () => {
    expect(paletteFor('morning')).toMatchObject({ skyTop: '#ffd9b0', far: '#a8b8d8', near: '#4f6d8f', snow: '#f7f4ef' })
    expect(paletteFor('evening').skyTop).toBe('#6c5b9e')
    expect(paletteFor('night').skyTop).toBe('#1f2a4d')
    for (const period of PERIODS) expect(paletteFor(period).accent).toBe('#e8573c')
  })

  it('choisit une palette par moment de la journée', () => {
    expect(Object.keys(SCENE_PALETTES).sort()).toEqual([...PERIODS].sort())
    expect(new Set(PERIODS.map((period) => paletteFor(period).skyTop)).size).toBe(4)
    // Étoiles seulement le soir (discrètes) et la nuit.
    expect(paletteFor('day').starOpacity).toBe(0)
    expect(paletteFor('morning').starOpacity).toBe(0)
    expect(paletteFor('night').starOpacity).toBe(1)
  })

  it('associe chaque moment à une variante de lumière des illustrations', () => {
    expect(PERIODS.map(lightFor)).toEqual(['day', 'day', 'evening', 'night'])
  })

  it('expose la palette en variables CSS', () => {
    const style = paletteStyle(paletteFor('night')) as Record<string, string>
    expect(style['--mountain-sky-top']).toBe('#1f2a4d')
    expect(style['--mountain-star-opacity']).toBe('1')
    // Chaque variable utilisée par la feuille de style est fournie par la palette.
    for (const [, name] of css.matchAll(/var\((--mountain-[a-z-]+)/g)) {
      if (name === '--mountain-breath-delay') continue
      expect(style, name).toHaveProperty(name!)
    }
  })

  it.each(PERIODS)('garantit des contrastes AA pour les éléments porteurs de sens (%s)', (period) => {
    const p = paletteFor(period)
    // Alpiniste, flamme et drapeau du sommet : accent posé sur un halo (non textuel, 3:1).
    expect(contrast(p.accent, p.halo)).toBeGreaterThanOrEqual(3)
    // Camps (tentes couleur neige) et sentier sur la montagne proche.
    expect(contrast(p.snow, p.near)).toBeGreaterThanOrEqual(3)
    // Noms des habitudes sur leur plaque, dans le panorama (texte, 4.5:1).
    expect(contrast(p.ink, p.halo)).toBeGreaterThanOrEqual(4.5)
    // Mâts sombres sur la neige.
    expect(contrast(p.ink, p.snow)).toBeGreaterThanOrEqual(3)
  })
})

describe('palette du calendrier', () => {
  const section = css.slice(css.indexOf('Calendrier « carnet de randonnée »'))
  const read = (part: string): Record<string, string> =>
    Object.fromEntries([...part.matchAll(/(--trail-day-[a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]))
  const [lightPart, darkPart = ''] = section.split('@media (prefers-color-scheme: dark)')
  const modes: Record<'light' | 'dark', Record<string, string>> = { light: { ...read(lightPart!), surface: '#ffffff' }, dark: { ...read(darkPart), surface: '#27335a' } }

  it.each(['light', 'dark'] as const)('garantit des contrastes d’au moins 3:1 pour les symboles des jours (%s)', (mode) => {
    const p = modes[mode]
    expect(Object.keys(p)).toHaveLength(5)
    // Tampon (empreinte, corde, sac) : encre sur halo, et contour du tampon sur la case.
    expect(contrast(p['--trail-day-ink']!, p['--trail-day-halo']!)).toBeGreaterThanOrEqual(3)
    expect(contrast(p['--trail-day-ink']!, p.surface!)).toBeGreaterThanOrEqual(3)
    expect(contrast(p['--trail-day-ink']!, p['--trail-day-ridge']!)).toBeGreaterThanOrEqual(3)
    // Tente, lune et cercle en attente : symboles neutres, mais lisibles.
    expect(contrast(p['--trail-day-muted']!, p.surface!)).toBeGreaterThanOrEqual(3)
    expect(contrast(p['--trail-day-muted']!, p['--trail-day-ridge']!)).toBeGreaterThanOrEqual(3)
  })
})

describe('animations de la scène', () => {
  const marker = '@media (prefers-reduced-motion: no-preference)'

  it('ne déclare aucune animation ni transition hors du bloc « opt-in »', () => {
    expect(css).toContain(marker)
    const outside = css.slice(0, css.indexOf(marker))
    expect(outside).not.toMatch(/\b(animation|transition)\s*:/)
    const inside = css.slice(css.indexOf(marker))
    for (const rule of inside.match(/[^{}]+\{[^{}]*\b(animation|transition)\s*:[^}]*\}/g) ?? []) {
      expect(rule).toContain(":root[data-motion='full'] .mountain-scene[data-motion='on']")
    }
  })

  it('n’anime que transform et opacity (aucun recalcul de mise en page)', () => {
    const keyframes = [...css.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)]
    expect(keyframes.length).toBeGreaterThanOrEqual(6)
    for (const [, body] of keyframes) {
      for (const [, property] of body!.matchAll(/([a-z-]+)\s*:/g)) {
        expect(['transform', 'opacity']).toContain(property)
      }
    }
    // Les transitions ne touchent que la position (transform), l'opacité et les couleurs.
    for (const [, value] of css.matchAll(/transition:\s*([^;]+);/g)) {
      expect(value).toMatch(/^(transform|opacity|fill|stop-color)\s/)
    }
  })

  it('applique le parallaxe seulement dans le bloc « opt-in »', () => {
    const outside = css.slice(0, css.indexOf(marker))
    expect(outside).not.toContain('--panorama-scroll')
    expect(css.slice(css.indexOf(marker))).toContain('--panorama-scroll')
  })
})
