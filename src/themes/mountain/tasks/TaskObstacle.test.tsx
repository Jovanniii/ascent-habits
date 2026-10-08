// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { theme } from '../theme.ts'
import { obstacleVariant } from './obstacles.ts'
import { TaskObstacle } from './TaskObstacle.tsx'

afterEach(cleanup)

function obstacle(taskId: string, clearing = false, motionAllowed = true) {
  return render(<TaskObstacle taskId={taskId} clearing={clearing} motionAllowed={motionAllowed} />).container.querySelector(
    'svg',
  )!
}

describe('TaskObstacle', () => {
  it('est déclaré par le thème et purement décoratif', () => {
    expect(theme.TaskIllustration).toBe(TaskObstacle)
    const svg = obstacle('t1')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg.querySelector('a, button, input, [tabindex]')).toBeNull()
  })

  it('dessine la variante choisie à partir de l’identifiant', () => {
    for (const id of ['t0', 't1', 't2', 't3']) {
      expect(obstacle(id)).toHaveAttribute('data-variant', obstacleVariant(id))
      cleanup()
    }
  })

  it('signale le dégagement et l’état des animations à la feuille de style', () => {
    const svg = obstacle('t1', true, false)
    expect(svg).toHaveAttribute('data-clearing', 'true')
    expect(svg).toHaveAttribute('data-motion', 'off')
  })
})
