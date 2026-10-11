/**
 * Rendu Canvas 2D de la scène « Cordée » (Doc 08, prototype
 * docs/prototypes/cordee-scene.html).
 *
 * De l'arrière vers l'avant : ciel (dégradé, soleil, lune, étoiles, nuages),
 * trois chaînes lointaines qui défilent lentement avec la brume, la grande
 * montagne et ses voies (une par habitude et par objectif), puis le village fixe :
 * cabanes, sapins, sentier, randonneurs de passage et randonneurs qui attendent
 * au poteau de départ (un par tâche du jour).
 *
 * Les objets (cabanes, sapins, personnages) sont dessinés par des fonctions
 * isolées, pour pouvoir les remplacer plus tard par des illustrations peintes.
 * Sans animation (réglage ou préférence de l'appareil), chaque appel de
 * `render(0)` dessine une image fixe, identique d'un appel à l'autre.
 */
import { FAR_RANGES, createLayout, farRangeAt, type FarRange, type Point, type SceneLayout } from './layout.ts'
import { fbm, hash, seededRandom } from './noise.ts'
import { buildRoutes, pointOnRoute, type Route } from './routes.ts'
import { clamp, hexToRgb, mixRgb, rgba, skyAt, tintFor, type Rgb, type SkyState } from './sky.ts'
import { shortLabel, type Track } from './tracks.ts'

export interface RenderInput {
  tracks: readonly Track[]
  /** Tâches à faire aujourd'hui : autant de randonneurs attendent au départ du sentier. */
  pendingTasks: number
  hour: number
  motion: boolean
  variant: 'banner' | 'full'
}

/** Au-delà, les randonneurs qui attendent ne se dessinent plus (la scène reste lisible). */
export const MAX_WAITING_HIKERS = 12
/** Vitesse de montée d'un alpiniste, en fraction de voie par seconde. */
const CLIMB_SPEED = 0.05
const TAU = Math.PI * 2
const WHITE: Rgb = [255, 255, 255]
const BLACK: Rgb = [0, 0, 0]
const COATS = ['#c8553d', '#3f7f9a', '#d9a441', '#6b8f4e', '#9b5f8f', '#e07a5f', '#4f6d7a'].map(hexToRgb)

type Ctx = CanvasRenderingContext2D

interface Paint {
  ctx: Ctx
  sky: SkyState
  layout: SceneLayout
  time: number
  motion: boolean
}

interface ClimberState {
  shown: number
  phase: number
  celebrated: boolean
}

interface WalkerGroup {
  x: number
  direction: 1 | -1
  speed: number
  lane: number
  members: { color: Rgb; phase: number }[]
}

interface Departing {
  x: number
  phase: number
  color: Rgb
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

interface Star {
  x: number
  y: number
  r: number
  phase: number
  bright: number
}

interface Cloud {
  x: number
  y: number
  scale: number
  speed: number
  puffs: [number, number, number][]
}

/** Fabrique un petit canevas hors écran (grain de papier) ; absente dans les tests sans DOM. */
export type CanvasFactory = (size: number) => { pattern: (ctx: Ctx) => CanvasPattern | null } | null

export const browserCanvasFactory: CanvasFactory = (size) => {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  if (!g) return null
  const image = g.createImageData(size, size) as ImageData | undefined
  if (!image?.data) return null
  const random = seededRandom(3)
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 120 + Math.floor(random() * 135)
    image.data[i] = v
    image.data[i + 1] = v
    image.data[i + 2] = v
    image.data[i + 3] = 255
  }
  g.putImageData(image, 0, 0)
  return { pattern: (ctx) => ctx.createPattern(canvas, 'repeat') }
}

function line(ctx: Ctx, points: readonly Point[]): void {
  ctx.beginPath()
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  })
}

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Le soleil (ou la lune, la nuit) est-il à gauche de l'abscisse donnée ? */
function lightFromLeft(p: Paint, x: number): boolean {
  const orb = p.sky.sun.visible > 0 ? p.sky.sun : p.sky.moon
  return orb.x * p.layout.width < x
}

/* ------------------------------------------------------------------ ciel -- */

function drawSky(p: Paint, stars: readonly Star[]): void {
  const { ctx, sky, layout } = p
  const { width: w, height: h } = layout
  const gradient = ctx.createLinearGradient(0, 0, 0, h * 0.68)
  gradient.addColorStop(0, rgba(sky.top))
  gradient.addColorStop(0.55, rgba(sky.mid))
  gradient.addColorStop(1, rgba(sky.bottom))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  if (sky.stars > 0.02) {
    for (const star of stars) {
      const twinkle = p.motion ? 0.55 + 0.45 * Math.sin(p.time * 1.6 + star.phase) : 0.8
      ctx.fillStyle = `rgba(255,248,235,${sky.stars * twinkle * (0.35 + 0.65 * star.bright) * (1 - star.y / (h * 0.66))})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, TAU)
      ctx.fill()
    }
  }

  const horizon = h * 0.56
  if (sky.moon.visible > 0) {
    const alpha = sky.moon.visible * Math.min(1, sky.stars * 1.4)
    const mx = w * (0.12 + 0.76 * ((sky.moon.x - 0.08) / 0.84))
    const my = horizon - h * 0.02 - sky.moon.height * h * 0.42
    const glow = ctx.createRadialGradient(mx, my, 0, mx, my, h * 0.25)
    glow.addColorStop(0, `rgba(214,224,255,${0.28 * alpha})`)
    glow.addColorStop(1, 'rgba(214,224,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
    const r = Math.max(8, h * 0.022)
    ctx.fillStyle = `rgba(250,246,236,${alpha})`
    ctx.beginPath()
    ctx.arc(mx, my, r, 0, TAU)
    ctx.fill()
    ctx.fillStyle = rgba(sky.top, alpha * 0.85)
    ctx.beginPath()
    ctx.arc(mx + r * 0.45, my - r * 0.25, r * 0.88, 0, TAU)
    ctx.fill()
  }

  if (sky.sun.visible > 0) {
    const warm = sky.lightAmount * sky.sun.visible
    const sx = sky.sun.x * w
    const sy = horizon + 14 - sky.sun.height * h * 0.4
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.75)
    glow.addColorStop(0, rgba(mixRgb(sky.light, WHITE, 0.4), 0.55 * warm))
    glow.addColorStop(0.25, rgba(sky.light, 0.22 * warm))
    glow.addColorStop(1, rgba(sky.light, 0))
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
    // Rayons de lumière, très légers.
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 7; i++) {
      const angle = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(p.time * 0.05 + i) * 0.04
      ctx.fillStyle = rgba(sky.light, 0.045 * warm)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + Math.cos(angle - 0.05) * h * 1.2, sy + Math.sin(angle - 0.05) * h * 1.2)
      ctx.lineTo(sx + Math.cos(angle + 0.05) * h * 1.2, sy + Math.sin(angle + 0.05) * h * 1.2)
      ctx.fill()
    }
    ctx.restore()
    ctx.fillStyle = rgba(mixRgb(sky.light, [255, 252, 240], 0.6), Math.min(1, sky.sun.visible * 2))
    ctx.beginPath()
    ctx.arc(sx, sy, Math.max(12, h * 0.033), 0, TAU)
    ctx.fill()
  }
}

function drawClouds(p: Paint, clouds: readonly Cloud[]): void {
  const { ctx, sky, layout } = p
  const lit = mixRgb(mixRgb(WHITE, sky.light, 0.55), sky.bottom, 0.15)
  const shade = mixRgb(sky.mid, sky.top, 0.45)
  const alpha = 0.8 - 0.45 * sky.stars
  for (const cloud of clouds) {
    const span = layout.width * 1.4 + 200
    const x = ((((cloud.x + p.time * cloud.speed) % span) + span) % span) - 150
    ctx.save()
    ctx.translate(x, cloud.y)
    ctx.scale(cloud.scale, cloud.scale * 0.8)
    const gradient = ctx.createLinearGradient(0, -40, 0, 14)
    gradient.addColorStop(0, rgba(lit, alpha))
    gradient.addColorStop(1, rgba(shade, alpha * 0.9))
    ctx.fillStyle = gradient
    ctx.beginPath()
    for (const [px, py, r] of cloud.puffs) {
      ctx.moveTo(px + r, py)
      ctx.arc(px, py, r, 0, TAU)
    }
    ctx.fill()
    ctx.restore()
  }
}

/* -------------------------------------------------------- relief lointain -- */

function drawFarRange(p: Paint, range: FarRange, camera: number): void {
  const { ctx, sky, layout } = p
  const { width: w, height: h } = layout
  const color = mixRgb(mixRgb(sky.ink, sky.bottom, range.depth), sky.mid, range.depth * 0.18)
  const crests: { x: number; y: number; crest: number }[] = []
  ctx.beginPath()
  ctx.moveTo(0, h)
  for (let x = -4; x <= w + 4; x += 4) {
    const at = { x, ...farRangeAt(range, x, camera, w, h) }
    crests.push(at)
    ctx.lineTo(x, at.y)
  }
  ctx.lineTo(w + 4, h)
  ctx.closePath()
  const gradient = ctx.createLinearGradient(0, h * (range.base - range.amplitude), 0, h * (range.base + 0.15))
  gradient.addColorStop(0, rgba(color))
  gradient.addColorStop(1, rgba(mixRgb(color, sky.bottom, 0.35)))
  ctx.fillStyle = gradient
  ctx.fill()

  // Neige sur les crêtes : une bande continue sous chaque arête, plus claire côté lumière.
  const snowLit = mixRgb(mixRgb([246, 243, 236], sky.light, 0.35), sky.bottom, range.depth * 0.75)
  const snowShade = mixRgb(snowLit, sky.top, 0.25)
  const depthOf = (x: number, crest: number) =>
    crest < range.snowLine ? 0 : Math.min(h * 0.045, (crest - range.snowLine) * h * range.amplitude * 1.6) + fbm(x / 20, range.seed + 5) * 4
  for (const lit of [true, false]) {
    ctx.beginPath()
    for (let i = 1; i < crests.length; i++) {
      const a = crests[i - 1]!
      const b = crests[i]!
      const faceLit = b.y < a.y === lightFromLeft(p, b.x)
      if (faceLit !== lit || b.crest < range.snowLine) continue
      // Petit quadrilatère entre deux colonnes : la neige suit la pente de la crête.
      ctx.moveTo(a.x, a.y - 0.5)
      ctx.lineTo(b.x, b.y - 0.5)
      ctx.lineTo(b.x, b.y + depthOf(b.x, b.crest))
      ctx.lineTo(a.x, a.y + depthOf(a.x, Math.max(a.crest, range.snowLine)))
      ctx.closePath()
    }
    ctx.fillStyle = rgba(lit ? snowLit : snowShade, 0.92)
    ctx.fill()
  }

  line(ctx, crests)
  ctx.strokeStyle = rgba(sky.light, sky.lightAmount * 0.4 * (1.1 - range.depth))
  ctx.lineWidth = 1.2
  ctx.stroke()
}

function drawFog(p: Paint, y: number, spread: number, amount: number): void {
  const { ctx, sky, layout } = p
  const fog = mixRgb(sky.bottom, sky.mid, 0.25)
  const gradient = ctx.createLinearGradient(0, y - spread, 0, y + spread)
  gradient.addColorStop(0, rgba(fog, 0))
  gradient.addColorStop(0.5, rgba(fog, amount))
  gradient.addColorStop(1, rgba(fog, 0))
  ctx.fillStyle = gradient
  ctx.fillRect(0, y - spread, layout.width, spread * 2)
  ctx.fillStyle = rgba(mixRgb(fog, WHITE, 0.2), amount * 0.35)
  for (let i = 0; i < 5; i++) {
    const x = ((i * layout.width * 0.31 + p.time * (6 + i * 2)) % (layout.width + 300)) - 150
    ctx.beginPath()
    ctx.ellipse(x, y + Math.sin(p.time * 0.2 + i) * 4, 140 + i * 20, spread * 0.35, 0, 0, TAU)
    ctx.fill()
  }
}

/* ------------------------------------------------------- grande montagne -- */

function faceOf(p: Paint, lit: boolean, bottom: number): void {
  const { ctx, layout } = p
  const { width: w, peak } = layout
  const right = lit !== lightFromLeft(p, peak.x)
  ctx.beginPath()
  ctx.moveTo(peak.x, peak.y - 20)
  if (right) {
    ctx.lineTo(w * 0.78, bottom)
    ctx.lineTo(w + 20, bottom)
    ctx.lineTo(w + 20, 0)
  } else {
    ctx.lineTo(w * 0.42, bottom)
    ctx.lineTo(-20, bottom)
    ctx.lineTo(-20, 0)
  }
  ctx.closePath()
}

function drawMainRidge(p: Paint, ridge: readonly Point[]): void {
  const { ctx, sky, layout } = p
  const { width: w, height: h } = layout
  const base = mixRgb(mixRgb(sky.ink, sky.bottom, 0.3), sky.mid, 0.06)
  const outline = () => {
    ctx.beginPath()
    ctx.moveTo(-8, h)
    for (const point of ridge) ctx.lineTo(point.x, point.y)
    ctx.lineTo(w + 8, h)
    ctx.closePath()
  }
  outline()
  const gradient = ctx.createLinearGradient(0, h * 0.24, 0, h * 0.8)
  gradient.addColorStop(0, rgba(mixRgb(base, sky.light, 0.12)))
  gradient.addColorStop(1, rgba(mixRgb(base, sky.bottom, 0.22)))
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.save()
  outline()
  ctx.clip()
  faceOf(p, false, h)
  ctx.fillStyle = rgba(mixRgb(sky.ink, sky.top, 0.3), 0.32)
  ctx.fill()
  faceOf(p, true, h)
  ctx.fillStyle = rgba(sky.light, 0.14 * sky.lightAmount)
  ctx.fill()

  // Strates de roche, en hachures légères.
  ctx.strokeStyle = rgba(mixRgb(sky.ink, BLACK, 0.3), 0.18)
  ctx.lineWidth = 1
  const random = seededRandom(99)
  for (let i = 0; i < 70; i++) {
    const x = w * (0.1 + random() * 0.85)
    const top = layout.ridgeY(x)
    const y = top + random() * (h * 0.77 - top)
    const slope = (layout.ridgeY(x + 6) - layout.ridgeY(x - 6)) / 12
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + 9, y + slope * 9 + 1.5, x + 18 + random() * 10, y + slope * 20 + random() * 3)
    ctx.stroke()
  }

  // Calotte de neige, avec ses coulures.
  ctx.beginPath()
  ctx.moveTo(-10, -10)
  for (let x = -10; x <= w + 10; x += 4) {
    const drip = Math.pow(Math.max(0, Math.sin(x * 0.09 + 1.3)), 8) * h * 0.035
    ctx.lineTo(x, h * 0.41 + (fbm(x / 26, 77) - 0.5) * h * 0.1 + drip)
  }
  ctx.lineTo(w + 10, -10)
  ctx.closePath()
  ctx.clip()
  ctx.fillStyle = rgba(mixRgb(mixRgb([252, 248, 240], sky.light, 0.32), sky.bottom, 0.08))
  ctx.fillRect(0, 0, w, h)
  faceOf(p, false, h * 0.55)
  ctx.fillStyle = rgba(mixRgb(mixRgb([168, 184, 220], sky.top, 0.3), sky.ink, 0.15 * sky.stars), 0.9)
  ctx.fill()
  // Scintillement de la neige au soleil.
  for (let i = 0; i < 26; i++) {
    const x = w * (0.3 + hash(i, 5) * 0.55)
    const y = layout.ridgeY(x) + hash(i, 9) * h * 0.06 + 4
    const twinkle = p.motion ? Math.max(0, Math.sin(p.time * 2 + i * 3.1)) : 0.5
    ctx.fillStyle = `rgba(255,255,255,${twinkle * sky.lightAmount * 0.9 * (sky.sun.visible > 0 ? 1 : 0.4)})`
    ctx.fillRect(x, y, 1.6, 1.6)
  }
  ctx.restore()

  line(ctx, ridge)
  ctx.strokeStyle = rgba(sky.light, sky.lightAmount * 0.55)
  ctx.lineWidth = 1.4
  ctx.stroke()
}

/* --------------------------------------------------- objets dessinés ----- */

/** Sapin dessiné à la main, côté éclairé et neige posée sur les branches. */
function drawFir(p: Paint, x: number, y: number, h: number, seed: number, detailed: boolean): void {
  const { ctx, sky } = p
  const green = tintFor(hexToRgb('#2c4a3e'), sky)
  const lit = tintFor(hexToRgb('#7d9a5f'), sky)
  const snow = tintFor(hexToRgb('#f6f1e6'), sky, 0.6)
  const dark = mixRgb(green, [10, 12, 18], 0.45)
  const fromRight = !lightFromLeft(p, x)
  ctx.fillStyle = rgba(tintFor(hexToRgb('#4a3226'), sky))
  ctx.fillRect(x - h * 0.025, y - h * 0.12, h * 0.05, h * 0.13)
  const tiers = detailed ? 5 : 4
  const width = h * 0.36
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers
    const by = y - h * 0.08 - h * 0.82 * t0
    const tw = width * (1 - t0 * 0.72)
    const top = by - h * 0.34
    ctx.beginPath()
    ctx.moveTo(x, top)
    for (let k = 0; k <= 6; k++) {
      const jitter = (hash(seed + i * 9 + k, 3) - 0.5) * tw * 0.18
      ctx.lineTo(x + tw * (1 - (2 * k) / 6) + jitter, by + (k % 2 ? -h * 0.035 : 0))
    }
    ctx.closePath()
    ctx.fillStyle = rgba(green)
    ctx.fill()
    if (detailed) {
      ctx.strokeStyle = rgba(dark, 0.8)
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
    const side = fromRight ? tw : -tw
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x + side * 0.95, by)
    ctx.lineTo(x + side * 0.15, by - h * 0.02)
    ctx.closePath()
    ctx.fillStyle = rgba(lit, 0.35 + 0.4 * sky.lightAmount)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x, top + 1)
    ctx.lineTo(x - tw * 0.55, by - h * 0.12)
    ctx.quadraticCurveTo(x, by - h * 0.16, x + tw * 0.55, by - h * 0.12)
    ctx.closePath()
    ctx.fillStyle = rgba(snow, 0.85)
    ctx.fill()
  }
}

/** Rocher avec sa casquette de neige. */
function drawRock(p: Paint, x: number, y: number, r: number, seed: number): void {
  const { ctx, sky } = p
  const base = tintFor(hexToRgb('#6f6470'), sky)
  ctx.beginPath()
  for (let k = 0; k <= 9; k++) {
    const angle = Math.PI + (k / 9) * Math.PI
    const rr = r * (0.8 + hash(seed + k, 4) * 0.35)
    ctx.lineTo(x + Math.cos(angle) * rr * 1.3, y + Math.sin(angle) * rr)
  }
  ctx.closePath()
  ctx.fillStyle = rgba(base)
  ctx.fill()
  ctx.strokeStyle = rgba(mixRgb(base, BLACK, 0.5), 0.7)
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = rgba(tintFor(hexToRgb('#b7a99a'), sky), 0.3 + 0.4 * sky.lightAmount)
  ctx.beginPath()
  ctx.ellipse(x - r * 0.3, y - r * 0.6, r * 0.6, r * 0.25, -0.3, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(tintFor(hexToRgb('#f4efe6'), sky, 0.6), 0.9)
  ctx.beginPath()
  ctx.ellipse(x, y - r * 0.85, r * 0.7, r * 0.18, 0, 0, TAU)
  ctx.fill()
}

const WOODS = ['#8a5a3c', '#7a4e38', '#9a6a44', '#6e4a3a'].map(hexToRgb)
const ROOFS = ['#4a3b3a', '#5a3a34', '#3e3a44', '#54423a'].map(hexToRgb)

/** Cabane en bois : fenêtres allumées la nuit, fumée, toit enneigé. */
function drawCabin(p: Paint, x: number, y: number, s: number, variant: number): void {
  const { ctx, sky } = p
  const wood = tintFor(WOODS[variant % 4]!, sky)
  const woodDark = mixRgb(wood, [20, 10, 10], 0.45)
  const roof = tintFor(ROOFS[variant % 4]!, sky)
  const snow = tintFor(hexToRgb('#f7f2e8'), sky, 0.5)
  const night = sky.stars
  const ww = s * (variant % 3 === 1 ? 1.25 : 1)
  const wh = s * 0.62
  if (night > 0.1) {
    const glow = ctx.createRadialGradient(x, y - wh * 0.45, 0, x, y - wh * 0.45, s * 1.6)
    glow.addColorStop(0, `rgba(255,190,110,${0.45 * night})`)
    glow.addColorStop(1, 'rgba(255,190,110,0)')
    ctx.fillStyle = glow
    ctx.fillRect(x - s * 2, y - s * 2.2, s * 4, s * 3)
  }
  ctx.fillStyle = rgba(tintFor(hexToRgb('#7d7480'), sky))
  ctx.fillRect(x - ww / 2 - 1, y - wh * 0.18, ww + 2, wh * 0.18)
  ctx.fillStyle = rgba(wood)
  ctx.fillRect(x - ww / 2, y - wh, ww, wh * 0.82)
  ctx.strokeStyle = rgba(woodDark, 0.8)
  ctx.lineWidth = 1
  for (let i = 1; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(x - ww / 2, y - wh + (i * wh * 0.82) / 5)
    ctx.lineTo(x + ww / 2, y - wh + (i * wh * 0.82) / 5 + (i % 2 ? 0.6 : -0.4))
    ctx.stroke()
  }
  ctx.strokeRect(x - ww / 2, y - wh, ww, wh * 0.82)
  const windowLight = mixRgb([255, 196, 120], [255, 226, 170], 0.4)
  const pane = (wx: number) => {
    ctx.fillStyle = night > 0.1 ? rgba(windowLight, 0.4 + 0.6 * night) : rgba(mixRgb(woodDark, sky.top, 0.4))
    ctx.fillRect(wx, y - wh * 0.74, s * 0.24, s * 0.22)
    ctx.strokeStyle = rgba(woodDark)
    ctx.strokeRect(wx, y - wh * 0.74, s * 0.24, s * 0.22)
  }
  pane(x - ww * 0.38)
  if (ww > s * 1.1) pane(x - ww * 0.08)
  ctx.fillStyle = rgba(woodDark)
  ctx.fillRect(x + ww * 0.2, y - wh * 0.66, s * 0.2, wh * 0.48)
  ctx.fillStyle = rgba(roof)
  ctx.fillRect(x + ww * 0.18, y - wh - s * 0.55, s * 0.12, s * 0.3)
  // Fumée de la cheminée.
  for (let i = 0; i < 5; i++) {
    const t = (p.time * 0.18 + i / 5 + variant * 0.13) % 1
    ctx.fillStyle = rgba(mixRgb([235, 230, 225], sky.light, 0.3), (1 - t) * 0.32)
    ctx.beginPath()
    ctx.arc(x + ww * 0.24 + Math.sin(t * 5 + i + variant) * 6 + t * 14, y - wh - s * 0.58 - t * s * 1.3, 2.5 + t * s * 0.14, 0, TAU)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(x - ww * 0.68, y - wh + 2)
  ctx.lineTo(x, y - wh - s * 0.55)
  ctx.lineTo(x + ww * 0.68, y - wh + 2)
  ctx.closePath()
  ctx.fillStyle = rgba(roof)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x - ww * 0.66, y - wh - 1)
  ctx.lineTo(x, y - wh - s * 0.58)
  ctx.lineTo(x + ww * 0.66, y - wh - 1)
  ctx.quadraticCurveTo(x + ww * 0.3, y - wh - s * 0.18, x, y - wh - s * 0.3)
  ctx.quadraticCurveTo(x - ww * 0.3, y - wh - s * 0.16, x - ww * 0.66, y - wh - 1)
  ctx.fillStyle = rgba(snow)
  ctx.fill()
  ctx.strokeStyle = rgba(mixRgb(roof, BLACK, 0.4))
  ctx.stroke()
  if (variant % 2 === 0) {
    // Tas de bois.
    ctx.fillStyle = rgba(tintFor(hexToRgb('#6a4630'), sky))
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 3 - k; j++) {
        ctx.beginPath()
        ctx.arc(x - ww / 2 - s * 0.18 - j * s * 0.13 - k * s * 0.065, y - s * 0.06 - k * s * 0.11, s * 0.065, 0, TAU)
        ctx.fill()
      }
    }
  }
}

function drawLamp(p: Paint, x: number, y: number, s: number): void {
  const { ctx, sky } = p
  const post = tintFor(hexToRgb('#3b2e28'), sky, 0.6)
  const night = sky.stars
  ctx.strokeStyle = rgba(post)
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - s)
  ctx.stroke()
  ctx.fillStyle = night > 0.1 ? `rgba(255,210,140,${0.5 + 0.5 * night})` : rgba(mixRgb(post, sky.light, 0.3))
  ctx.fillRect(x - s * 0.08, y - s * 1.12, s * 0.16, s * 0.14)
  if (night > 0.1) {
    const glow = ctx.createRadialGradient(x, y - s * 1.05, 0, x, y - s * 1.05, s * 1.4)
    glow.addColorStop(0, `rgba(255,200,120,${0.4 * night})`)
    glow.addColorStop(1, 'rgba(255,200,120,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y - s * 1.05, s * 1.4, 0, TAU)
    ctx.fill()
  }
}

/** Poteau indicateur au départ du sentier, où attendent les randonneurs des tâches du jour. */
function drawSignpost(p: Paint, x: number, y: number, s: number): void {
  const { ctx, sky } = p
  const wood = tintFor(hexToRgb('#7a5236'), sky, 0.6)
  ctx.strokeStyle = rgba(mixRgb(wood, BLACK, 0.3))
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - s * 1.3)
  ctx.stroke()
  ctx.fillStyle = rgba(wood)
  for (const [dy, dir] of [
    [-1.2, 1],
    [-0.9, -1],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(x, y + s * dy)
    ctx.lineTo(x + dir * s * 0.62, y + s * dy)
    ctx.lineTo(x + dir * s * 0.74, y + s * (dy + 0.09))
    ctx.lineTo(x + dir * s * 0.62, y + s * (dy + 0.18))
    ctx.lineTo(x, y + s * (dy + 0.18))
    ctx.closePath()
    ctx.fill()
  }
  ctx.fillStyle = rgba(tintFor(hexToRgb('#f4efe6'), sky, 0.5), 0.9)
  ctx.fillRect(x - s * 0.05, y - s * 1.36, s * 0.1, s * 0.06)
}

interface FigureStyle {
  color: Rgb
  direction: 1 | -1
  phase: number
  walking: boolean
  /** Fanion d'objectif porté sur le sac. */
  pennant?: boolean
  /** Assis, au repos (jour manqué, pause) : pas de reproche, une pause. */
  resting?: boolean
}

/** Personnage dessiné à la main : alpiniste ou randonneur. */
function drawFigure(p: Paint, x: number, y: number, s: number, style: FigureStyle): void {
  const { ctx, sky } = p
  const night = sky.stars
  const coat = tintFor(style.color, sky, 0.7)
  const coatDark = mixRgb(coat, [15, 10, 20], 0.35)
  const skin = tintFor(hexToRgb('#e9b998'), sky, 0.5)
  const ink = mixRgb(sky.ink, BLACK, 0.4)
  const pack = tintFor(hexToRgb('#5b4636'), sky, 0.7)
  const dir = style.direction
  if (night > 0.35) {
    // Lampe frontale.
    const glow = ctx.createRadialGradient(x + dir * s * 0.5, y - s * 1.6, 0, x + dir * s * 0.5, y - s * 1.6, s * 3)
    glow.addColorStop(0, `rgba(255,236,190,${0.5 * night})`)
    glow.addColorStop(1, 'rgba(255,236,190,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x + dir * s * 0.5, y - s * 1.6, s * 3, 0, TAU)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.ellipse(x, y + 1, s * 0.55, s * 0.14, 0, 0, TAU)
  ctx.fill()
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(dir, 1)
  const swing = style.walking ? Math.sin(style.phase) * 0.45 : 0
  const bob = style.walking ? Math.abs(Math.sin(style.phase)) * s * 0.06 : 0
  ctx.lineCap = 'round'
  ctx.strokeStyle = rgba(ink)
  ctx.lineWidth = s * 0.16
  ctx.beginPath()
  if (style.resting) {
    // Assis sur son sac, jambes allongées.
    ctx.moveTo(0, -s * 0.5)
    ctx.lineTo(s * 0.55, -s * 0.05)
    ctx.moveTo(0, -s * 0.5)
    ctx.lineTo(s * 0.45, 0)
    ctx.stroke()
    ctx.translate(0, s * 0.3)
  } else {
    ctx.moveTo(0, -s * 0.75)
    ctx.lineTo(Math.sin(swing) * s * 0.45, 0)
    ctx.moveTo(0, -s * 0.75)
    ctx.lineTo(-Math.sin(swing) * s * 0.45, 0)
    ctx.stroke()
  }
  ctx.translate(0, -bob)
  if (style.pennant) {
    ctx.strokeStyle = rgba(ink)
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(-s * 0.45, -s * 1.6)
    ctx.lineTo(-s * 0.45, -s * 3.1)
    ctx.stroke()
    ctx.fillStyle = rgba(coat)
    ctx.beginPath()
    ctx.moveTo(-s * 0.45, -s * 3.1)
    ctx.lineTo(-s * 1.25, -s * 2.85 + Math.sin(style.phase * 0.7) * s * 0.08)
    ctx.lineTo(-s * 0.45, -s * 2.55)
    ctx.closePath()
    ctx.fill()
  }
  ctx.lineWidth = 1
  ctx.strokeStyle = rgba(ink)
  ctx.fillStyle = rgba(pack)
  roundedRect(ctx, -s * 0.62, -s * 1.75, s * 0.45, s * 0.8, s * 0.12)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = rgba(coat)
  roundedRect(ctx, -s * 0.3, -s * 1.8, s * 0.62, s * 1.08, s * 0.22)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = rgba(coatDark, 0.6)
  ctx.fillRect(-s * 0.3, -s * 1.08, s * 0.62, s * 0.12)
  ctx.lineWidth = s * 0.13
  ctx.beginPath()
  ctx.moveTo(s * 0.12, -s * 1.55)
  ctx.lineTo(s * 0.48, -s * 1.15 + Math.sin(style.phase) * s * 0.05)
  ctx.stroke()
  ctx.lineWidth = 1.2
  ctx.strokeStyle = rgba(tintFor(hexToRgb('#3b2e28'), sky, 0.6))
  ctx.beginPath()
  ctx.moveTo(s * 0.48, -s * 1.15)
  ctx.lineTo(s * 0.6, -s * 0.05)
  ctx.stroke()
  ctx.fillStyle = rgba(skin)
  ctx.strokeStyle = rgba(ink)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(s * 0.05, -s * 2.08, s * 0.3, 0, TAU)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = rgba(coat)
  ctx.beginPath()
  ctx.arc(s * 0.05, -s * 2.15, s * 0.31, Math.PI, 0)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(s * 0.05, -s * 2.5, s * 0.09, 0, TAU)
  ctx.fill()
  ctx.restore()
}

function drawFlag(p: Paint, x: number, y: number, s: number, reached: boolean, color: Rgb): void {
  const { ctx, sky } = p
  const pole = mixRgb(sky.ink, BLACK, 0.3)
  const cloth = reached ? tintFor(color, sky, 0.35) : mixRgb(tintFor(hexToRgb('#e8e0d4'), sky, 0.6), sky.bottom, 0.35)
  ctx.strokeStyle = rgba(pole)
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - s * 2.1)
  ctx.stroke()
  ctx.fillStyle = rgba(cloth, reached ? 1 : 0.8)
  ctx.beginPath()
  ctx.moveTo(x, y - s * 2.1)
  ctx.quadraticCurveTo(x + s * 0.6, y - s * 1.95, x + s, y - s * 1.75)
  ctx.lineTo(x, y - s * 1.45)
  ctx.closePath()
  ctx.fill()
}

interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Petite étiquette de texte centrée au-dessus d'un point. Elle n'est pas dessinée
 * si elle chevauche une étiquette déjà posée (`taken`), pour que la scène reste
 * lisible avec beaucoup de cordées : le nom complet reste dans l'interface.
 */
function drawTag(p: Paint, x: number, y: number, s: number, text: string, taken: Box[]): void {
  const { ctx } = p
  const size = Math.max(10, s * 0.85)
  ctx.font = `600 ${size}px Nunito, ui-rounded, system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  const width = ctx.measureText(text).width + 10
  const height = size + 5
  const box = { left: x - width / 2, top: y - height, right: x + width / 2, bottom: y }
  if (taken.some((other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top)) return
  taken.push(box)
  ctx.fillStyle = 'rgba(23,18,31,0.6)'
  roundedRect(ctx, box.left, box.top, width, height, 6)
  ctx.fill()
  ctx.fillStyle = '#f4eadb'
  ctx.fillText(text, box.left + 5, box.top + height / 2)
}

/* ------------------------------------------------------------- moteur ---- */

export class SceneRenderer {
  private layout: SceneLayout = createLayout(1, 1)
  private dpr = 1
  private routes: Route[] = []
  private ridge: Point[] = []
  private stars: Star[] = []
  private clouds: Cloud[] = []
  private slopeTrees: { x: number; y: number; h: number; seed: number }[] = []
  private flakes: { x: number; y: number; z: number; w: number }[] = []
  private walkers: WalkerGroup[] = []
  private departing: Departing[] = []
  private sparks: Spark[] = []
  private climbers = new Map<string, ClimberState>()
  private input: RenderInput = { tracks: [], pendingTasks: 0, hour: 12, motion: false, variant: 'full' }
  private time = 0
  private camera = 0
  private random = seededRandom(11)
  private grain: CanvasPattern | null = null
  private grainSource: ReturnType<CanvasFactory>
  private readonly ctx: Ctx

  constructor(ctx: Ctx, canvasFactory: CanvasFactory = browserCanvasFactory) {
    this.ctx = ctx
    this.grainSource = canvasFactory(160)
    for (let i = 0; i < 4; i++) this.walkers.push(this.spawnWalkers(true))
  }

  /** Taille du cadre en pixels CSS, et densité de l'écran. */
  resize(width: number, height: number, dpr = 1): void {
    this.layout = createLayout(width, height)
    this.dpr = clamp(dpr, 1, 2)
    const canvas = this.ctx.canvas as HTMLCanvasElement | undefined
    if (canvas) {
      canvas.width = Math.round(this.layout.width * this.dpr)
      canvas.height = Math.round(this.layout.height * this.dpr)
    }
    this.grain = this.grainSource?.pattern(this.ctx) ?? null
    const { width: w, height: h } = this.layout
    this.ridge = []
    for (let x = -8; x <= w + 8; x += 3) this.ridge.push({ x, y: this.layout.ridgeY(x) })
    const random = seededRandom(7)
    this.stars = Array.from({ length: 220 }, () => ({
      x: random() * w,
      y: random() * h * 0.58,
      r: random() * 1.2 + 0.3,
      phase: random() * TAU,
      bright: random(),
    }))
    this.clouds = Array.from({ length: 6 }, () => {
      const count = 5 + Math.floor(random() * 4)
      return {
        x: random() * w * 1.4,
        y: h * (0.1 + random() * 0.26),
        scale: (0.6 + random() * 0.9) * clamp(h / 600, 0.5, 1.2),
        speed: 4 + random() * 6,
        puffs: Array.from({ length: count }, (_, j) => [j * 18 - count * 9 + random() * 8, -random() * 14, 14 + random() * 16]),
      }
    })
    this.slopeTrees = []
    for (let i = 0; i < 40; i++) {
      const x = w * (0.04 + random() * 0.94)
      const top = this.layout.ridgeY(x)
      if (top < h * 0.6) continue
      const y = top + random() * (h * 0.8 - top) * 0.8 + 6
      this.slopeTrees.push({ x, y, h: h * (0.022 + 0.026 * ((y - h * 0.6) / (h * 0.2))), seed: Math.floor(random() * 99) })
    }
    this.slopeTrees.sort((a, b) => a.y - b.y)
    this.flakes = Array.from({ length: this.input.variant === 'banner' ? 60 : 150 }, () => ({
      x: random() * w,
      y: random() * h,
      z: random(),
      w: random() * TAU,
    }))
    this.routes = buildRoutes(this.input.tracks.length, this.layout)
    // Les randonneurs déjà en route se répartissent sur toute la largeur.
    for (const group of this.walkers) if (group.x >= -1 && group.x <= 2) group.x = random() * w
  }

  setInput(input: RenderInput): void {
    const previous = this.input
    this.input = input
    if (input.tracks.length !== this.routes.length) this.routes = buildRoutes(input.tracks.length, this.layout)
    // Une tâche terminée : un randonneur quitte le poteau et part sur le sentier.
    const finished = Math.min(previous.pendingTasks, MAX_WAITING_HIKERS) - Math.min(input.pendingTasks, MAX_WAITING_HIKERS)
    if (input.motion && finished > 0) {
      const start = this.signpostX()
      for (let k = 0; k < finished; k++) {
        const slot = Math.min(previous.pendingTasks, MAX_WAITING_HIKERS) - 1 - k
        this.departing.push({ x: start - k * 14, phase: k, color: COATS[slot % COATS.length]! })
      }
    }
    const ids = new Set(input.tracks.map((track) => track.id))
    for (const id of this.climbers.keys()) if (!ids.has(id)) this.climbers.delete(id)
    for (const track of input.tracks) {
      const state = this.climbers.get(track.id)
      // Déjà en fête à l'ouverture : pas de célébration (aucune animation au chargement).
      if (!state) this.climbers.set(track.id, { shown: track.target, phase: hash(track.id.length, 2) * TAU, celebrated: track.celebrating })
      else if (!input.motion) state.shown = track.target
      if (state && !track.celebrating) state.celebrated = false
    }
  }

  /** Dessine une image ; `dt` (secondes) fait avancer les animations si elles sont permises. */
  render(dt: number): void {
    const { ctx, input } = this
    const step = input.motion ? clamp(dt, 0, 0.05) : 0
    this.time += step
    this.camera += step * 14
    const paint: Paint = { ctx, sky: skyAt(input.hour), layout: this.layout, time: this.time, motion: input.motion }
    const { width: w, height: h } = this.layout
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    drawSky(paint, this.stars)
    drawClouds(paint, this.clouds)
    for (const range of FAR_RANGES) {
      drawFarRange(paint, range, this.camera)
      drawFog(paint, h * range.base, h * 0.06, range.depth > 0.6 ? 0.33 : 0.38)
    }
    drawMainRidge(paint, this.ridge)
    for (const tree of this.slopeTrees) drawFir(paint, tree.x, tree.y, tree.h, tree.seed, false)
    drawFog(paint, h * 0.78, h * 0.04, 0.3)
    this.drawRoutes(paint, step)
    this.drawVillage(paint, step)
    this.drawSnow(paint, step)
    this.drawSparks(paint, step)

    if (this.grain) {
      ctx.save()
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = 0.09
      ctx.fillStyle = this.grain
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }
    const vignette = ctx.createRadialGradient(w / 2, h * 0.5, Math.min(w, h) * 0.35, w / 2, h * 0.5, Math.max(w, h) * 0.85)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(10,6,20,0.32)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, w, h)
  }

  /** Position affichée d'un alpiniste (pour les tests et l'accessibilité du décor). */
  shownPosition(id: string): number | undefined {
    return this.climbers.get(id)?.shown
  }

  /** Nombre de randonneurs qui attendent au poteau, et qui partent. */
  hikerCounts(): { waiting: number; departing: number } {
    return { waiting: Math.min(this.input.pendingTasks, MAX_WAITING_HIKERS), departing: this.departing.length }
  }

  private figureSize(): number {
    return clamp(this.layout.height * 0.017, 6, 13)
  }

  private signpostX(): number {
    return this.layout.width * 0.5
  }

  private drawRoutes(p: Paint, step: number): void {
    const { ctx } = p
    const tracks = this.input.tracks
    const flagSize = clamp(this.layout.height * 0.014, 6, 12)
    const size = this.figureSize()
    const full = this.input.variant === 'full'
    tracks.forEach((track, i) => {
      const route = this.routes[i]
      if (!route) return
      const color = hexToRgb(track.color)
      ctx.setLineDash(track.kind === 'goal' ? [6, 4] : [2, 5])
      ctx.strokeStyle = rgba(mixRgb(tintFor(color, p.sky, 0.2), [244, 234, 219], 0.45), 0.7)
      ctx.lineWidth = 1.6
      line(ctx, route.points)
      ctx.stroke()
      ctx.setLineDash([])
      track.marks.forEach((mark) => {
        const at = pointOnRoute(route, mark.at)
        drawFlag(p, at.x, at.y, flagSize, mark.reached, color)
      })
    })

    // Drapeau du sommet, commun à toutes les voies.
    const { peak } = this.layout
    if (tracks.length > 0) {
      ctx.strokeStyle = rgba(mixRgb(p.sky.ink, BLACK, 0.3))
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(peak.x, peak.y - 2)
      ctx.lineTo(peak.x, peak.y - 2 - flagSize * 3)
      ctx.stroke()
      ctx.fillStyle = rgba(tintFor(hexToRgb('#f0a46a'), p.sky, 0.3))
      ctx.beginPath()
      ctx.moveTo(peak.x, peak.y - 2 - flagSize * 3)
      ctx.quadraticCurveTo(peak.x + flagSize, peak.y - flagSize * 2.8 + Math.sin(p.time * 3) * 1.5, peak.x + flagSize * 1.8, peak.y - flagSize * 2.5)
      ctx.lineTo(peak.x, peak.y - 2 - flagSize * 2)
      ctx.closePath()
      ctx.fill()
    }

    const taken: Box[] = []
    tracks.forEach((track, i) => {
      const route = this.routes[i]
      const state = this.climbers.get(track.id)
      if (!route || !state) return
      const gap = track.target - state.shown
      const move = step * CLIMB_SPEED
      state.shown = Math.abs(gap) <= move ? track.target : state.shown + Math.sign(gap) * move
      const walking = Math.abs(track.target - state.shown) > 1e-4
      if (walking) state.phase += step * 9
      const at = pointOnRoute(route, state.shown)
      drawFigure(p, at.x, at.y, size, {
        color: hexToRgb(track.color),
        direction: gap < 0 ? (-at.direction as 1 | -1) : at.direction,
        phase: state.phase,
        walking,
        pennant: track.kind === 'goal',
        resting: track.resting && !walking,
      })
      if (full) drawTag(p, at.x, at.y - size * 2.9 - (track.kind === 'goal' ? size * 1.2 : 0), Math.max(7, size * 0.8), shortLabel(track.label), taken)
      if (track.celebrating && !state.celebrated && !walking && this.input.motion) {
        state.celebrated = true
        this.burst(at.x, at.y - size * 2)
      }
    })
  }

  private drawVillage(p: Paint, step: number): void {
    const { ctx, sky, layout } = p
    const { width: w, height: h } = layout
    const snowTop = tintFor(hexToRgb('#f2f1ee'), sky, 0.6)
    const snowLow = mixRgb(tintFor(hexToRgb('#dfe3ec'), sky, 0.7), sky.top, 0.12)

    ctx.beginPath()
    ctx.moveTo(-4, h)
    for (let x = -4; x <= w + 4; x += 6) ctx.lineTo(x, layout.groundY(x))
    ctx.lineTo(w + 4, h)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, h * 0.8, 0, h)
    gradient.addColorStop(0, rgba(mixRgb(snowTop, sky.light, 0.15 * sky.lightAmount)))
    gradient.addColorStop(1, rgba(snowLow))
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.beginPath()
    for (let x = -4; x <= w + 4; x += 6) {
      if (x < 0) ctx.moveTo(x, layout.groundY(x))
      else ctx.lineTo(x, layout.groundY(x))
    }
    ctx.strokeStyle = rgba(sky.light, 0.35 * sky.lightAmount)
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.fillStyle = rgba(mixRgb(snowLow, sky.top, 0.15), 0.35)
    for (let i = 0; i < 9; i++) {
      ctx.beginPath()
      ctx.ellipse(w * hash(i, 31), h * (0.84 + hash(i, 33) * 0.13), w * 0.07, h * 0.006, 0, 0, TAU)
      ctx.fill()
    }

    const cabin = clamp(Math.min(h * 0.05, w * 0.075), 12, 40)
    const bigCabin = clamp(Math.min(h * 0.075, w * 0.12), 16, 60)
    // Rangée du fond : sapins et cabanes posés sur le bord du plateau.
    const back: [number, number, 'tree' | 'cabin', number][] = [
      [0.03, 0.07, 'tree', 3],
      [0.07, 0.08, 'tree', 7],
      [0.11, 0, 'cabin', 0],
      [0.3, 0, 'cabin', 1],
      [0.37, 0.06, 'tree', 37],
      [0.42, 0.055, 'tree', 42],
      [0.56, 0, 'cabin', 2],
      [0.7, 0.065, 'tree', 70],
      [0.86, 0, 'cabin', 3],
      [0.96, 0.08, 'tree', 96],
    ]
    for (const [u, size, kind, seed] of back) {
      const x = w * u
      const y = layout.groundY(x) + h * 0.012
      if (kind === 'tree') drawFir(p, x, y, h * size, seed, true)
      else drawCabin(p, x, y, cabin, seed)
    }

    // Sentier du village et traces de pas.
    ctx.beginPath()
    for (let x = -10; x <= w + 10; x += 6) {
      if (x < -6) ctx.moveTo(x, layout.pathY(x))
      else ctx.lineTo(x, layout.pathY(x))
    }
    ctx.lineCap = 'round'
    ctx.strokeStyle = rgba(mixRgb(tintFor(hexToRgb('#cfc4b6'), sky, 0.6), sky.top, 0.08))
    ctx.lineWidth = h * 0.026
    ctx.stroke()
    ctx.strokeStyle = rgba(mixRgb(tintFor(hexToRgb('#e6ddd0'), sky, 0.5), sky.light, 0.1))
    ctx.lineWidth = h * 0.01
    ctx.stroke()
    ctx.fillStyle = rgba(tintFor(hexToRgb('#b5a99a'), sky, 0.6), 0.5)
    for (let x = 8; x < w; x += 14) ctx.fillRect(x, layout.pathY(x) - 1 + ((x / 14) % 2 ? 2 : -2), 3, 1.5)

    // Barrière et lanternes.
    ctx.strokeStyle = rgba(tintFor(hexToRgb('#5a4032'), sky, 0.6))
    ctx.lineWidth = 1.4
    for (let x = w * 0.56; x < w * 0.68; x += w * 0.022) {
      ctx.beginPath()
      ctx.moveTo(x, layout.pathY(x) - h * 0.018)
      ctx.lineTo(x, layout.pathY(x) - h * 0.034)
      ctx.stroke()
    }
    ctx.beginPath()
    for (let x = w * 0.56; x < w * 0.68; x += 6) ctx.lineTo(x, layout.pathY(x) - h * 0.03)
    ctx.stroke()
    drawLamp(p, w * 0.23, layout.pathY(w * 0.23) - h * 0.014, h * 0.04)
    drawLamp(p, w * 0.72, layout.pathY(w * 0.72) - h * 0.014, h * 0.04)

    const size = clamp(Math.min(h * 0.019, w * 0.03), 6, 14)
    // Tâches du jour : des randonneurs attendent au poteau de départ.
    const post = this.signpostX()
    drawSignpost(p, post, layout.pathY(post) - h * 0.016, size * 1.6)
    const waiting = Math.min(this.input.pendingTasks, MAX_WAITING_HIKERS)
    for (let k = 0; k < waiting; k++) {
      const row = Math.floor(k / 6)
      const x = post - size * 1.6 - (k % 6) * size * 1.25 - row * size * 0.6
      const y = layout.pathY(x) - h * 0.012 + row * size * 0.9
      drawFigure(p, x, y, size, { color: COATS[k % COATS.length]!, direction: 1, phase: k, walking: false })
    }
    this.departing = this.departing.filter((hiker) => hiker.x < w + 60)
    for (const hiker of this.departing) {
      hiker.x += step * 26
      hiker.phase += step * 9
      drawFigure(p, hiker.x, layout.pathY(hiker.x), size, { color: hiker.color, direction: 1, phase: hiker.phase, walking: true })
    }

    // Randonneurs de passage, seuls ou encordés.
    for (let g = 0; g < this.walkers.length; g++) {
      const group = this.walkers[g]!
      group.x += group.direction * group.speed * step
      if ((group.direction > 0 && group.x > w + 120) || (group.direction < 0 && group.x < -120)) {
        this.walkers[g] = this.spawnWalkers(false)
        continue
      }
      const spots = group.members.map((_, k) => {
        const x = group.x - k * group.direction * size * 1.9
        return { x, y: layout.pathY(x) + group.lane * h }
      })
      if (spots.length > 1) {
        ctx.strokeStyle = rgba(tintFor(hexToRgb('#c9a24a'), sky, 0.5), 0.8)
        ctx.lineWidth = 1
        ctx.beginPath()
        spots.forEach((spot, k) => {
          if (k === 0) ctx.moveTo(spot.x, spot.y - size * 1.3)
          else ctx.quadraticCurveTo((spot.x + spots[k - 1]!.x) / 2, spot.y - size * 0.9, spot.x, spot.y - size * 1.3)
        })
        ctx.stroke()
      }
      group.members.forEach((member, k) => {
        member.phase += step * 8
        drawFigure(p, spots[k]!.x, spots[k]!.y, size, { color: member.color, direction: group.direction, phase: member.phase, walking: this.input.motion })
      })
    }

    // Rangée de devant.
    drawRock(p, w * 0.2, h * 0.965, clamp(Math.min(h * 0.018, w * 0.03), 4, 14), 5)
    drawCabin(p, w * 0.36, h * 0.99, bigCabin, 4)
    drawCabin(p, w * 0.64, h, bigCabin * 0.9, 5)
    drawRock(p, w * 0.5, h * 0.985, clamp(Math.min(h * 0.016, w * 0.028), 4, 12), 9)
    drawFir(p, -w * 0.01, h * 1.01, h * 0.2, 11, true)
    drawFir(p, w * 0.08, h * 1.02, h * 0.13, 17, true)
    drawFir(p, w * 0.99, h * 1.01, h * 0.22, 23, true)
    drawFir(p, w * 0.9, h * 1.02, h * 0.14, 31, true)
  }

  private drawSnow(p: Paint, step: number): void {
    if (!this.input.motion) return
    const { ctx, layout } = p
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    for (const flake of this.flakes) {
      flake.y += step * (14 + flake.z * 40)
      flake.x += step * (Math.sin(this.time * 0.6 + flake.w) * 10 + 6 * flake.z)
      if (flake.y > layout.height) {
        flake.y = -4
        flake.x = this.random() * layout.width
      }
      if (flake.x > layout.width) flake.x = 0
      ctx.globalAlpha = 0.25 + flake.z * 0.6
      ctx.beginPath()
      ctx.arc(flake.x, flake.y, 0.6 + flake.z * 1.6, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private drawSparks(p: Paint, step: number): void {
    const { ctx } = p
    this.sparks = this.sparks.filter((spark) => (spark.life -= step * 0.9) > 0)
    for (const spark of this.sparks) {
      spark.vy += step * 120
      spark.x += spark.vx * step
      spark.y += spark.vy * step
      ctx.globalAlpha = spark.life
      ctx.fillStyle = spark.color
      ctx.fillRect(spark.x, spark.y, 3, 3)
    }
    ctx.globalAlpha = 1
  }

  private burst(x: number, y: number): void {
    const colors = ['#ffd27a', '#f0a46a', '#fff1d6', '#ff8a6b']
    for (let i = 0; i < 34; i++) {
      const angle = this.random() * TAU
      const speed = 40 + this.random() * 90
      this.sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60, life: 1, color: colors[i % 4]! })
    }
  }

  private spawnWalkers(initial: boolean): WalkerGroup {
    const direction: 1 | -1 = this.random() < 0.5 ? 1 : -1
    const count = 1 + Math.floor(this.random() * 3)
    const w = this.layout.width
    return {
      direction,
      speed: 10 + this.random() * 10,
      lane: (this.random() - 0.5) * 0.012,
      x: initial ? this.random() * w : direction > 0 ? -60 - this.random() * 200 : w + 60 + this.random() * 200,
      members: Array.from({ length: count }, () => ({ color: COATS[Math.floor(this.random() * COATS.length)]!, phase: this.random() * TAU })),
    }
  }
}
