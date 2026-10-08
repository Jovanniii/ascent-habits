// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DayPeriodContext, type DayPeriod } from '../../ambiance.ts'
import { computeHabitProgress, type ProgressInput } from '../../progress.ts'
import type { PanoramaHabit } from '../../types.ts'
import { MountainScene } from '../MountainScene.tsx'
import { GoalSummitScene } from '../goals/GoalSummitScene.tsx'
import { theme } from '../theme.ts'
import { Panorama } from './Panorama.tsx'
import { PARALLAX_ROOM_VAR, PARALLAX_SCROLL_VAR } from './useParallax.ts'

afterEach(cleanup)

function habit(id: string, input: Partial<ProgressInput> = {}): PanoramaHabit {
  const current = input.currentDurationDays ?? 0
  return {
    id,
    label: `Habitude ${id}`,
    progress: computeHabitProgress({
      currentDurationDays: current,
      bestDurationDays: current,
      previousBestDurationDays: 0,
      bestDurationBeforeToday: current,
      today: 'pending',
      lastScheduledDay: 'validated',
      ...input,
    }),
  }
}

const HABITS = [habit('a', { currentDurationDays: 3, today: 'done' }), habit('b'), habit('c', { lastScheduledDay: 'missed' })]

function renderPanorama(motionAllowed = true, period: DayPeriod = 'day', habits = HABITS) {
  const result = render(
    <DayPeriodContext value={period}>
      <Panorama habits={habits} motionAllowed={motionAllowed} />
    </DayPeriodContext>,
  )
  return result.container.querySelector<HTMLElement>('.mountain-panorama')!
}

describe('Panorama', () => {
  it('est déclaré par le thème, décoratif et sans aucune interaction', () => {
    expect(theme.Panorama).toBe(Panorama)
    expect(theme.followsAmbiance).toBe(true)
    const root = renderPanorama()
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root.querySelector('a, button, input, select, [tabindex]:not([tabindex="-1"])')).toBeNull()
  })

  it('montre toutes les montagnes côte à côte, chacune avec son alpiniste et son nom', () => {
    const root = renderPanorama()
    const mountains = root.querySelectorAll('.mountain-panorama__mountain')
    expect([...mountains].map((m) => m.getAttribute('data-habit'))).toEqual(['a', 'b', 'c'])
    expect(root.querySelectorAll('.mountain-panorama__climber')).toHaveLength(3)
    expect(root.querySelector('[data-habit="c"] .mountain-scene__figure.is-tent')).not.toBeNull()
    expect([...root.querySelectorAll('.mountain-panorama__label text')].map((t) => t.textContent)).toEqual([
      'Habitude a',
      'Habitude b',
      'Habitude c',
    ])
  })

  it('raccourcit les noms trop longs sur la plaque', () => {
    const root = renderPanorama(true, 'day', [{ ...habit('long'), label: 'Méditer dix minutes chaque matin' }])
    expect(root.querySelector('.mountain-panorama__label text')?.textContent).toBe('Méditer dix m…')
  })

  it('suit l’ambiance : palette, nuages qui dérivent le jour, étoiles qui scintillent la nuit', () => {
    const day = renderPanorama(true, 'day')
    expect(day).toHaveAttribute('data-ambiance', 'day')
    expect(day.style.getPropertyValue('--mountain-sky-top')).toBe('#bcd4ee')
    expect(day.querySelector('.mountain-sky__clouds')).toHaveAttribute('data-drift', 'true')
    expect(day.querySelector('.mountain-sky__stars')).toHaveAttribute('data-twinkle', 'false')
    cleanup()

    const night = renderPanorama(true, 'night')
    expect(night.style.getPropertyValue('--mountain-star-opacity')).toBe('1')
    // Une seule animation d'ambiance à la fois.
    expect(night.querySelector('.mountain-sky__clouds')).toHaveAttribute('data-drift', 'false')
    expect(night.querySelector('.mountain-sky__stars')).toHaveAttribute('data-twinkle', 'true')
  })

  it('expose le défilement aux plans lointains (parallaxe) quand les animations sont permises', () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback))
    const root = renderPanorama(true)
    expect(root).toHaveAttribute('data-motion', 'on')
    const scroller = root.querySelector<HTMLElement>('.mountain-panorama__scroller')!
    scroller.scrollLeft = 120
    scroller.dispatchEvent(new Event('scroll'))
    scroller.dispatchEvent(new Event('scroll'))
    // Une seule écriture par image, même avec plusieurs évènements de défilement.
    expect(frames).toHaveLength(1)
    act(() => frames[0]!(0))
    expect(root.style.getPropertyValue(PARALLAX_SCROLL_VAR)).toBe('120')
    expect(root.style.getPropertyValue(PARALLAX_ROOM_VAR)).not.toBe('')
  })

  it('n’anime rien et ne suit pas le défilement quand la réduction est demandée', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const root = renderPanorama(false, 'night')
    expect(root).toHaveAttribute('data-motion', 'off')
    const scroller = root.querySelector<HTMLElement>('.mountain-panorama__scroller')!
    scroller.scrollLeft = 200
    scroller.dispatchEvent(new Event('scroll'))
    expect(raf).not.toHaveBeenCalled()
    expect(root.style.getPropertyValue(PARALLAX_SCROLL_VAR)).toBe('')
  })

  it('coupe le parallaxe en direct si la réduction est demandée après l’ouverture', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    const { container, rerender } = render(<Panorama habits={HABITS} motionAllowed />)
    const root = container.querySelector<HTMLElement>('.mountain-panorama')!
    expect(root.style.getPropertyValue(PARALLAX_SCROLL_VAR)).toBe('0')
    rerender(<Panorama habits={HABITS} motionAllowed={false} />)
    expect(root).toHaveAttribute('data-motion', 'off')
    expect(root.style.getPropertyValue(PARALLAX_SCROLL_VAR)).toBe('')
  })
})

describe('scène du jour et ambiance', () => {
  it('applique la palette du moment et garde le ciel immobile', () => {
    const { container } = render(
      <DayPeriodContext value="evening">
        <MountainScene progress={habit('a').progress} gesture={null} motionAllowed index={0} />
      </DayPeriodContext>,
    )
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('data-ambiance', 'evening')
    expect(svg.style.getPropertyValue('--mountain-sky-top')).toBe('#6c5b9e')
    expect(svg.querySelector('.mountain-sky__clouds')).toHaveAttribute('data-drift', 'false')
    expect(svg.querySelector('.mountain-sky__stars')).toHaveAttribute('data-twinkle', 'false')
  })

  // Le repli sur les formes provisoires est testé dans assets/assets.test.tsx.
  it('affiche les illustrations livrées dans la lumière du moment', () => {
    const { container } = render(<MountainScene progress={habit('a').progress} gesture={null} motionAllowed index={0} />)
    expect(container.querySelector('svg')).toHaveAttribute('data-ambiance', 'day')
    expect(container.querySelector('[data-asset="plane-1-day"]')).not.toBeNull()
    expect(container.querySelector('[data-asset="plane-2-day"]')).not.toBeNull()
    expect(container.querySelector('.mountain-scene__figure.is-rest [data-asset="climber-rest"]')).not.toBeNull()
  })

  it('habille aussi le sommet d’objectif selon l’ambiance', () => {
    const { container } = render(
      <DayPeriodContext value="night">
        <GoalSummitScene progress={{ done: 1, total: 3, ratio: 1 / 3, percent: 33, allDone: false }} achieved={false} celebrating={false} motionAllowed />
      </DayPeriodContext>,
    )
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('data-ambiance', 'night')
    expect(svg.style.getPropertyValue('--mountain-sky-top')).toBe('#1f2a4d')
  })
})
