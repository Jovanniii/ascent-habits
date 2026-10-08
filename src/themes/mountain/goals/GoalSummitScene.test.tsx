// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { computeGoalProgress, type Milestone } from '../../../engine/index.ts'
import type { GoalSceneProps } from '../../types.ts'
import { theme } from '../theme.ts'
import { GoalSummitScene } from './GoalSummitScene.tsx'

afterEach(cleanup)

function milestones(done: number, total: number): Milestone[] {
  return Array.from({ length: total }, (_, i) => ({
    id: `m${i}`,
    goalId: 'g1',
    name: `Jalon ${i + 1}`,
    status: i < done ? 'done' : 'todo',
    createdAt: '2026-10-01T08:00:00.000Z',
  }))
}

function scene(done: number, total: number, extra: Partial<GoalSceneProps> = {}) {
  const props: GoalSceneProps = {
    progress: computeGoalProgress('g1', milestones(done, total)),
    achieved: false,
    celebrating: false,
    motionAllowed: true,
    ...extra,
  }
  return render(<GoalSummitScene {...props} />).container.querySelector('svg')!
}

describe('GoalSummitScene', () => {
  it('est déclarée par le thème et purement décorative', () => {
    expect(theme.GoalScene).toBe(GoalSummitScene)
    const svg = scene(1, 3)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg.querySelector('a, button, input, [tabindex]')).toBeNull()
  })

  it('plante un fanion par jalon terminé', () => {
    const svg = scene(2, 5)
    expect(svg.querySelectorAll('.goal-summit__pennant')).toHaveLength(5)
    expect(svg.querySelectorAll('.goal-summit__pennant.is-planted')).toHaveLength(2)
  })

  it('ne fait pas reculer l’alpiniste quand un jalon est ajouté', () => {
    const before = scene(2, 3)
    const climber = before.getAttribute('data-climber')
    const summit = Number(before.getAttribute('data-summit'))
    cleanup()
    const after = scene(2, 4)
    expect(after.getAttribute('data-climber')).toBe(climber)
    expect(Number(after.getAttribute('data-summit'))).toBeGreaterThan(summit)
  })

  it('place l’alpiniste au sommet une fois l’objectif atteint, et coupe les animations si demandé', () => {
    const svg = scene(3, 3, { achieved: true, celebrating: true, motionAllowed: false })
    expect(svg.getAttribute('data-climber')).toBe(svg.getAttribute('data-summit'))
    expect(svg).toHaveAttribute('data-celebrating', 'true')
    expect(svg).toHaveAttribute('data-motion', 'off')
  })
})
