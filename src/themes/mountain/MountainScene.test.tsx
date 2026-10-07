// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { computeHabitProgress, type ProgressInput } from '../progress.ts'
import type { HabitSceneProps } from '../types.ts'
import { MountainScene } from './MountainScene.tsx'
import { theme } from './theme.ts'

afterEach(cleanup)

function props(input: Partial<ProgressInput> = {}, extra: Partial<HabitSceneProps> = {}): HabitSceneProps {
  const current = input.currentDurationDays ?? 0
  return {
    progress: computeHabitProgress({
      currentDurationDays: current,
      bestDurationDays: current,
      previousBestDurationDays: 0,
      bestDurationBeforeToday: current,
      today: 'pending',
      lastScheduledDay: 'validated',
      ...input,
    }),
    gesture: null,
    motionAllowed: true,
    index: 0,
    ...extra,
  }
}

function scene(p: HabitSceneProps) {
  return render(<MountainScene {...p} />).container.querySelector('svg')!
}

describe('MountainScene', () => {
  it('est déclarée par le thème et purement décorative', () => {
    expect(theme.HabitScene).toBe(MountainScene)
    expect(theme.isDefault).toBe(true)
    const svg = scene(props())
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg.querySelector('a, button, input, [tabindex]')).toBeNull()
  })

  it('donne des identifiants de dégradé uniques à chaque panorama', () => {
    const { container } = render(
      <>
        <MountainScene {...props()} />
        <MountainScene {...props()} />
      </>,
    )
    const ids = [...container.querySelectorAll('linearGradient')].map((gradient) => gradient.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('reflète l’état, le cycle et le décor', () => {
    const svg = scene(props({ currentDurationDays: 400, today: 'done' }))
    expect(svg.dataset).toMatchObject({ state: 'done', cycle: '2', decor: 'year1' })
  })

  it('dessine les étapes atteintes et à venir', () => {
    const svg = scene(props({ currentDurationDays: 70 }))
    // Départ + 3 étapes du premier cycle (le sommet a son drapeau).
    expect(svg.querySelectorAll('.mountain-scene__camp')).toHaveLength(4)
    expect(svg.querySelectorAll('.mountain-scene__camp.is-reached')).toHaveLength(3)
  })

  it('montre la tente pour un jour manqué, sans flamme', () => {
    const svg = scene(props({ bestDurationDays: 30, previousBestDurationDays: 30, lastScheduledDay: 'missed' }))
    expect(svg.querySelector('.mountain-scene__resting')).not.toBeNull()
    expect(svg.querySelector('.mountain-scene__flame')).toBeNull()
  })

  it('n’affiche pas de flamme sans série, et une flamme dès la première validation', () => {
    expect(scene(props()).querySelector('.mountain-scene__flame')).toBeNull()
    cleanup()
    expect(scene(props({ currentDurationDays: 1, today: 'done' })).querySelector('.mountain-scene__flame')).not.toBeNull()
  })

  it('n’anime que les gestes de l’utilisateur, et rien si les animations sont réduites', () => {
    const idle = scene(props())
    expect(idle.querySelector('.mountain-scene__climber')).toHaveAttribute('data-gesture', 'none')
    expect(idle.querySelector('.mountain-scene__position')).toHaveAttribute('data-animate', 'false')
    cleanup()

    const checked = scene(props({ currentDurationDays: 1, today: 'done' }, { gesture: { kind: 'checked', id: 1 } }))
    expect(checked.querySelector('.mountain-scene__climber')).toHaveAttribute('data-gesture', 'checked')
    expect(checked.querySelector('.mountain-scene__position')).toHaveAttribute('data-animate', 'true')
    expect(checked).toHaveAttribute('data-motion', 'on')
    cleanup()

    const reduced = scene(props({}, { motionAllowed: false, gesture: { kind: 'checked', id: 2 } }))
    expect(reduced).toHaveAttribute('data-motion', 'off')
  })

  it('ne décale pas les animations de geste (décalage réservé à la respiration)', () => {
    const svg = scene(props({ currentDurationDays: 1, today: 'done' }, { gesture: { kind: 'checked', id: 1 }, index: 3 }))
    const climber = svg.querySelector('.mountain-scene__climber') as SVGGElement
    expect(climber.style.animationDelay).toBe('')
    expect(climber.style.getPropertyValue('--mountain-breath-delay')).toBe('-2100ms')
  })

  it('positionne l’alpiniste par une transformation CSS (animable), jamais par SMIL', () => {
    const svg = scene(props({ currentDurationDays: 40 }))
    expect((svg.querySelector('.mountain-scene__position') as SVGGElement).style.transform).toMatch(/^translate\(/)
    expect(svg.querySelector('animate, animateTransform, animateMotion')).toBeNull()
  })
})
