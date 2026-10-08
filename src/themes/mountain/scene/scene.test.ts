import { describe, expect, it } from 'vitest'
import { computeHabitProgress } from '../../progress.ts'
import { pointAlong } from '../geometry.ts'
import {
  PANORAMA_HEIGHT,
  ROW_PADDING,
  TILE_STEP,
  TILE_WIDTH,
  rowWidth,
  starField,
  tilePeakY,
  tileTrail,
  tileX,
} from './panoramaGeometry.ts'
import { climberAssetFor, poseFor } from './poses.ts'

describe('géométrie du panorama', () => {
  it('place les montagnes côte à côte, avec un léger chevauchement', () => {
    expect(rowWidth(1)).toBe(ROW_PADDING * 2 + TILE_WIDTH)
    expect(rowWidth(3)).toBe(ROW_PADDING * 2 + TILE_STEP * 2 + TILE_WIDTH)
    expect(rowWidth(0)).toBe(rowWidth(1))
    expect(tileX(1) - tileX(0)).toBe(TILE_STEP)
    expect(TILE_STEP).toBeLessThan(TILE_WIDTH)
  })

  it('élève la montagne avec le cycle, avec une hauteur plafonnée', () => {
    expect(tilePeakY(1)).toBeGreaterThan(tilePeakY(2))
    expect(tilePeakY(3)).toBe(tilePeakY(9))
  })

  it.each([1, 2, 3])('fait monter le sentier du pied au sommet de sa montagne (cycle %i)', (cycle) => {
    const trail = tileTrail(tileX(2), cycle)
    expect(trail[0]!.y).toBeGreaterThan(PANORAMA_HEIGHT - 15)
    expect(trail.at(-1)!.y).toBeLessThan(tilePeakY(cycle) + 3)
    for (let i = 1; i < trail.length; i += 1) expect(trail[i]!.y).toBeLessThan(trail[i - 1]!.y)
    for (const point of trail) {
      expect(point.x).toBeGreaterThan(tileX(2))
      expect(point.x).toBeLessThan(tileX(2) + TILE_WIDTH)
    }
    const end = pointAlong(trail, 1)
    expect(end.x).toBeCloseTo(trail.at(-1)!.x)
    expect(end.y).toBeCloseTo(trail.at(-1)!.y)
  })

  it('répartit des étoiles de façon stable dans le ciel', () => {
    const stars = starField(12, 400, 70)
    expect(stars).toEqual(starField(12, 400, 70))
    expect(stars.filter((star) => star.twinkle)).toHaveLength(3)
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThanOrEqual(400)
      expect(star.y).toBeLessThanOrEqual(70)
    }
    expect(starField(5, 10, 10, 0).some((star) => star.twinkle)).toBe(false)
    expect(starField(-1, 10, 10)).toEqual([])
  })
})

describe('pose et illustration de l’alpiniste', () => {
  const base = {
    currentDurationDays: 3,
    bestDurationDays: 3,
    previousBestDurationDays: 0,
    bestDurationBeforeToday: 3,
    today: 'pending' as const,
    lastScheduledDay: 'validated' as const,
  }

  it('associe chaque état neutre à une pose et à un état illustré', () => {
    const cases = [
      [{}, 'rest', 'climber-rest'],
      [{ today: 'done' as const, currentDurationDays: 4, bestDurationDays: 4 }, 'walk', 'climber-walk'],
      [{ lastScheduledDay: 'recoverable' as const }, 'bivouac', 'climber-recovery'],
      [{ lastScheduledDay: 'missed' as const }, 'tent', 'climber-tent'],
      [{ today: 'done' as const, currentDurationDays: 21, bestDurationDays: 21, bestDurationBeforeToday: 20 }, 'celebrate', 'climber-celebrate'],
    ] as const
    for (const [input, pose, asset] of cases) {
      const progress = computeHabitProgress({ ...base, ...input })
      expect(poseFor(progress)).toBe(pose)
      expect(climberAssetFor(progress)).toBe(asset)
    }
  })

  it('montre l’alpiniste au sommet, prêt à repartir, au bout du cycle', () => {
    expect(climberAssetFor({ state: 'done', position: 1 })).toBe('climber-summit')
    expect(climberAssetFor({ state: 'idle', position: 1 })).toBe('climber-summit')
    expect(climberAssetFor({ state: 'celebrating', position: 1 })).toBe('climber-celebrate')
  })
})
