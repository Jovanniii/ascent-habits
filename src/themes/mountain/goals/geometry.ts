/**
 * Géométrie de la scène d'un objectif : un sentier fixe monte vers un grand
 * sommet lointain ; des fanions marquent les jalons ; l'alpiniste avance.
 *
 * Règle de position (décision P4-D2) :
 * - Le sentier est fixe : il ne dépend ni du nombre de jalons ni de leur état.
 * - Le jalon n° k (compté dans l'ordre où on les termine) correspond toujours au
 *   même point du sentier, `stepAt(k)`. L'alpiniste est au point du nombre de
 *   jalons terminés : sa position est absolue, elle ne dépend pas du total.
 * - Le sommet est un pas plus loin que le dernier jalon, au point `stepAt(total + 1)`.
 *   Ajouter un jalon le repousse plus haut (« plus haut que prévu ») sans déplacer
 *   l'alpiniste ; le dernier pas, du dernier jalon au sommet, est « Marquer comme
 *   atteint » : c'est l'utilisateur qui décide qu'il est arrivé (D6).
 * - `stepAt` croît sans jamais atteindre le bout du sentier : le sommet reste
 *   toujours dans le cadre, même avec beaucoup de jalons.
 */

export const GOAL_VIEWBOX_WIDTH = 320
export const GOAL_VIEWBOX_HEIGHT = 112

export interface Point {
  x: number
  y: number
}

/**
 * Nombre de pas pour parcourir la moitié du sentier. Plus il est grand, plus
 * les premiers pas sont courts et plus le sommet d'un petit objectif est bas.
 */
export const HALF_TRAIL_STEPS = 3

/**
 * Sentier fixe, du premier plan (en bas à gauche) jusqu'à l'horizon (en haut à droite).
 * Il monte vite puis s'aplatit, comme un chemin qui s'éloigne en perspective.
 */
export const GOAL_TRAIL: readonly Point[] = [
  { x: 16, y: 104 },
  { x: 40, y: 84 },
  { x: 68, y: 66 },
  { x: 100, y: 51 },
  { x: 136, y: 39 },
  { x: 176, y: 29 },
  { x: 220, y: 21 },
  { x: 262, y: 16 },
  { x: 302, y: 12 },
]

/** Fraction du sentier (entre 0 et 1, exclu) atteinte après `steps` pas. */
export function stepAt(steps: number): number {
  const k = Number.isFinite(steps) ? Math.max(0, steps) : 0
  return k / (k + HALF_TRAIL_STEPS)
}

export interface GoalLayoutInput {
  done: number
  total: number
  achieved: boolean
}

export interface GoalLayout {
  /** Fraction du sentier où se tient l'alpiniste. */
  climber: number
  /** Fraction du sentier où se trouve le sommet (et son drapeau). */
  summit: number
  /** Fanions des jalons, du plus proche au plus lointain ; les premiers sont « plantés ». */
  pennants: { at: number; planted: boolean }[]
  /** Vrai quand tous les jalons sont terminés mais que l'objectif n'est pas encore marqué comme atteint. */
  readyForSummit: boolean
}

export function goalLayout({ done, total, achieved }: GoalLayoutInput): GoalLayout {
  const safeTotal = Math.max(0, Math.floor(total))
  const safeDone = Math.min(Math.max(0, Math.floor(done)), safeTotal)
  const summit = stepAt(safeTotal + 1)
  return {
    climber: achieved ? summit : stepAt(safeDone),
    summit,
    pennants: Array.from({ length: safeTotal }, (_, i) => ({ at: stepAt(i + 1), planted: i < safeDone })),
    readyForSummit: !achieved && safeTotal > 0 && safeDone === safeTotal,
  }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Point situé à une fraction (0 à 1) de la longueur du sentier, et sentier parcouru jusque-là. */
export function walk(points: readonly Point[], fraction: number): { point: Point; path: Point[] } {
  const first = points[0] ?? { x: 0, y: 0 }
  const t = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0
  const lengths = points.slice(1).map((point, index) => distance(points[index]!, point))
  let remaining = t * lengths.reduce((sum, length) => sum + length, 0)
  const path: Point[] = [first]
  for (let i = 0; i < lengths.length; i += 1) {
    const length = lengths[i]!
    const from = points[i]!
    const to = points[i + 1]!
    if (remaining <= length) {
      const ratio = length === 0 ? 0 : remaining / length
      const point = { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio }
      path.push(point)
      return { point, path }
    }
    remaining -= length
    path.push(to)
  }
  return { point: path[path.length - 1]!, path }
}

export function pointOnTrail(fraction: number): Point {
  return walk(GOAL_TRAIL, fraction).point
}

/**
 * Silhouette du grand sommet : sa crête suit le sentier jusqu'au sommet, puis
 * redescend à droite. Plus il y a de jalons, plus il est haut et lointain.
 */
export function summitPath(summit: number): string {
  const { point: top, path } = walk(GOAL_TRAIL, summit)
  const height = GOAL_VIEWBOX_HEIGHT - top.y
  const right = top.x + height * 0.9
  const ridge = path.map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  return `M-480 ${GOAL_VIEWBOX_HEIGHT} L-480 106 L0 106 ${ridge} Q${(top.x + height * 0.25).toFixed(1)} ${(top.y + height * 0.2).toFixed(1)} ${right.toFixed(1)} ${GOAL_VIEWBOX_HEIGHT} Z`
}

/** Calotte de neige autour du sommet, proportionnée à sa hauteur. */
export function summitSnowPath(summit: number): string {
  const top = pointOnTrail(summit)
  const s = Math.max(0.5, (GOAL_VIEWBOX_HEIGHT - top.y) / 70)
  const p = (dx: number, dy: number) => `${(top.x + dx * s).toFixed(1)} ${(top.y + dy * s).toFixed(1)}`
  return `M${p(-12, 6)} L${p(0, 0)} Q${p(6, 1)} ${p(12, 9)} Q${p(6, 7)} ${p(2, 10)} Q${p(-4, 7)} ${p(-12, 6)} Z`
}

export function pathData(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
}
