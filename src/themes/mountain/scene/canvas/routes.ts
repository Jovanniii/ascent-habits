/**
 * Voies d'ascension de la grande montagne (Doc 08, décision DA-D2) : une voie
 * par habitude et par objectif, sans limite de nombre (DA-D5). Les départs se
 * répartissent au pied de la montagne, de gauche à droite ; chaque voie monte en
 * lacets et toutes se rejoignent au sommet. Fonctions pures, testées.
 */
import type { Point, SceneLayout } from './layout.ts'
import { hash } from './noise.ts'

export interface Route {
  /** Points du tracé, du départ au sommet. */
  points: Point[]
  /** Longueur cumulée du tracé à chaque point. */
  lengths: number[]
}

/** Nombre de lacets d'une voie. */
const TURNS = 8
/** Points intermédiaires entre deux points de contrôle (courbe lissée). */
const SAMPLES = 16

/** Abscisse de départ (fraction de la largeur) de la voie `index` parmi `count`. */
export function routeStartU(index: number, count: number): number {
  if (count <= 1) return 0.3
  return 0.08 + (0.86 * index) / (count - 1)
}

function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t
  const t3 = t2 * t
  const axis = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
  return { x: axis(p0.x, p1.x, p2.x, p3.x), y: axis(p0.y, p1.y, p2.y, p3.y) }
}

function withLengths(points: Point[]): Route {
  const lengths = [0]
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1]! + Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y))
  }
  return { points, lengths }
}

/** Construit une voie, posée sur la face de la montagne (jamais au-dessus de la crête). */
export function buildRoute(index: number, count: number, layout: SceneLayout): Route {
  const { width, height, peak, ridgeY } = layout
  const startX = routeStartU(index, count) * width
  const startY = height * 0.785
  // Plus il y a de voies, plus les lacets sont serrés pour qu'elles restent distinctes.
  const swing = width * Math.min(0.06, 0.32 / Math.max(1, count)) * (0.8 + 0.4 * hash(index, 5))
  const onFace = (p: Point): Point => ({ x: p.x, y: Math.min(startY, Math.max(p.y, ridgeY(p.x) + 2)) })

  const control: Point[] = []
  for (let j = 0; j <= TURNS; j++) {
    const f = j / TURNS
    const along = 1 - Math.pow(1 - f, 1.6)
    const side = j === 0 || j === TURNS ? 0 : (j % 2 === 0 ? -1 : 1) * swing * (1 - f)
    control.push(onFace({ x: startX + (peak.x - startX) * along + side, y: startY + (peak.y + 2 - startY) * f }))
  }

  const points: Point[] = []
  for (let i = 0; i < control.length - 1; i++) {
    const p0 = control[Math.max(0, i - 1)]!
    const p3 = control[Math.min(control.length - 1, i + 2)]!
    for (let k = 0; k < SAMPLES; k++) points.push(onFace(catmullRom(p0, control[i]!, control[i + 1]!, p3, k / SAMPLES)))
  }
  points.push(control[control.length - 1]!)
  return withLengths(points)
}

export function buildRoutes(count: number, layout: SceneLayout): Route[] {
  const total = Math.max(0, Math.floor(count))
  return Array.from({ length: total }, (_, index) => buildRoute(index, total, layout))
}

/** Point situé à une fraction (0 à 1) de la longueur d'une voie, et sens de la marche. */
export function pointOnRoute(route: Route, fraction: number): Point & { direction: 1 | -1 } {
  const { points, lengths } = route
  const total = lengths[lengths.length - 1] ?? 0
  const target = total * Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0))
  let i = 1
  while (i < lengths.length - 1 && lengths[i]! < target) i++
  const a = points[Math.max(0, i - 1)]!
  const b = points[Math.min(points.length - 1, i)]!
  const segment = lengths[i]! - lengths[Math.max(0, i - 1)]! || 1
  const u = points.length < 2 ? 0 : (target - lengths[i - 1]!) / segment
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, direction: b.x < a.x ? -1 : 1 }
}
