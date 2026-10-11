/**
 * Géométrie de la scène « Cordée » (Doc 08) : chaînes lointaines, grande
 * montagne, plateau du village et sentier. Toutes les mesures sont relatives à
 * la taille du cadre, pour que la scène garde ses proportions sur téléphone,
 * en bandeau comme en plein écran. Fonctions pures, testées.
 */
import { fbm, ridged } from './noise.ts'

export interface Point {
  x: number
  y: number
}

/** Position horizontale du sommet, en fraction de la largeur. */
export const PEAK_U = 0.6
/** Pied de la grande montagne, en fraction de la hauteur (caché par le village). */
export const RIDGE_BASE = 0.8
/** Hauteur de la grande montagne, en fraction de la hauteur. */
export const RIDGE_RISE = 0.56
/** Ligne d'horizon, où le soleil se couche. */
export const HORIZON = 0.56

/** Une chaîne lointaine, qui défile lentement derrière la grande montagne. */
export interface FarRange {
  /** Ligne de base, en fraction de la hauteur. */
  base: number
  /** Hauteur des crêtes, en fraction de la hauteur. */
  amplitude: number
  /** Nombre de crêtes sur la largeur du cadre. */
  ridges: number
  seed: number
  /** Éloignement, de 0 (proche) à 1 (horizon) : la couleur tend vers celle du ciel. */
  depth: number
  /** Vitesse de défilement relative. */
  speed: number
  /** Au-dessus de cette valeur de crête, la montagne est enneigée. */
  snowLine: number
}

export const FAR_RANGES: readonly FarRange[] = [
  { base: 0.5, amplitude: 0.16, ridges: 2.2, seed: 3, depth: 0.86, speed: 0.18, snowLine: 0.52 },
  { base: 0.57, amplitude: 0.14, ridges: 3, seed: 7, depth: 0.68, speed: 0.38, snowLine: 0.58 },
  { base: 0.64, amplitude: 0.1, ridges: 3.8, seed: 11, depth: 0.5, speed: 0.62, snowLine: 0.68 },
]

/**
 * Crête d'une chaîne lointaine en x, pour un décalage de défilement donné
 * (en pixels). Le nombre de crêtes visibles ne dépend pas de la largeur du cadre.
 */
export function farRangeAt(range: FarRange, x: number, offset: number, width: number, height: number): { y: number; crest: number } {
  const crest = ridged(((x + offset * range.speed) / Math.max(1, width)) * range.ridges, range.seed)
  return { y: height * range.base - height * range.amplitude * crest, crest }
}

/**
 * Silhouette de la grande montagne, de 0 (pied) à 1 (sommet), pour une position
 * horizontale u entre 0 et 1 : pente longue à gauche, plus courte à droite.
 */
export function ridgeShape(u: number): number {
  if (u < PEAK_U) {
    const t = Math.max(0, Math.min(1, (u - 0.02) / (PEAK_U - 0.02)))
    return Math.pow(t, 1.45)
  }
  const t = Math.min(1, (u - PEAK_U) / (1 - PEAK_U))
  return 1 - 0.66 * Math.pow(t, 1.15)
}

export interface SceneLayout {
  width: number
  height: number
  /** Crête de la grande montagne (y en pixels) pour une abscisse x. */
  ridgeY: (x: number) => number
  /** Bord supérieur du plateau du village. */
  groundY: (x: number) => number
  /** Milieu du sentier du village. */
  pathY: (x: number) => number
  peak: Point
}

export function createLayout(width: number, height: number): SceneLayout {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const ridgeY = (x: number) => {
    const shape = ridgeShape(x / w)
    // Le relief s'accentue vers le haut : arêtes au sommet, pentes douces en bas.
    const relief = (fbm(x / 38, 41) - 0.5) * h * 0.035 * (0.4 + shape)
    return h * RIDGE_BASE - shape * h * RIDGE_RISE + relief
  }
  const peakX = PEAK_U * w
  return {
    width: w,
    height: h,
    ridgeY,
    groundY: (x) => h * (0.805 + 0.012 * Math.sin((x / w) * 5 + 1) + (fbm(x / 90, 61) - 0.5) * 0.016),
    pathY: (x) => h * (0.905 + 0.018 * Math.sin((x / w) * 3.1 + 0.6)),
    peak: { x: peakX, y: ridgeY(peakX) },
  }
}
