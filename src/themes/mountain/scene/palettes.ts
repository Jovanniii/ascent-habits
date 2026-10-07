/**
 * Palettes de la scène selon le moment de la journée (Doc 07, sections 3 et 8) :
 * matin pêche, jour clair, soir violet, nuit étoilée.
 *
 * Fonctions pures : le moment est choisi par src/themes/ambiance.ts, la palette
 * ici. La scène les applique en variables CSS, ce qui permet une transition douce
 * d'une palette à l'autre (si les animations sont permises).
 *
 * L'accent rouge orangé reste réservé à l'alpiniste, à la flamme et au drapeau ;
 * il est toujours posé sur un halo, avec un contraste d'au moins 3:1 (testé).
 */
import type { CSSProperties } from 'react'
import type { DayPeriod } from '../../ambiance.ts'

export interface ScenePalette {
  skyTop: string
  skyBottom: string
  /** Plans de montagnes, du plus lointain au plus proche. */
  far: string
  mid: string
  near: string
  snow: string
  /** Halo clair sous les éléments porteurs de sens (alpiniste, flamme, drapeau). */
  halo: string
  accent: string
  /** Mâts et petits traits sombres. */
  ink: string
  cloud: string
  star: string
  /** Opacité des nuages (0 à 1). */
  cloudOpacity: number
  /** Opacité des étoiles (0 la journée). */
  starOpacity: number
}

/** Couleurs de référence du Doc 07, partagées par toutes les ambiances. */
const ACCENT = '#e8573c'
const SNOW = '#f7f4ef'
const INK = '#1f2a4d'

export const SCENE_PALETTES: Readonly<Record<DayPeriod, ScenePalette>> = {
  morning: {
    skyTop: '#ffd9b0',
    skyBottom: '#fff3e6',
    far: '#a8b8d8',
    mid: '#8fa3c6',
    near: '#4f6d8f',
    snow: SNOW,
    halo: SNOW,
    accent: ACCENT,
    ink: INK,
    cloud: '#fffaf4',
    star: '#fff6d8',
    cloudOpacity: 0.9,
    starOpacity: 0,
  },
  day: {
    skyTop: '#bcd4ee',
    skyBottom: '#eef3f8',
    far: '#a8b8d8',
    mid: '#8fa3c6',
    near: '#4f6d8f',
    snow: SNOW,
    halo: SNOW,
    accent: ACCENT,
    ink: INK,
    cloud: '#ffffff',
    star: '#fff6d8',
    cloudOpacity: 0.95,
    starOpacity: 0,
  },
  evening: {
    skyTop: '#6c5b9e',
    skyBottom: '#f2b8a2',
    far: '#9d8fbf',
    mid: '#7a6fa6',
    near: '#4b4a7d',
    snow: '#f6ece8',
    halo: SNOW,
    accent: ACCENT,
    ink: INK,
    cloud: '#f9d4c4',
    star: '#fff6d8',
    cloudOpacity: 0.75,
    starOpacity: 0.35,
  },
  night: {
    skyTop: '#1f2a4d',
    skyBottom: '#3a3f73',
    far: '#3e4f7a',
    mid: '#485e8a',
    near: '#5d7ba0',
    snow: '#e9edf5',
    halo: SNOW,
    accent: ACCENT,
    ink: INK,
    cloud: '#5a6796',
    star: '#fff6d8',
    cloudOpacity: 0.5,
    starOpacity: 1,
  },
}

/** Palette de la scène pour un moment de la journée. */
export function paletteFor(period: DayPeriod): ScenePalette {
  return SCENE_PALETTES[period]
}

/** Variante de lumière des illustrations (Doc 07, section 9 : jour, soir, nuit). */
export type SceneLight = 'day' | 'evening' | 'night'

/** Le matin réutilise les illustrations de jour : seul le ciel change. */
export function lightFor(period: DayPeriod): SceneLight {
  return period === 'morning' ? 'day' : period
}

/** Variables CSS de la palette, posées sur la racine de la scène. */
export function paletteStyle(palette: ScenePalette): CSSProperties {
  return {
    '--mountain-sky-top': palette.skyTop,
    '--mountain-sky-bottom': palette.skyBottom,
    '--mountain-far': palette.far,
    '--mountain-mid': palette.mid,
    '--mountain-near': palette.near,
    '--mountain-snow': palette.snow,
    '--mountain-halo': palette.halo,
    '--mountain-accent': palette.accent,
    '--mountain-ink': palette.ink,
    '--mountain-cloud': palette.cloud,
    '--mountain-star': palette.star,
    '--mountain-cloud-opacity': String(palette.cloudOpacity),
    '--mountain-star-opacity': String(palette.starOpacity),
  } as CSSProperties
}
