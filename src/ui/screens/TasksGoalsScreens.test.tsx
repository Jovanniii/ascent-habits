// @vitest-environment jsdom
import { reducedMotion } from '../testing/setup.ts'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyAppData, type AppData, type Goal, type Milestone, type Task } from '../../engine/index.ts'
import { createMemoryRepository } from '../../storage/index.ts'
import { THEMES, type Theme } from '../../themes/index.ts'
import { App } from '../App.tsx'

// Dimanche 4 octobre 2026, 10 h, heure locale.
const now = () => new Date(2026, 9, 4, 10, 0)

const illustrated = THEMES.find((theme) => theme.TaskIllustration && theme.GoalScene)
const plain = THEMES.find((theme) => !theme.TaskIllustration && !theme.GoalScene)

const tasks: Task[] = [
  // Échéance passée : rendu neutre, comme les autres.
  { id: 't0', name: 'Une', status: 'todo', dueDate: '2026-10-01', createdAt: '2026-10-01T08:00:00.000Z' },
  { id: 't1', name: 'Deux', status: 'todo', createdAt: '2026-10-02T08:00:00.000Z' },
  { id: 't2', name: 'Trois', status: 'todo', createdAt: '2026-10-03T08:00:00.000Z' },
]

const goal: Goal = { id: 'g1', name: 'Courir 10 km', status: 'active', createdAt: '2026-10-01T08:00:00.000Z' }
const milestones: Milestone[] = ['5 km', '8 km'].map((name, i) => ({
  id: `m${i}`,
  goalId: 'g1',
  name,
  status: 'done',
  createdAt: `2026-10-0${i + 1}T08:00:00.000Z`,
}))

function dataFor(theme: Theme, overrides: Partial<AppData> = {}): AppData {
  return { ...createEmptyAppData({ themeId: theme.id, animationsEnabled: true }), ...overrides }
}

async function renderApp(data: AppData, tab: 'Tâches' | 'Objectifs') {
  const repository = createMemoryRepository(data)
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<App repository={repository} now={now} />)
  await user.click(await screen.findByRole('button', { name: tab }))
  return { repository, user }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('écrans Tâches et Objectifs selon le thème', () => {
  it('dispose d’un thème illustré et d’un thème sobre', () => {
    expect(illustrated).toBeDefined()
    expect(plain).toBeDefined()
  })

  it.each(THEMES.map((theme) => [theme.name, theme] as const))(
    '%s : la case à cocher d’une tâche garde le même nom, le même rôle et le même clavier',
    async (_name, theme) => {
      const { user } = await renderApp(dataFor(theme, { tasks }), 'Tâches')
      const todo = screen.getByRole('region', { name: 'À faire' })
      const items = within(todo).getAllByRole('listitem')
      expect(items).toHaveLength(3)
      for (const item of items) {
        // L'illustration, s'il y en a une, est décorative et ne contient rien d'interactif.
        const art = item.querySelector('svg[aria-hidden="true"]')
        if (theme.TaskIllustration) expect(art).not.toBeNull()
        expect(within(item).getAllByRole('checkbox')).toHaveLength(1)
        expect(item.querySelectorAll('a, input, button, [tabindex]')).toHaveLength(2)
      }
      // Une tâche dont l'échéance est passée n'est pas signalée différemment.
      expect(items[0]!.className).toBe(items[1]!.className)
      expect(within(items[0]!).queryByText(/retard/i)).toBeNull()

      const checkbox = screen.getByRole('checkbox', { name: 'Deux' })
      checkbox.focus()
      await user.keyboard(' ')
      expect(screen.getByRole('checkbox', { name: 'Deux' })).toBeChecked()
      expect(screen.getByText('Terminées (1)')).toBeInTheDocument()
      await vi.waitFor(() => expect(screen.getByRole('checkbox', { name: 'Trois' })).toHaveFocus())
    },
  )

  it('joue le dégagement un instant, masqué aux lecteurs d’écran, puis retire la copie', async () => {
    const { user } = await renderApp(dataFor(illustrated!, { tasks }), 'Tâches')
    await user.click(screen.getByRole('checkbox', { name: 'Deux' }))

    const todo = screen.getByRole('region', { name: 'À faire' })
    const copy = todo.querySelector('li[aria-hidden="true"]')
    expect(copy).not.toBeNull()
    expect(copy).toHaveTextContent('Deux')
    expect(copy!.querySelector('input, button, a, [tabindex]')).toBeNull()
    expect(within(todo).queryByRole('checkbox', { name: 'Deux' })).toBeNull()

    act(() => {
      vi.advanceTimersByTime(800)
    })
    expect(todo.querySelector('li[aria-hidden="true"]')).toBeNull()
  })

  it('ne joue aucun dégagement quand l’appareil demande de réduire les animations', async () => {
    reducedMotion.matches = true
    const { user } = await renderApp(dataFor(illustrated!, { tasks }), 'Tâches')
    await user.click(screen.getByRole('checkbox', { name: 'Deux' }))
    expect(screen.getByRole('region', { name: 'À faire' }).querySelector('li[aria-hidden="true"]')).toBeNull()
  })

  it.each(THEMES.map((theme) => [theme.name, theme] as const))(
    '%s : jalons modifiables depuis la liste, objectif atteint puis tableau de trophées',
    async (_name, theme) => {
        const { repository, user } = await renderApp(dataFor(theme, { goals: [goal], milestones }), 'Objectifs')
      const card = screen.getByRole('heading', { name: 'Courir 10 km' }).closest('li')!
      expect(card.querySelector('.goal__scene svg[aria-hidden="true"]') !== null).toBe(theme.GoalScene !== undefined)

      // À 100 %, l'action est suggérée.
      expect(within(card).getByText('Tous les jalons sont terminés.')).toBeInTheDocument()
      // Ajouter un jalon fait baisser la jauge (la scène, elle, ne recule pas : voir les tests du thème).
      await user.type(within(card).getByLabelText('Nouveau jalon pour « Courir 10 km »'), '10 km{Enter}')
      expect(within(card).getByText('2 jalons terminés sur 3 · 66 %')).toBeInTheDocument()
      await user.click(within(card).getByRole('button', { name: 'Renommer le jalon « 10 km »' }))
      const rename = within(card).getByLabelText('Nouveau nom du jalon')
      await user.clear(rename)
      await user.type(rename, 'Course de 10 km{Enter}')
      await user.click(within(card).getByRole('checkbox', { name: 'Course de 10 km' }))
      expect(within(card).getByText('3 jalons terminés sur 3 · 100 %')).toBeInTheDocument()
      await user.click(within(card).getByRole('button', { name: 'Supprimer le jalon « 5 km »' }))
      expect(within(card).getByText('2 jalons terminés sur 2 · 100 %')).toBeInTheDocument()

      await user.click(within(card).getByRole('button', { name: 'Marquer comme atteint' }))
      const trophies = screen.getByRole('region', { name: 'Tableau de trophées' })
      expect(within(trophies).getByRole('heading', { name: 'Courir 10 km' })).toBeInTheDocument()
      expect(within(trophies).getByText('Atteint le 4 octobre 2026')).toBeInTheDocument()
      await vi.waitFor(() => expect(screen.getByRole('heading', { name: 'Tableau de trophées' })).toHaveFocus())
      expect(screen.getByText('« Courir 10 km » est atteint. Bravo !')).toBeInTheDocument()

      // Célébration : une copie décorative reste un instant dans « En cours ».
      const active = screen.getByRole('region', { name: 'En cours' })
      expect(active.querySelector('li[aria-hidden="true"]')).toHaveTextContent('Objectif atteint. Bravo !')
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(active.querySelector('li[aria-hidden="true"]')).toBeNull()
      expect(within(active).getByText('Aucun objectif en cours.')).toBeInTheDocument()
      await vi.waitFor(() => expect(repository.snapshot()?.goals[0]?.status).toBe('achieved'))

      // Consultable et réversible.
      await user.click(within(trophies).getByRole('button', { name: 'Remettre en cours' }))
      expect(screen.queryByRole('region', { name: 'Tableau de trophées' })).toBeNull()
    },
  )

  it('sans animation, l’objectif atteint rejoint directement le tableau de trophées', async () => {
    const { user } = await renderApp(
      { ...dataFor(illustrated!, { goals: [goal], milestones }), settings: { themeId: illustrated!.id, animationsEnabled: false } },
      'Objectifs',
    )
    await user.click(screen.getByRole('button', { name: 'Marquer comme atteint' }))
    expect(screen.getByRole('region', { name: 'En cours' }).querySelector('li[aria-hidden="true"]')).toBeNull()
    expect(screen.getByRole('region', { name: 'Tableau de trophées' })).toBeInTheDocument()
  })
})
