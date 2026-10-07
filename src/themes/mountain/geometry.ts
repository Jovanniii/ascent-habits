/**
 * Géométrie provisoire de la scène montagne (formes SVG simples).
 *
 * Le panorama est dessiné dans un repère de 320 × 76 unités, affiché en entier
 * quelle que soit la largeur (le ciel et les plans lointains débordent sur les
 * côtés pour remplir l'espace). La montagne principale occupe la droite ; le
 * sentier zigzague du pied jusqu'au sommet. Une montagne de cycle supérieur
 * (au-delà d'un an de série) est plus haute, avec une hauteur plafonnée ; le
 * drapeau du sommet reste toujours dans le cadre.
 */

export const VIEWBOX_WIDTH = 320
export const VIEWBOX_HEIGHT = 76

export interface Point {
  x: number
  y: number
}

/** Nombre de variantes de hauteur (au-delà, la montagne garde la plus haute). */
export const HEIGHT_VARIANTS = 3

/** Altitude du sommet (y) selon le cycle : plus le cycle est élevé, plus la montagne est haute. */
export function peakY(cycle: number): number {
  const level = Math.min(Math.max(1, Math.floor(cycle)), HEIGHT_VARIANTS)
  return [18, 14, 10][level - 1]!
}

/** Sentier de référence pour un sommet à y = 12, du pied au sommet. */
const BASE_TRAIL: readonly Point[] = [
  { x: 126, y: 72 },
  { x: 182, y: 62 },
  { x: 156, y: 51 },
  { x: 210, y: 40 },
  { x: 198, y: 28 },
  { x: 230, y: 15 },
]

/** Étire verticalement un point pour un sommet plus haut (le pied ne bouge pas). */
function stretch(point: Point, peak: number): Point {
  const ratio = (VIEWBOX_HEIGHT - peak) / (VIEWBOX_HEIGHT - 12)
  return { x: point.x, y: VIEWBOX_HEIGHT - (VIEWBOX_HEIGHT - point.y) * ratio }
}

export function trailPoints(cycle: number): Point[] {
  const peak = peakY(cycle)
  return BASE_TRAIL.map((point) => stretch(point, peak))
}

/** Silhouette arrondie de la montagne principale. */
export function mountainPath(cycle: number): string {
  const peak = peakY(cycle)
  return `M96 ${VIEWBOX_HEIGHT} Q160 ${peak + 18} 230 ${peak} Q290 ${peak + 28} 318 ${VIEWBOX_HEIGHT} Z`
}

/** Calotte de neige autour du sommet. */
export function snowCapPath(cycle: number): string {
  const peak = peakY(cycle)
  return `M212 ${peak + 9} Q222 ${peak + 1} 230 ${peak} Q240 ${peak + 2} 250 ${peak + 10} Q240 ${peak + 7} 232 ${peak + 11} Q222 ${peak + 7} 212 ${peak + 9} Z`
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Point situé à une fraction (0 à 1) de la longueur du sentier. */
export function pointAlong(points: readonly Point[], fraction: number): Point {
  const first = points[0]
  if (!first) return { x: 0, y: 0 }
  const t = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0
  const lengths = points.slice(1).map((point, index) => distance(points[index]!, point))
  const total = lengths.reduce((sum, length) => sum + length, 0)
  if (total === 0) return first
  let remaining = t * total
  for (let i = 0; i < lengths.length; i += 1) {
    const length = lengths[i]!
    if (remaining <= length || i === lengths.length - 1) {
      const from = points[i]!
      const to = points[i + 1]!
      const ratio = length === 0 ? 0 : Math.min(1, remaining / length)
      return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio }
    }
    remaining -= length
  }
  return points[points.length - 1]!
}

export function trailPath(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
}
