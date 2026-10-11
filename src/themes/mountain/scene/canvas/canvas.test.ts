import { describe, expect, it } from 'vitest'
import { computeHabitProgress, type ProgressInput } from '../../../progress.ts'
import type { SceneGoal, SceneHabit } from '../../../types.ts'
import { FAR_RANGES, PEAK_U, createLayout, farRangeAt, ridgeShape } from './layout.ts'
import { fbm, hash, ridged, seededRandom, valueNoise } from './noise.ts'
import { buildRoute, buildRoutes, pointOnRoute, routeStartU } from './routes.ts'
import { SKY_KEYS, SUNRISE_HOUR, SUNSET_HOUR, hexToRgb, hourOf, mixRgb, normalizeHour, rgba, skyAt, tintFor } from './sky.ts'
import { TRACK_COLORS, buildTracks, goalTrack, habitTrack, shortLabel, stageLabel } from './tracks.ts'

function habit(id: string, input: Partial<ProgressInput> = {}, paused = false): SceneHabit {
  const current = input.currentDurationDays ?? 0
  return {
    id,
    label: `Habitude ${id}`,
    paused,
    progress: computeHabitProgress({
      currentDurationDays: current,
      bestDurationDays: current,
      previousBestDurationDays: 0,
      bestDurationBeforeToday: current,
      today: 'pending',
      lastScheduledDay: 'validated',
      ...input,
    }),
  }
}

function goal(id: string, done: number, total: number, achieved = false): SceneGoal {
  return {
    id,
    label: `Objectif ${id}`,
    achieved,
    progress: { done, total, ratio: total ? done / total : 0, percent: total ? Math.floor((done * 100) / total) : 0, allDone: total > 0 && done === total },
  }
}

describe('bruit', () => {
  it('est déterministe et borné entre 0 et 1', () => {
    for (let x = -5; x < 5; x += 0.37) {
      for (const value of [hash(Math.floor(x), 3), valueNoise(x, 3), fbm(x, 3), ridged(x, 3)]) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
      expect(fbm(x, 9)).toBe(fbm(x, 9))
    }
    const a = seededRandom(4)
    const b = seededRandom(4)
    const values = Array.from({ length: 20 }, () => a())
    expect(values).toEqual(Array.from({ length: 20 }, () => b()))
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
  })
})

describe('lumière selon l’heure (dégradé continu)', () => {
  it('couvre toute la journée, de minuit à minuit', () => {
    expect(SKY_KEYS[0]!.hour).toBe(0)
    expect(SKY_KEYS.at(-1)!.hour).toBe(24)
    expect(SKY_KEYS[0]!.top).toBe(SKY_KEYS.at(-1)!.top)
  })

  it('passe d’une couleur à l’autre sans saut', () => {
    for (let hour = 0; hour < 24; hour += 0.05) {
      const a = skyAt(hour)
      const b = skyAt(hour + 0.05)
      const jump = Math.max(...[0, 1, 2].map((i) => Math.abs(a.top[i]! - b.top[i]!)))
      expect(jump).toBeLessThan(6)
    }
  })

  it('montre le soleil le jour, la lune et les étoiles la nuit', () => {
    expect(skyAt(13).sun.visible).toBeGreaterThan(0.9)
    expect(skyAt(13).stars).toBe(0)
    expect(skyAt(23).sun.visible).toBe(0)
    expect(skyAt(23).stars).toBeGreaterThan(0.6)
    expect(skyAt(1).moon.visible).toBeGreaterThan(0.5)
    expect(skyAt(SUNRISE_HOUR - 0.01).sun.visible).toBe(0)
    expect(skyAt(SUNRISE_HOUR).sun.visible).toBeCloseTo(0)
    expect(skyAt(SUNSET_HOUR - 0.5).sun.x).toBeGreaterThan(0.8)
    // Heure dorée : la lumière est la plus chaude et la plus forte.
    expect(skyAt(16.3).lightAmount).toBeGreaterThan(skyAt(12).lightAmount)
  })

  it('ramène les heures hors bornes dans la journée', () => {
    expect(normalizeHour(25)).toBe(1)
    expect(normalizeHour(-1)).toBe(23)
    expect(normalizeHour(Number.NaN)).toBe(12)
    expect(skyAt(24 + 13).top).toEqual(skyAt(13).top)
    expect(hourOf(new Date(2026, 9, 11, 16, 30))).toBe(16.5)
  })

  it('teinte les objets selon la lumière', () => {
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0])
    expect(mixRgb([0, 0, 0], [100, 200, 50], 0.5)).toEqual([50, 100, 25])
    expect(rgba([10.4, 20.6, 30], 0.5)).toBe('rgba(10,21,30,0.5)')
    const snow = hexToRgb('#f6f1e6')
    const atNight = tintFor(snow, skyAt(23))
    const atNoon = tintFor(snow, skyAt(13))
    expect(atNight[0]).toBeLessThan(atNoon[0])
  })
})

describe('géométrie de la scène', () => {
  it('dessine une grande montagne dont le sommet est le point le plus haut', () => {
    expect(ridgeShape(PEAK_U)).toBe(1)
    expect(ridgeShape(0)).toBe(0)
    expect(ridgeShape(1)).toBeCloseTo(0.34)
    const layout = createLayout(400, 600)
    for (let x = 0; x <= 400; x += 10) expect(layout.ridgeY(x)).toBeGreaterThanOrEqual(layout.peak.y - 8)
    expect(layout.groundY(200)).toBeGreaterThan(layout.ridgeY(200))
    expect(layout.pathY(200)).toBeGreaterThan(layout.groundY(200))
  })

  it('garde le même nombre de crêtes lointaines quelle que soit la largeur', () => {
    const range = FAR_RANGES[0]!
    expect(farRangeAt(range, 100, 0, 400, 600).crest).toBeCloseTo(farRangeAt(range, 200, 0, 800, 600).crest)
    const { y } = farRangeAt(range, 50, 120, 400, 600)
    expect(y).toBeLessThanOrEqual(600 * range.base)
    expect(y).toBeGreaterThanOrEqual(600 * (range.base - range.amplitude))
  })

  it('accepte un cadre vide sans erreur', () => {
    const layout = createLayout(0, 0)
    expect(layout.width).toBe(1)
    expect(Number.isFinite(layout.peak.y)).toBe(true)
  })
})

describe('voies d’ascension', () => {
  const layout = createLayout(390, 560)

  it.each([0, 1, 3, 12, 40])('crée exactement %i voies, sans limite', (count) => {
    const routes = buildRoutes(count, layout)
    expect(routes).toHaveLength(count)
    for (const route of routes) {
      const start = route.points[0]!
      const end = route.points.at(-1)!
      // Départ au pied, arrivée au sommet commun.
      expect(start.y).toBeGreaterThan(layout.height * 0.7)
      expect(end.x).toBeCloseTo(layout.peak.x, 0)
      expect(Math.abs(end.y - layout.peak.y)).toBeLessThan(4)
      // Toujours sur la face de la montagne, jamais dans le ciel.
      for (const point of route.points) expect(point.y).toBeGreaterThanOrEqual(layout.ridgeY(point.x) - 0.01)
      expect(route.lengths.at(-1)).toBeGreaterThan(0)
    }
  })

  it('répartit les départs de gauche à droite', () => {
    expect(routeStartU(0, 1)).toBe(0.3)
    expect(routeStartU(0, 5)).toBeCloseTo(0.08)
    expect(routeStartU(4, 5)).toBeCloseTo(0.94)
    const starts = buildRoutes(6, layout).map((route) => route.points[0]!.x)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  it('place un point le long d’une voie, avec le sens de la marche', () => {
    const route = buildRoute(0, 3, layout)
    expect(pointOnRoute(route, 0)).toMatchObject({ x: route.points[0]!.x, y: route.points[0]!.y })
    const end = pointOnRoute(route, 1)
    expect(end.x).toBeCloseTo(route.points.at(-1)!.x)
    expect(pointOnRoute(route, 2)).toEqual(end)
    expect(pointOnRoute(route, Number.NaN)).toEqual(pointOnRoute(route, 0))
    expect([1, -1]).toContain(pointOnRoute(route, 0.4).direction)
    const single = { points: [{ x: 5, y: 6 }], lengths: [0] }
    expect(pointOnRoute(single, 0.5)).toMatchObject({ x: 5, y: 6 })
  })
})

describe('cordées', () => {
  it('place l’alpiniste d’une habitude selon sa progression, avec ses paliers', () => {
    const track = habitTrack(habit('a', { currentDurationDays: 25, today: 'done' }), 0)
    expect(track).toMatchObject({ id: 'a', kind: 'habit', label: 'Habitude a', color: TRACK_COLORS[0], resting: false })
    expect(track.target).toBeGreaterThan(0)
    expect(track.marks.map((mark) => mark.label)).toEqual(['21 j', '2 mois', '6 mois'])
    expect(track.marks[0]!.reached).toBe(true)
  })

  it('fait reposer l’alpiniste d’une habitude en pause ou d’un jour manqué', () => {
    expect(habitTrack(habit('a', {}, true), 0).resting).toBe(true)
    expect(habitTrack(habit('b', { lastScheduledDay: 'missed' }), 0).resting).toBe(true)
  })

  it('célèbre un palier atteint aujourd’hui', () => {
    const track = habitTrack(habit('a', { currentDurationDays: 21, bestDurationDays: 21, bestDurationBeforeToday: 20, today: 'done' }), 0)
    expect(track.celebrating).toBe(true)
  })

  it('n’éloigne jamais l’alpiniste d’un objectif quand on ajoute un jalon (P4-D2)', () => {
    const before = goalTrack(goal('g', 2, 4), 0)
    const after = goalTrack(goal('g', 2, 6), 0)
    expect(after.target).toBe(before.target)
    expect(after.marks).toHaveLength(6)
    expect(after.marks.filter((mark) => mark.reached)).toHaveLength(2)
    expect(after.marks[0]!.label).toBe('Jalon 1')
    expect(goalTrack(goal('g', 4, 4, true), 0).target).toBe(1)
  })

  it('met les habitudes puis les objectifs, et réutilise les couleurs au-delà de la palette', () => {
    const habits = Array.from({ length: TRACK_COLORS.length + 1 }, (_, i) => habit(`h${i}`))
    const tracks = buildTracks(habits, [goal('g', 0, 3)])
    expect(tracks.map((track) => track.kind).slice(-2)).toEqual(['habit', 'goal'])
    expect(tracks[TRACK_COLORS.length]!.color).toBe(TRACK_COLORS[0])
  })

  it('écrit les paliers et les noms en court', () => {
    expect(stageLabel({ tierId: 'months6', days: 180 })).toBe('6 mois')
    expect(stageLabel({ tierId: null, days: 730 })).toBe('2 ans')
    expect(stageLabel({ tierId: null, days: 400 })).toBe('400 j')
    expect(shortLabel('  Lire  ')).toBe('Lire')
    expect(shortLabel('Courir un semi-marathon')).toBe('Courir un sem…')
  })
})
