/**
 * Lumière de la scène « Cordée » selon l'heure, en dégradé continu (Doc 08,
 * décision DA-D4) : nuit étoilée, aube, plein jour, heure dorée, coucher de
 * soleil, heure bleue. Fonctions pures, testées.
 *
 * L'heure est un nombre décimal entre 0 et 24 (16,5 = 16 h 30). Chaque couleur
 * est interpolée entre deux moments clés, avec un lissage pour éviter les
 * changements brusques.
 */

export type Rgb = readonly [number, number, number]

interface SkyKey {
  /** Heure du moment clé. */
  hour: number
  top: string
  mid: string
  bottom: string
  /** Couleur de la lumière (soleil ou lune) posée sur le décor. */
  light: string
  /** Quantité de lumière posée sur les arêtes et les faces éclairées (0 à 1). */
  lightAmount: number
  /** Couleur la plus sombre du décor, vers laquelle tendent les ombres. */
  ink: string
  /** Visibilité des étoiles (0 à 1). */
  stars: number
}

/** Moments clés de la journée, de minuit à minuit (prototype docs/prototypes/cordee-scene.html). */
export const SKY_KEYS: readonly SkyKey[] = [
  { hour: 0, top: '#0b1430', mid: '#1c2b57', bottom: '#41497a', light: '#9fb3e8', lightAmount: 0.25, ink: '#0e1428', stars: 1 },
  { hour: 5.28, top: '#18234f', mid: '#4a4a7e', bottom: '#a77a95', light: '#c9a8d8', lightAmount: 0.3, ink: '#1d1a35', stars: 0.5 },
  { hour: 6.72, top: '#3b5491', mid: '#d88e8e', bottom: '#fcc39a', light: '#ffcfa6', lightAmount: 0.6, ink: '#3a2c4c', stars: 0.05 },
  { hour: 9.6, top: '#4a86c8', mid: '#9ccbe9', bottom: '#f6e7cf', light: '#fff4dc', lightAmount: 0.7, ink: '#3b4a5e', stars: 0 },
  { hour: 13.2, top: '#3b7bc6', mid: '#8cc3ea', bottom: '#eef2e8', light: '#ffffff', lightAmount: 0.65, ink: '#3a4d5e', stars: 0 },
  { hour: 16.32, top: '#5876b8', mid: '#f2ad73', bottom: '#ffdca0', light: '#ffc07a', lightAmount: 0.9, ink: '#4b3048', stars: 0 },
  { hour: 18.24, top: '#34357a', mid: '#c9617a', bottom: '#f7925f', light: '#ff9a68', lightAmount: 0.85, ink: '#2f2040', stars: 0.15 },
  { hour: 20.16, top: '#161f4b', mid: '#433f7d', bottom: '#9a6c8c', light: '#a99bd8', lightAmount: 0.4, ink: '#191a38', stars: 0.6 },
  { hour: 24, top: '#0b1430', mid: '#1c2b57', bottom: '#41497a', light: '#9fb3e8', lightAmount: 0.25, ink: '#0e1428', stars: 1 },
]

/** Lever et coucher du soleil (heures décimales). */
export const SUNRISE_HOUR = 6.24
export const SUNSET_HOUR = 19.2

export interface Orb {
  /** Visibilité, 0 sous l'horizon, 1 au plus haut. */
  visible: number
  /** Position horizontale, de 0 (gauche) à 1 (droite). */
  x: number
  /** Hauteur au-dessus de l'horizon, de 0 à 1. */
  height: number
}

export interface SkyState {
  hour: number
  top: Rgb
  mid: Rgb
  bottom: Rgb
  light: Rgb
  ink: Rgb
  lightAmount: number
  stars: number
  sun: Orb
  moon: Orb
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function hexToRgb(hex: string): Rgb {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export function rgba(color: Rgb, alpha = 1): string {
  return `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${alpha})`
}

/** Ramène une heure quelconque dans [0, 24). Une valeur invalide vaut midi. */
export function normalizeHour(hour: number): number {
  if (!Number.isFinite(hour)) return 12
  return ((hour % 24) + 24) % 24
}

/** Heure décimale locale d'une date (16 h 30 → 16,5). */
export function hourOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
}

function orbAt(hour: number): Orb {
  const progress = (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)
  const bounded = clamp(progress, 0, 1)
  return {
    visible: progress > 0 && progress < 1 ? Math.sin(Math.PI * progress) : 0,
    x: 0.08 + 0.84 * bounded,
    height: Math.sin(Math.PI * bounded),
  }
}

/** Lumière et couleurs de la scène à une heure donnée. */
export function skyAt(rawHour: number): SkyState {
  const hour = normalizeHour(rawHour)
  let index = 0
  while (index < SKY_KEYS.length - 2 && hour >= SKY_KEYS[index + 1]!.hour) index++
  const a = SKY_KEYS[index]!
  const b = SKY_KEYS[index + 1]!
  const u = (hour - a.hour) / (b.hour - a.hour)
  const e = u * u * (3 - 2 * u)
  const mixKey = (key: 'top' | 'mid' | 'bottom' | 'light' | 'ink') => mixRgb(hexToRgb(a[key]), hexToRgb(b[key]), e)
  return {
    hour,
    top: mixKey('top'),
    mid: mixKey('mid'),
    bottom: mixKey('bottom'),
    light: mixKey('light'),
    ink: mixKey('ink'),
    lightAmount: a.lightAmount + (b.lightAmount - a.lightAmount) * e,
    stars: a.stars + (b.stars - a.stars) * e,
    sun: orbAt(hour),
    // La lune suit le même arc, douze heures plus tard.
    moon: orbAt(normalizeHour(hour + 12)),
  }
}

/**
 * Teinte d'un objet posé dans la scène : il s'assombrit la nuit et prend la
 * couleur de la lumière (orangé au coucher du soleil, bleuté la nuit).
 * `strength` règle l'assombrissement (0,5 pour la neige et la peau).
 */
export function tintFor(base: Rgb, sky: SkyState, strength = 1): Rgb {
  return mixRgb(mixRgb(base, sky.ink, (0.2 + 0.5 * sky.stars) * strength), sky.light, 0.2 * sky.lightAmount)
}

