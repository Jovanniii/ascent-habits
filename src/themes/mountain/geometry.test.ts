import { describe, expect, it } from 'vitest'
import { HEIGHT_VARIANTS, VIEWBOX_HEIGHT, peakY, pointAlong, trailPath, trailPoints } from './geometry.ts'

describe('géométrie du panorama', () => {
  it('rend la montagne plus haute au fil des cycles, avec une hauteur plafonnée', () => {
    expect(peakY(1)).toBeGreaterThan(peakY(2))
    expect(peakY(2)).toBeGreaterThan(peakY(3))
    expect(peakY(HEIGHT_VARIANTS + 5)).toBe(peakY(HEIGHT_VARIANTS))
    expect(peakY(0)).toBe(peakY(1))
  })

  it('fait monter le sentier du pied jusqu’au sommet', () => {
    for (const cycle of [1, 2, 3]) {
      const trail = trailPoints(cycle)
      expect(trail[0]!.y).toBeGreaterThan(VIEWBOX_HEIGHT - 8)
      expect(trail.at(-1)!.y).toBeLessThan(peakY(cycle) + 5)
    }
  })

  it('place un point le long du sentier, en restant dans les bornes', () => {
    const trail = trailPoints(1)
    const near = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      expect(a.x).toBeCloseTo(b.x)
      expect(a.y).toBeCloseTo(b.y)
    }
    near(pointAlong(trail, 0), trail[0]!)
    near(pointAlong(trail, 1), trail.at(-1)!)
    near(pointAlong(trail, -3), trail[0]!)
    near(pointAlong(trail, 7), trail.at(-1)!)
    near(pointAlong(trail, Number.NaN), trail[0]!)
    // L'altitude ne fait que monter, à quelques zigzags horizontaux près.
    let lastY = Infinity
    for (let t = 0; t <= 1; t += 0.05) {
      const { y } = pointAlong(trail, t)
      expect(y).toBeLessThanOrEqual(lastY + 1e-9)
      lastY = y
    }
    expect(pointAlong([], 0.5)).toEqual({ x: 0, y: 0 })
  })

  it('décrit le sentier en SVG', () => {
    expect(trailPath([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe('M1.0 2.0 L3.0 4.0')
  })
})
