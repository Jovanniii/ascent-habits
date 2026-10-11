// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeHabitProgress } from '../../../progress.ts'
import type { SceneHabit, SceneProps } from '../../../types.ts'
import { theme } from '../../theme.ts'
import { CordeeScene } from './CordeeScene.tsx'
import { fakeContext, type FakeContext } from './testing/fakeContext.ts'

const HABIT: SceneHabit = {
  id: 'a',
  label: 'Lire',
  paused: false,
  progress: computeHabitProgress({
    currentDurationDays: 3,
    bestDurationDays: 3,
    previousBestDurationDays: 0,
    bestDurationBeforeToday: 3,
    today: 'done',
    lastScheduledDay: 'validated',
  }),
}

const PROPS: SceneProps = { habits: [HABIT], goals: [], pendingTasks: 2, hour: 16.5, variant: 'full', motionAllowed: true }

let fake: FakeContext
let frames: FrameRequestCallback[]

beforeEach(() => {
  fake = fakeContext()
  frames = []
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => fake.ctx) as never)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('grand décor', () => {
  it('est déclaré par le thème, décoratif et sans interaction', () => {
    expect(theme.Scene).toBe(CordeeScene)
    const { container } = render(<CordeeScene {...PROPS} />)
    const root = container.firstElementChild!
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root).toHaveAttribute('data-variant', 'full')
    expect(root).toHaveAttribute('data-tracks', '1')
    expect(root).toHaveAttribute('data-waiting', '2')
    expect(root.querySelector('a, button, input, select')).toBeNull()
  })

  it('anime la scène en continu quand les animations sont permises', () => {
    const { unmount } = render(<CordeeScene {...PROPS} />)
    const drawnAtMount = fake.calls.get('fill') ?? 0
    expect(drawnAtMount).toBeGreaterThan(0)
    expect(frames).toHaveLength(1)
    act(() => frames.shift()!(performance.now() + 16))
    expect(fake.calls.get('fill')).toBeGreaterThan(drawnAtMount)
    expect(frames).toHaveLength(1)
    unmount()
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })

  it('dessine une image fixe sans animation, et la redessine quand les données changent', () => {
    const { rerender, container } = render(<CordeeScene {...PROPS} motionAllowed={false} />)
    expect(frames).toHaveLength(0)
    expect(container.firstElementChild).toHaveAttribute('data-motion', 'off')
    const before = fake.calls.get('fill') ?? 0
    rerender(<CordeeScene {...PROPS} motionAllowed={false} hour={23} pendingTasks={30} />)
    expect(fake.calls.get('fill')).toBeGreaterThan(before)
    expect(container.firstElementChild).toHaveAttribute('data-waiting', '12')
  })

  it('reste vide sans erreur si le navigateur ne fournit pas de canevas', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => null) as never)
    const { container } = render(<CordeeScene {...PROPS} motionAllowed={false} />)
    expect(container.querySelector('canvas')).not.toBeNull()
  })
})
