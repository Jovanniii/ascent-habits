// @vitest-environment jsdom
import '../testing/setup.ts'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyAppData, type AppData, type Habit } from '../../engine/index.ts'
import { createMemoryRepository } from '../../storage/index.ts'
import { DEFAULT_THEME_ID, THEMES } from '../../themes/index.ts'
import { App } from '../App.tsx'
import { reducedMotion } from '../testing/setup.ts'

// Mercredi 7 octobre 2026, 22 h (nuit), heure locale.
const now = () => new Date(2026, 9, 7, 22, 0)

const decoratedTheme = THEMES.find((theme) => theme.Scene)!
const plainTheme = THEMES.find((theme) => !theme.Panorama && !theme.Scene)!

function habit(id: string, name: string, status: Habit['status'] = 'active'): Habit {
  return { id, name, frequency: { type: 'daily' }, createdOn: '2026-10-01', status, pauses: [] }
}

function data(themeId: string, habits: Habit[]): AppData {
  return {
    ...createEmptyAppData({ themeId, animationsEnabled: true }),
    habits,
    completions: [
      { habitId: 'h1', date: '2026-10-06', kind: 'normal' },
      { habitId: 'h1', date: '2026-10-07', kind: 'normal' },
    ],
  }
}

function memoryPreferences(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

async function renderApp(initial: AppData, preferences = memoryPreferences()) {
  const user = userEvent.setup()
  render(<App repository={createMemoryRepository(initial)} now={now} preferences={preferences} />)
  await screen.findByRole('heading', { level: 1 })
  return { user, preferences }
}

const HABITS = [habit('h1', 'Lire'), habit('h2', 'Marcher'), habit('h3', 'Méditer', 'paused'), habit('h4', 'Ancienne', 'archived')]

describe('vue panorama', () => {
  it('s’ouvre depuis « Aujourd’hui », montre toutes les habitudes en lecture seule et revient', async () => {
    const { user } = await renderApp(data(decoratedTheme.id, HABITS))

    const open = screen.getByRole('button', { name: 'Panorama' })
    await user.click(open)

    const title = screen.getByRole('heading', { level: 1, name: 'Panorama' })
    expect(title).toHaveFocus()
    // Habitudes en cours et en pause, sans les archivées.
    const items = within(screen.getByRole('list', { name: 'Habitudes' })).getAllByRole('listitem')
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual(['Lire', 'Marcher', 'Méditer'])
    expect(within(items[0]!).getByText(/Série actuelle : 2 validations/)).toBeInTheDocument()
    expect(within(items[2]!).getByText(/En pause/)).toBeInTheDocument()
    // Lecture seule : aucune case à cocher, seulement le retour et les commandes de l'heure du décor.
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: /Valider/ })).toBeNull()
    expect(screen.getAllByRole('button').filter((b) => !b.closest('nav')).map((b) => b.textContent)).toEqual([
      'Retour',
      'Faire défiler',
      'Maintenant',
    ])
    // Le grand décor du thème est présent, masqué aux lecteurs d'écran : trois cordées.
    const decor = document.querySelector('[aria-hidden="true"][data-variant="full"]')
    expect(decor).toHaveAttribute('data-tracks', '3')
    expect(screen.getByText('Aucune tâche pour aujourd’hui.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retour à Aujourd’hui' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Aujourd’hui' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Panorama' })).toHaveFocus()
  })

  it('parcourt la journée avec le curseur « Heure du décor » et revient à l’heure réelle', async () => {
    const { user } = await renderApp(data(decoratedTheme.id, HABITS))
    await user.click(screen.getByRole('button', { name: 'Panorama' }))

    const slider = screen.getByRole('slider', { name: 'Heure du décor' })
    expect(slider).toHaveValue('22')
    expect(slider).toHaveAttribute('aria-valuetext', '22 h 00')
    expect(screen.getByRole('button', { name: 'Maintenant' })).toBeDisabled()

    fireEvent.change(slider, { target: { value: '7.5' } })
    expect(screen.getByText('7 h 30')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Maintenant' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Maintenant' }))
    expect(slider).toHaveValue('22')
  })

  it('fait défiler l’heure du décor tout seul, jusqu’à l’arrêt', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const { user } = await renderApp(data(decoratedTheme.id, HABITS))
      await user.click(screen.getByRole('button', { name: 'Panorama' }))
      const play = screen.getByRole('button', { name: 'Faire défiler' })
      await user.click(play)
      expect(screen.getByRole('button', { name: 'Arrêter' })).toHaveAttribute('aria-pressed', 'true')
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.getByRole('slider', { name: 'Heure du décor' })).toHaveValue('1')
      await user.click(screen.getByRole('button', { name: 'Arrêter' }))
      expect(screen.getByRole('button', { name: 'Faire défiler' })).toHaveAttribute('aria-pressed', 'false')
    } finally {
      vi.useRealTimers()
    }
  })

  it('montre aussi les objectifs en cours et les tâches du jour', async () => {
    const initial: AppData = {
      ...data(decoratedTheme.id, [habit('h1', 'Lire')]),
      goals: [
        { id: 'g1', name: 'Courir un semi', status: 'active', createdAt: '2026-10-01T08:00:00.000Z' },
        { id: 'g2', name: 'Fini', status: 'achieved', createdAt: '2026-10-01T08:00:00.000Z' },
      ],
      milestones: [
        { id: 'm1', goalId: 'g1', name: '5 km', status: 'done', createdAt: '2026-10-01T08:00:00.000Z' },
        { id: 'm2', goalId: 'g1', name: '10 km', status: 'todo', createdAt: '2026-10-01T08:00:00.000Z' },
      ],
      tasks: [
        { id: 't1', name: 'Appeler', status: 'todo', dueDate: '2026-10-07', createdAt: '2026-10-01T08:00:00.000Z' },
        { id: 't2', name: 'En retard', status: 'todo', dueDate: '2026-10-02', createdAt: '2026-10-01T08:00:00.000Z' },
        { id: 't3', name: 'Plus tard', status: 'todo', dueDate: '2026-10-20', createdAt: '2026-10-01T08:00:00.000Z' },
        { id: 't4', name: 'Faite', status: 'done', dueDate: '2026-10-07', createdAt: '2026-10-01T08:00:00.000Z' },
      ],
    }
    const { user } = await renderApp(initial)
    // Bandeau du décor en haut d'« Aujourd'hui ».
    expect(document.querySelector('[aria-hidden="true"][data-variant="banner"]')).toHaveAttribute('data-tracks', '2')

    await user.click(screen.getByRole('button', { name: 'Panorama' }))
    const goals = within(screen.getByRole('list', { name: 'Objectifs en cours' })).getAllByRole('listitem')
    expect(goals).toHaveLength(1)
    expect(goals[0]).toHaveTextContent('Courir un semi')
    expect(goals[0]).toHaveTextContent('jalons terminés : 1 sur 2')
    expect(screen.getByText('2 tâches pour aujourd’hui.')).toBeInTheDocument()
    expect(document.querySelector('[data-variant="full"]')).toHaveAttribute('data-waiting', '2')
  })

  it('est proposé avec seulement un objectif en cours', async () => {
    const initial: AppData = {
      ...data(decoratedTheme.id, []),
      goals: [{ id: 'g1', name: 'Courir', status: 'active', createdAt: '2026-10-01T08:00:00.000Z' }],
    }
    const { user } = await renderApp(initial)
    await user.click(screen.getByRole('button', { name: 'Panorama' }))
    expect(screen.getByText('Aucune habitude en cours.')).toBeInTheDocument()
    expect(document.querySelector('[data-variant="full"]')).toHaveAttribute('data-tracks', '1')
  })

  it('coupe les animations du décor si l’appareil demande de les réduire', async () => {
    reducedMotion.matches = true
    const { user } = await renderApp(data(decoratedTheme.id, HABITS))
    await user.click(screen.getByRole('button', { name: 'Panorama' }))
    expect(document.querySelector('[data-variant="full"]')).toHaveAttribute('data-motion', 'off')
  })

  it('n’est pas proposé par un thème sans décor, ni sans habitude', async () => {
    await renderApp(data(plainTheme.id, HABITS))
    expect(screen.queryByRole('button', { name: 'Panorama' })).toBeNull()
    expect(document.querySelector('[data-variant="banner"]')).toBeNull()
  })
})

describe('réglage « Ambiance »', () => {
  it('suit l’heure par défaut et retient un moment fixé sur l’appareil', async () => {
    const { user, preferences } = await renderApp(data(DEFAULT_THEME_ID, [habit('h1', 'Lire')]))
    expect(document.querySelector('svg[data-ambiance]')).toHaveAttribute('data-ambiance', 'night')

    await user.click(screen.getByRole('button', { name: /Réglages/ }))
    const select = screen.getByLabelText('Ambiance')
    expect(select).toHaveValue('auto')
    expect(select).toHaveAccessibleDescription('Le décor suit l’heure : matin, jour, soir et nuit.')

    await user.selectOptions(select, 'Toujours jour')
    expect(preferences.values.get('ascent:ambiance')).toBe('day')

    await user.click(screen.getByRole('button', { name: /Aujourd/ }))
    expect(document.querySelector('svg[data-ambiance]')).toHaveAttribute('data-ambiance', 'day')
  })

  it('reprend le réglage enregistré et ignore une valeur inconnue', async () => {
    await renderApp(data(DEFAULT_THEME_ID, [habit('h1', 'Lire')]), memoryPreferences({ 'ascent:ambiance': 'day' }))
    expect(document.querySelector('svg[data-ambiance]')).toHaveAttribute('data-ambiance', 'day')
  })

  it('n’apparaît pas avec un thème qui ne suit pas l’ambiance', async () => {
    const { user } = await renderApp(data(plainTheme.id, []))
    await user.click(screen.getByRole('button', { name: /Réglages/ }))
    expect(screen.queryByLabelText('Ambiance')).toBeNull()
  })
})
