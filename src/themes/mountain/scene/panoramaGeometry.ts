/**
 * Géométrie de la vue panorama : toutes les montagnes côte à côte, chacune avec
 * son sentier et son alpiniste, devant des plans lointains (parallaxe léger).
 *
 * Repère : 120 unités de haut. Chaque montagne occupe une tuile de 100 unités de
 * large ; les tuiles se chevauchent un peu pour former une chaîne continue.
 * Fonctions pures, testées.
 */
import { HEIGHT_VARIANTS, type Point } from '../geometry.ts'

export const PANORAMA_HEIGHT = 120
export const TILE_WIDTH = 100
/** Écart entre deux montagnes voisines (inférieur à la largeur : chevauchement). */
export const TILE_STEP = 84
/** Marge de chaque côté de la chaîne. */
export const ROW_PADDING = 12

/** Largeur des plans lointains (unités), identique à celle des assets de plans. */
export const BACKDROP_WIDTH = 1280

/** Nuages : position et taille dans le repère de la scène. */
export interface CloudSpec {
  x: number
  y: number
  scale: number
}

/** Étoiles : seules quelques-unes scintillent, chacune à son rythme. */
export interface StarSpec {
  x: number
  y: number
  r: number
  twinkle: boolean
}

/** Largeur totale de la rangée de montagnes. */
export function rowWidth(count: number): number {
  const n = Math.max(1, Math.floor(count))
  return ROW_PADDING * 2 + TILE_STEP * (n - 1) + TILE_WIDTH
}

/** Bord gauche de la tuile d'une montagne. */
export function tileX(index: number): number {
  return ROW_PADDING + TILE_STEP * index
}

/** Altitude du sommet (y) selon le cycle, plafonnée comme dans la scène du jour. */
export function tilePeakY(cycle: number): number {
  const level = Math.min(Math.max(1, Math.floor(cycle)), HEIGHT_VARIANTS)
  return [40, 30, 20][level - 1]!
}

/** Centre vertical de la plaque portant le nom, au pied de chaque montagne. */
export const LABEL_Y = PANORAMA_HEIGHT - 5

/** Silhouette arrondie d'une montagne de la rangée. */
export function tileMountainPath(x0: number, cycle: number): string {
  const peak = tilePeakY(cycle)
  const h = PANORAMA_HEIGHT
  return `M${x0} ${h} Q${x0 + 30} ${peak + 18} ${x0 + 50} ${peak} Q${x0 + 72} ${peak + 22} ${x0 + TILE_WIDTH} ${h} Z`
}

/** Calotte de neige autour du sommet. */
export function tileSnowCapPath(x0: number, cycle: number): string {
  const peak = tilePeakY(cycle)
  const c = x0 + 50
  return `M${c - 9} ${peak + 10} Q${c - 4} ${peak + 1} ${c} ${peak} Q${c + 5} ${peak + 2} ${c + 10} ${peak + 11} Q${c + 4} ${peak + 8} ${c + 1} ${peak + 12} Q${c - 4} ${peak + 8} ${c - 9} ${peak + 10} Z`
}

/**
 * Sentier en lacets, du pied au sommet : (écart latéral, fraction de la hauteur).
 * L'écart est proportionnel à la demi-largeur disponible à cette hauteur, ce qui
 * garde le sentier dans la silhouette quelle que soit la hauteur de la montagne.
 */
const TRAIL_SHAPE: readonly (readonly [number, number])[] = [
  [-0.45, 0.12],
  [0.55, 0.28],
  [-0.5, 0.42],
  [0.45, 0.6],
  [-0.35, 0.78],
  [0, 0.98],
]

export function tileTrail(x0: number, cycle: number): Point[] {
  const peak = tilePeakY(cycle)
  const span = PANORAMA_HEIGHT - peak
  const center = x0 + 50
  return TRAIL_SHAPE.map(([dx, t]) => ({
    x: Math.round((center + dx * (1 - t) * 40) * 10) / 10,
    y: Math.round((PANORAMA_HEIGHT - t * span) * 10) / 10,
  }))
}

/**
 * Étoiles réparties de façon déterministe (même ciel à chaque affichage), sans
 * aléatoire : suite à faible discrépance. Une étoile sur `twinkleEvery` scintille.
 */
export function starField(count: number, width: number, height: number, twinkleEvery = 4): StarSpec[] {
  const golden = 0.618033988749895
  const plastic = 0.7548776662466927
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => ({
    x: Math.round(((index * golden) % 1) * width * 10) / 10,
    y: Math.round((((index + 1) * plastic) % 1) * height * 10) / 10,
    r: index % 5 === 0 ? 0.9 : 0.55,
    twinkle: twinkleEvery > 0 && index % twinkleEvery === 0,
  }))
}
