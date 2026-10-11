import { describe, expect, it } from 'vitest'
import { MAX_WAITING_HIKERS, SceneRenderer, browserCanvasFactory, type RenderInput } from './renderer.ts'
import { fakeContext } from './testing/fakeContext.ts'
import type { Track } from './tracks.ts'

function track(id: string, target: number, extra: Partial<Track> = {}): Track {
  return {
    id,
    kind: 'habit',
    label: `Cordée ${id}`,
    color: '#d9573b',
    target,
    marks: [
      { at: 0.24, reached: target >= 0.24, label: '21 j' },
      { at: 0.48, reached: false, label: '2 mois' },
    ],
    resting: false,
    celebrating: false,
    ...extra,
  }
}

function input(extra: Partial<RenderInput> = {}): RenderInput {
  return { tracks: [track('a', 0.3), track('b', 0.1, { kind: 'goal' })], pendingTasks: 3, hour: 16.5, motion: true, variant: 'full', ...extra }
}

function setup(first: RenderInput = input()) {
  const fake = fakeContext()
  const renderer = new SceneRenderer(fake.ctx, () => ({ pattern: (ctx) => ctx.createPattern({} as CanvasImageSource, 'repeat') }))
  renderer.setInput(first)
  renderer.resize(390, 560, 3)
  return { fake, renderer }
}

describe('rendu de la scène', () => {
  it('dimensionne le canevas selon la densité de l’écran (au plus 2)', () => {
    const { fake } = setup()
    expect(fake.canvas).toEqual({ width: 780, height: 1120 })
  })

  it.each([0, 4, 7, 12.5, 16.5, 18.5, 20.5, 23.5])('dessine la scène complète à %s h', (hour) => {
    const { fake, renderer } = setup(input({ hour }))
    renderer.render(0.016)
    expect(fake.calls.get('fill')).toBeGreaterThan(100)
    expect(fake.calls.get('arc')).toBeGreaterThan(10)
  })

  it('écrit le nom des cordées en plein écran seulement', () => {
    const full = setup()
    full.renderer.render(0)
    expect(full.fake.texts).toEqual(['Cordée a', 'Cordée b'])
    const banner = setup(input({ variant: 'banner' }))
    banner.renderer.render(0)
    expect(banner.fake.texts).toEqual([])
  })

  it('n’écrit pas deux noms l’un sur l’autre', () => {
    const { fake, renderer } = setup(input({ tracks: [track('a', 0.2), track('a2', 0.2)] }))
    // Deux voies voisines sur un cadre étroit : les plaques se chevaucheraient.
    renderer.resize(120, 560)
    renderer.render(0)
    expect(fake.texts.length).toBeLessThanOrEqual(2)
  })

  it('fait monter l’alpiniste progressivement quand les animations sont permises', () => {
    const { renderer } = setup()
    renderer.setInput(input({ tracks: [track('a', 0.6), track('b', 0.1, { kind: 'goal' })] }))
    renderer.render(0.05)
    const moving = renderer.shownPosition('a')!
    expect(moving).toBeGreaterThan(0.3)
    expect(moving).toBeLessThan(0.6)
    for (let i = 0; i < 400; i++) renderer.render(0.05)
    expect(renderer.shownPosition('a')).toBe(0.6)
    // Une correction (jalon décoché) le fait redescendre de la même façon.
    renderer.setInput(input({ tracks: [track('a', 0.5), track('b', 0.1)] }))
    renderer.render(0.05)
    expect(renderer.shownPosition('a')).toBeLessThan(0.6)
  })

  it('place l’alpiniste directement sans animation, et oublie les cordées supprimées', () => {
    const { renderer } = setup(input({ motion: false }))
    renderer.setInput(input({ motion: false, tracks: [track('a', 0.9)] }))
    renderer.render(1)
    expect(renderer.shownPosition('a')).toBe(0.9)
    expect(renderer.shownPosition('b')).toBeUndefined()
  })

  it('fait partir un randonneur du village quand une tâche est terminée', () => {
    const { renderer } = setup()
    expect(renderer.hikerCounts()).toEqual({ waiting: 3, departing: 0 })
    renderer.setInput(input({ pendingTasks: 1 }))
    expect(renderer.hikerCounts()).toEqual({ waiting: 1, departing: 2 })
    // Ils quittent la scène par le sentier.
    for (let i = 0; i < 600; i++) renderer.render(0.05)
    expect(renderer.hikerCounts().departing).toBe(0)
  })

  it('limite les randonneurs qui attendent pour garder la scène lisible', () => {
    const { renderer } = setup(input({ pendingTasks: 40 }))
    expect(renderer.hikerCounts().waiting).toBe(MAX_WAITING_HIKERS)
    renderer.render(0)
    // Sans animation, une tâche terminée ne déclenche aucun départ.
    renderer.setInput(input({ pendingTasks: 0, motion: false }))
    expect(renderer.hikerCounts()).toEqual({ waiting: 0, departing: 0 })
  })

  it('célèbre une seule fois un palier atteint', () => {
    const { fake, renderer } = setup(input({ tracks: [track('a', 0.3)] }))
    renderer.setInput(input({ tracks: [track('a', 0.3, { celebrating: true })] }))
    renderer.render(0.016)
    const before = fake.calls.get('fillRect') ?? 0
    renderer.render(0.016)
    const sparks = (fake.calls.get('fillRect') ?? 0) - before
    expect(sparks).toBeGreaterThan(30)
    for (let i = 0; i < 80; i++) renderer.render(0.05)
    const settled = fake.calls.get('fillRect') ?? 0
    renderer.render(0.016)
    expect((fake.calls.get('fillRect') ?? 0) - settled).toBeLessThan(sparks)
    // Plus de célébration une fois l'état revenu à la normale.
    renderer.setInput(input({ tracks: [track('a', 0.3)] }))
    renderer.render(0.016)
  })

  it('dessine les randonneurs au repos et les alpinistes qui se reposent', () => {
    const { fake, renderer } = setup(input({ tracks: [track('a', 0.3, { resting: true })], hour: 2 }))
    renderer.render(0.016)
    expect(fake.calls.get('ellipse')).toBeGreaterThan(10)
  })

  it('fait vivre la scène longtemps sans erreur (randonneurs qui passent et reviennent)', () => {
    const { renderer } = setup()
    for (let i = 0; i < 2000; i++) renderer.render(0.05)
    expect(renderer.shownPosition('a')).toBe(0.3)
  })

  it('n’a pas de grain de papier hors navigateur', () => {
    expect(browserCanvasFactory(16)).toBeNull()
    const fake = fakeContext()
    const renderer = new SceneRenderer(fake.ctx, () => null)
    renderer.resize(200, 300)
    renderer.render(0)
    expect(fake.calls.get('createPattern')).toBeUndefined()
  })
})
