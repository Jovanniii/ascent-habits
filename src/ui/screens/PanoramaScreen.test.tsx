// @vitest-environment jsdom
import '../testing/setup.ts'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createEmptyAppData, type AppData, type Habit } from '../../engine/index.ts'
import { createMemoryRepository } from '../../storage/index.ts'
import { DEFAULT_THEME_ID, THEMES } from '../../themes/index.ts'
import { App } from '../App.tsx'
import { reducedMotion } from '../testing/setup.ts'

// Mercredi 7 octobre 2026, 22 h (nuit), heure locale.
const now = () => new Date(2026, 9, 7, 22, 0)

const decoratedTheme = THEMES.find((theme) => theme.Panorama)!
const plainTheme = THEMES.find((theme) => !theme.Panorama)!

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
    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual(['Lire', 'Marcher', 'Méditer'])
    expect(within(items[0]!).getByText(/Série actuelle : 2 validations/)).toBeInTheDocument()
    expect(within(items[2]!).getByText(/En pause/)).toBeInTheDocument()
    // Lecture seule : aucune case à cocher, seul le bouton de retour.
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: /Valider/ })).toBeNull()
    expect(screen.getAllByRole('button').filter((b) => !b.closest('nav'))).toHaveLength(1)
    // Le décor du thème est présent, masqué aux lecteurs d'écran, à l'ambiance du moment.
    const decor = document.querySelector('[aria-hidden="true"][data-ambiance]')
    expect(decor).toHaveAttribute('data-ambiance', 'night')

    await user.click(screen.getByRole('button', { name: 'Retour à Aujourd’hui' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Aujourd’hui' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Panorama' })).toHaveFocus()
  })

  it('coupe les animations du décor si l’appareil demande de les réduire', async () => {
    reducedMotion.matches = true
    const { user } = await renderApp(data(decoratedTheme.id, HABITS))
    await user.click(screen.getByRole('button', { name: 'Panorama' }))
    expect(document.querySelector('[data-ambiance]')).toHaveAttribute('data-motion', 'off')
  })

  it('n’est pas proposé par un thème sans décor, ni sans habitude', async () => {
    await renderApp(data(plainTheme.id, HABITS))
    expect(screen.queryByRole('button', { name: 'Panorama' })).toBeNull()
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
