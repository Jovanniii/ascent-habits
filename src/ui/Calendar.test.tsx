// @vitest-environment jsdom
import './testing/setup.ts'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { computeStreak, createEmptyAppData, type AppData, type Completion, type Habit } from '../engine/index.ts'
import { createMemoryRepository } from '../storage/index.ts'
import { THEMES } from '../themes/index.ts'
import { App } from './App.tsx'

// Dimanche 4 octobre 2026, 10 h, heure locale.
const now = () => new Date(2026, 9, 4, 10, 0)

function habit(overrides: Partial<Habit>): Habit {
  return { id: 'h1', name: 'Lire', frequency: { type: 'daily' }, createdOn: '2026-09-20', status: 'active', pauses: [], ...overrides }
}

function done(habitId: string, ...dates: string[]): Completion[] {
  return dates.map((date) => ({ habitId, date, kind: 'normal' as const }))
}

function sampleData(themeId = 'plain'): AppData {
  return {
    ...createEmptyAppData({ themeId, animationsEnabled: true }),
    habits: [habit({ id: 'h1', name: 'Lire' }), habit({ id: 'h2', name: 'Méditer' })],
    completions: [
      ...done('h1', '2026-09-28', '2026-09-29', '2026-10-01', '2026-10-02'),
      ...done('h2', '2026-10-01'),
      { habitId: 'h1', date: '2026-10-03', kind: 'recovery' },
    ],
    tasks: [
      { id: 't1', name: 'Appeler le garage', status: 'done', createdAt: '2026-10-01T08:00:00.000Z', completedAt: new Date(2026, 9, 2, 18, 0).toISOString() },
    ],
  }
}

async function openCalendar(data: AppData) {
  const repository = createMemoryRepository(data)
  const user = userEvent.setup()
  render(<App repository={repository} now={now} />)
  await screen.findByRole('heading', { level: 1 })
  await user.click(screen.getByRole('button', { name: 'Calendrier' }))
  return { repository, user }
}

const NEGATIVE_WORDS = /manqu|raté|échec|perdu|retard|dommage/i

describe('calendrier : vue globale', () => {
  it('donne à chaque jour un libellé complet et une fraction visible', async () => {
    await openCalendar(sampleData())
    expect(screen.getByRole('heading', { name: 'Octobre 2026' })).toBeInTheDocument()
    const grid = screen.getByRole('grid', { name: /Toutes les habitudes/ })
    const day = within(grid).getByRole('button', { name: '2 octobre : Lire validée, Méditer non validée, 1 tâche terminée' })
    expect(day).toHaveTextContent('1/2')
    expect(day).toHaveAttribute('data-level', '2')
    expect(within(grid).getByRole('button', { name: '1er octobre : Lire validée, Méditer validée' })).toHaveAttribute('data-level', '4')
    expect(within(grid).getByRole('button', { name: '5 octobre : à venir' })).toBeInTheDocument()
    expect(within(grid).getByRole('button', { name: /^Aujourd’hui, 4 octobre : Lire à faire, Méditer à faire$/ })).toHaveAttribute('aria-current', 'date')
  })

  it('affiche le détail d’un jour touché : habitudes et tâches', async () => {
    const { user } = await openCalendar(sampleData())
    await user.click(screen.getByRole('button', { name: /^3 octobre/ }))
    const detail = screen.getByRole('region', { name: 'Samedi 3 octobre' })
    expect(within(detail).getByRole('heading', { name: 'Rattrapées' })).toBeInTheDocument()
    expect(within(detail).getByRole('heading', { name: 'Non validées' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^2 octobre/ }))
    const detail2 = screen.getByRole('region', { name: 'Vendredi 2 octobre' })
    expect(within(detail2).getByText('Appeler le garage')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(NEGATIVE_WORDS)
  })

  it('se parcourt au clavier, d’un jour et d’un mois à l’autre', async () => {
    const { user } = await openCalendar(sampleData())
    const grid = screen.getByRole('grid')
    const focusable = within(grid).getAllByRole('button').filter((button) => button.tabIndex === 0)
    expect(focusable).toHaveLength(1)
    expect(focusable[0]).toHaveAccessibleName(/4 octobre/)

    focusable[0]!.focus()
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toHaveAccessibleName(/^3 octobre/)
    await user.keyboard('{ArrowUp}{ArrowLeft}{ArrowLeft}{ArrowLeft}')
    // 3 octobre − 7 jours = 26 septembre, puis trois jours en arrière : 23 septembre.
    expect(screen.getByRole('heading', { name: 'Septembre 2026' })).toBeInTheDocument()
    expect(document.activeElement).toHaveAccessibleName(/^23 septembre/)
    await user.keyboard('{PageDown}')
    expect(document.activeElement).toHaveAccessibleName(/^23 octobre/)
    await user.keyboard('{Home}')
    expect(document.activeElement).toHaveAccessibleName(/^19 octobre/)
    await user.keyboard('{Enter}')
    expect(screen.getByRole('region', { name: 'Lundi 19 octobre' })).toHaveTextContent('À venir.')
  })

  it('ne va ni avant la première donnée ni après le mois en cours', async () => {
    const { user } = await openCalendar(sampleData())
    expect(screen.getByRole('button', { name: 'Mois suivant' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Mois précédent, septembre 2026' }))
    expect(screen.getByRole('button', { name: 'Mois précédent' })).toBeDisabled()
  })
})

describe('calendrier : vue par habitude', () => {
  it('affiche la série actuelle, la meilleure série et les séries consécutives', async () => {
    const { user } = await openCalendar(sampleData())
    await user.selectOptions(screen.getByLabelText('Afficher'), 'Lire')
    expect(screen.getByText('Série actuelle').nextElementSibling).toHaveTextContent('3 validations')
    expect(screen.getByText('Meilleure série').nextElementSibling).toHaveTextContent('3 validations')
    const grid = screen.getByRole('grid', { name: 'Lire, jours du mois' })
    expect(within(grid).getByRole('button', { name: '1er octobre : validé, série de 3 validations' })).toHaveAttribute('data-chain', 'start')
    expect(within(grid).getByRole('button', { name: '3 octobre : rattrapé, série de 3 validations' })).toHaveAttribute('data-chain', 'end')
  })

  it('note un jour passé comme fait, hors série, puis le retire', async () => {
    const data = sampleData()
    const { user, repository } = await openCalendar(data)
    await user.selectOptions(screen.getByLabelText('Afficher'), 'Méditer')
    await user.click(screen.getByRole('button', { name: 'Mois précédent, septembre 2026' }))
    await user.click(screen.getByRole('button', { name: '30 septembre : non validé' }))
    await user.click(screen.getByRole('button', { name: 'Noter le 30 septembre comme fait pour « Méditer »' }))

    expect(screen.getByRole('button', { name: '30 septembre : fait après coup, hors série' })).toBeInTheDocument()
    const saved = await repository.load()
    expect(saved?.completions).toContainEqual({ habitId: 'h2', date: '2026-09-30', kind: 'late' })
    expect(computeStreak(saved!.habits[1]!, saved!.completions, '2026-10-04').current).toBe(0)
    expect(screen.getByText('Meilleure série').nextElementSibling).toHaveTextContent('1 validation')

    await user.click(screen.getByRole('button', { name: 'Retirer le 30 septembre pour « Méditer »' }))
    expect(screen.getByRole('button', { name: '30 septembre : non validé' })).toBeInTheDocument()
  })

  it('propose le vrai rattrapage quand une série peut être sauvée', async () => {
    const data = { ...sampleData(), completions: done('h1', '2026-10-01', '2026-10-02') }
    const { user } = await openCalendar(data)
    await user.selectOptions(screen.getByLabelText('Afficher'), 'Lire')
    await user.click(screen.getByRole('button', { name: '3 octobre : non validé' }))
    expect(screen.queryByRole('button', { name: /comme fait/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rattraper le 3 octobre pour « Lire »' }))
    expect(screen.getByRole('button', { name: '3 octobre : rattrapé, série de 3 validations' })).toBeInTheDocument()
  })

  it('distingue chaque état par une forme, pas seulement par la couleur', async () => {
    const { user } = await openCalendar(sampleData())
    await user.selectOptions(screen.getByLabelText('Afficher'), 'Lire')
    const legend = screen.getByRole('list', { name: 'Légende' })
    for (const label of ['Validé', 'Rattrapé', 'Fait après coup, hors série', 'Non validé', 'En pause']) {
      const item = within(legend).getByText(label)
      expect(item.querySelector('svg path')).not.toBeNull()
    }
    expect(document.body.textContent).not.toMatch(NEGATIVE_WORDS)
  })

  it('utilise le décor du thème, masqué aux lecteurs d’écran', async () => {
    const themed = THEMES.find((theme) => theme.CalendarDayMark)
    expect(themed).toBeDefined()
    const { user } = await openCalendar(sampleData(themed!.id))
    await user.selectOptions(screen.getByLabelText('Afficher'), 'Lire')
    const day = screen.getByRole('button', { name: '1er octobre : validé, série de 3 validations' })
    const mark = day.querySelector('.calendar-day__mark')
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(mark?.querySelector('svg')).not.toBeNull()
  })
})

describe('calendrier : sans données', () => {
  it('affiche un message d’accueil neutre', async () => {
    await openCalendar(createEmptyAppData({ themeId: 'plain', animationsEnabled: true }))
    expect(screen.getByText(/Le calendrier se remplira/)).toBeInTheDocument()
  })
})
