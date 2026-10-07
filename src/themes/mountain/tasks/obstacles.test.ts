import { describe, expect, it } from 'vitest'
import { OBSTACLE_VARIANTS, obstacleVariant } from './obstacles.ts'

describe('obstacleVariant', () => {
  it('donne toujours la même variante pour un même identifiant', () => {
    for (const id of ['t1', 'abc', '0f6c1a2e-6b1d-4d3e-9a51-3c1f1d8e2b7a', '']) {
      expect(obstacleVariant(id)).toBe(obstacleVariant(id))
      expect(OBSTACLE_VARIANTS).toContain(obstacleVariant(id))
    }
  })

  it('ne dépend que de l’identifiant (valeurs de référence figées)', () => {
    // Si ces valeurs changent, les obstacles de toutes les tâches existantes changent aussi.
    expect(['t0', 't1', 't2', 't3'].map(obstacleVariant)).toEqual(['low-cloud', 'branch', 'scree', 'rock'])
  })

  it('utilise toutes les variantes sur un ensemble d’identifiants', () => {
    const counts = new Map<string, number>()
    for (let i = 0; i < 400; i += 1) {
      const variant = obstacleVariant(`task-${i}`)
      counts.set(variant, (counts.get(variant) ?? 0) + 1)
    }
    expect([...counts.keys()].sort()).toEqual([...OBSTACLE_VARIANTS].sort())
    for (const count of counts.values()) expect(count).toBeGreaterThan(50)
  })
})
