// @vitest-environment jsdom
import './testing/setup.ts'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyAppData, type AppData, type Completion } from '../engine/index.ts'
import { StoredDataError, createBackup, createMemoryRepository, serializeBackup } from '../storage/index.ts'
import { App } from './App.tsx'
import { downloadTextFile } from './download.ts'

vi.mock('./download.ts', () => ({ downloadTextFile: vi.fn() }))

// Dimanche 4 octobre 2026, 10 h, heure locale.
const now = () => new Date(2026, 9, 4, 10, 0)
const SETTINGS = { themeId: 'plain', animationsEnabled: true }

function dataWith(overrides: Partial<AppData>): AppData {
  return { ...createEmptyAppData(SETTINGS), ...overrides }
}

function daily(from: string, to: string): Completion[] {
  const result: Completion[] = []
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    result.push({ habitId: 'h1', date: d.toISOString().slice(0, 10), kind: 'normal' })
  }
  return result
}

const readingHabit = {
  id: 'h1',
  name: 'Lire',
  frequency: { type: 'daily' as const },
  createdOn: '2026-09-20',
  status: 'active' as const,
  pauses: [],
}

async function renderApp(initial: AppData | null = null) {
  const repository = createMemoryRepository(initial)
  const user = userEvent.setup()
  render(<App repository={repository} now={now} />)
  await screen.findByRole('heading', { level: 1 })
  return { repository, user }
}

beforeEach(() => {
  vi.mocked(downloadTextFile).mockClear()
})

describe('habitudes', () => {
  it("crée une première habitude depuis l'écran d'accueil, la coche et affiche la série", async () => {
    const { repository, user } = await renderApp()

    expect(screen.getByRole('heading', { name: 'Ajouter une habitude' })).toBeInTheDocument()
    await user.type(screen.getByLabelText("Nom de l'habitude"), 'Lire 10 pages')
    await user.click(screen.getByRole('button', { name: 'Créer l’habitude' }))

    const card = screen.getByRole('heading', { name: 'Lire 10 pages' }).closest('li')!
    expect(within(card).getByText('Série actuelle')).toBeInTheDocument()
    expect(within(card).getByText('0 validation')).toBeInTheDocument()

    const check = within(card).getByRole('button', { name: 'Valider « Lire 10 pages » pour aujourd\'hui' })
    expect(check).toHaveAttribute('aria-pressed', 'false')
    await user.click(check)
    expect(check).toHaveAttribute('aria-pressed', 'true')
    expect(within(card).getByText('1 validation')).toBeInTheDocument()

    // Les données sont enregistrées.
    await vi.waitFor(() => expect(repository.snapshot()?.completions).toHaveLength(1))

    // Un second toucher annule la coche.
    await user.click(check)
    expect(within(card).getByText('0 validation')).toBeInTheDocument()
  })

  it('propose de rattraper le jour manqué en le nommant et préserve la série', async () => {
    const { user } = await renderApp(dataWith({ habits: [readingHabit], completions: daily('2026-09-20', '2026-10-02') }))

    expect(screen.getByText('0 validation')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rattraper samedi pour « Lire »' }))

    expect(screen.getAllByText('Samedi rattrapé.').length).toBeGreaterThan(0)
    expect(screen.getByText('14 validations')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rattraper/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Annuler le rattrapage de samedi pour « Lire »' }))
    expect(screen.getByRole('button', { name: 'Rattraper samedi pour « Lire »' })).toBeInTheDocument()
  })

  it('affiche le plus haut palier séparément de la série actuelle', async () => {
    await renderApp(
      dataWith({
        habits: [{ ...readingHabit, createdOn: '2026-08-01' }],
        completions: [...daily('2026-08-01', '2026-08-25'), ...daily('2026-10-01', '2026-10-03')],
      }),
    )
    expect(screen.getByText('3 validations')).toBeInTheDocument()
    expect(screen.getByText('Plus haut palier atteint : 21 jours')).toBeInTheDocument()
    expect(screen.getByText('Prochain palier : 21 jours, encore 18 jours')).toBeInTheDocument()
  })

  it('demande confirmation avant un changement de fréquence', async () => {
    const { repository, user } = await renderApp(
      dataWith({ habits: [readingHabit], completions: daily('2026-09-20', '2026-10-03') }),
    )

    await user.click(screen.getByRole('button', { name: 'Gérer « Lire »' }))
    const dialog = screen.getByRole('dialog', { name: 'Gérer « Lire »' })
    await user.click(within(dialog).getByRole('radio', { name: 'Certains jours' }))
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))

    const confirmation = screen.getByRole('dialog', { name: 'Changer la fréquence ?' })
    expect(within(confirmation).getByText(/la série affichée peut changer/)).toBeInTheDocument()
    expect(within(confirmation).getByText(/14 validations →/)).toBeInTheDocument()
    expect(within(confirmation).getByText('6 validations')).toBeInTheDocument()

    await user.click(within(confirmation).getByRole('button', { name: 'Confirmer' }))
    await vi.waitFor(() =>
      expect(repository.snapshot()?.habits[0]?.frequency).toEqual({ type: 'specificDays', days: [1, 3, 5] }),
    )
    expect(screen.getByText('Lun. mer. ven. · pas prévue aujourd’hui')).toBeInTheDocument()
  })

  it('applique directement une modification sans changement de fréquence', async () => {
    const { user } = await renderApp(dataWith({ habits: [readingHabit] }))
    await user.click(screen.getByRole('button', { name: 'Gérer « Lire »' }))
    const name = within(screen.getByRole('dialog')).getByLabelText("Nom de l'habitude")
    await user.clear(name)
    await user.type(name, 'Lire le soir')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lire le soir' })).toBeInTheDocument()
  })
})

describe('tâches', () => {
  it('ajoute une tâche puis la coche', async () => {
    const { user } = await renderApp()
    await user.click(screen.getByRole('button', { name: 'Tâches' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Tâches' })).toHaveFocus()

    await user.type(screen.getByLabelText('Nouvelle tâche'), 'Appeler le garage')
    await user.click(screen.getByRole('button', { name: 'Ajouter la tâche' }))
    const checkbox = screen.getByRole('checkbox', { name: 'Appeler le garage' })
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(screen.getByText('Aucune tâche pour l’instant.')).toBeInTheDocument()
    expect(screen.getByText('Terminées (1)')).toBeInTheDocument()
  })
})

describe('objectifs', () => {
  it('crée un objectif avec des jalons et suit sa progression', async () => {
    const { user } = await renderApp()
    await user.click(screen.getByRole('button', { name: 'Objectifs' }))

    await user.type(screen.getByLabelText('Nouvel objectif'), 'Courir 10 km')
    await user.click(screen.getByRole('button', { name: 'Créer l’objectif' }))
    expect(screen.getByText('Aucun jalon pour l’instant.')).toBeInTheDocument()

    const milestoneInput = screen.getByLabelText('Nouveau jalon pour « Courir 10 km »')
    await user.type(milestoneInput, '5 km{Enter}')
    await user.type(milestoneInput, '10 km{Enter}')
    await user.click(screen.getByRole('checkbox', { name: '5 km' }))

    expect(screen.getByText('1 jalon terminé sur 2 · 50 %')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Progression de « Courir 10 km »' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )

    await user.click(screen.getByRole('button', { name: 'Supprimer le jalon « 10 km »' }))
    expect(screen.getByText('1 jalon terminé sur 1 · 100 %')).toBeInTheDocument()
    expect(screen.getByText('Tous les jalons sont terminés.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Marquer comme atteint' }))
    expect(screen.getByRole('heading', { name: 'Objectifs atteints' })).toBeInTheDocument()
  })
})

describe('réglages', () => {
  it('désactive les animations', async () => {
    const { user } = await renderApp()
    expect(document.documentElement.dataset.motion).toBe('full')
    await user.click(screen.getByRole('button', { name: 'Réglages' }))
    await user.click(screen.getByRole('switch', { name: /Animations/ }))
    expect(document.documentElement.dataset.motion).toBe('reduced')
  })

  it('exporte les données', async () => {
    const { user } = await renderApp(dataWith({ habits: [readingHabit] }))
    await user.click(screen.getByRole('button', { name: 'Réglages' }))
    await user.click(screen.getByRole('button', { name: 'Exporter mes données' }))
    const [fileName, content] = vi.mocked(downloadTextFile).mock.calls[0]!
    expect(fileName).toBe('ascent-sauvegarde-2026-10-04.json')
    expect(JSON.parse(content).data.habits[0].name).toBe('Lire')
  })

  it("propose un export de sécurité avant de remplacer les données par un import", async () => {
    const { repository, user } = await renderApp(dataWith({ habits: [readingHabit] }))
    await user.click(screen.getByRole('button', { name: 'Réglages' }))

    const imported = dataWith({ tasks: [{ id: 't1', name: 'Tâche importée', status: 'todo', createdAt: '2026-10-01T08:00:00.000Z' }] })
    const file = new File([serializeBackup(createBackup(imported, '2026-10-01T08:00:00.000Z'))], 'sauvegarde.json', {
      type: 'application/json',
    })
    await user.upload(screen.getByLabelText('Fichier de sauvegarde à importer'), file)

    const dialog = await screen.findByRole('dialog', { name: 'Remplacer les données ?' })
    expect(within(dialog).getByText(/0 habitude, 1 tâche, 0 objectif/)).toBeInTheDocument()
    const safety = within(dialog).getByRole('checkbox', { name: /Télécharger d’abord une sauvegarde/ })
    expect(safety).toBeChecked()

    await user.click(within(dialog).getByRole('button', { name: 'Remplacer les données' }))
    expect(downloadTextFile).toHaveBeenCalledWith('ascent-sauvegarde-avant-import-2026-10-04.json', expect.any(String))
    const safetyBackup = JSON.parse(vi.mocked(downloadTextFile).mock.calls[0]![1])
    expect(safetyBackup.data.habits[0].name).toBe('Lire')
    await vi.waitFor(() => expect(repository.snapshot()?.tasks[0]?.name).toBe('Tâche importée'))
    expect(repository.snapshot()?.habits).toEqual([])
  })

  it('refuse un fichier invalide sans toucher aux données', async () => {
    const initial = dataWith({ habits: [readingHabit] })
    const { repository, user } = await renderApp(initial)
    const save = vi.spyOn(repository, 'save')
    await user.click(screen.getByRole('button', { name: 'Réglages' }))
    await user.upload(screen.getByLabelText('Fichier de sauvegarde à importer'), new File(['{}'], 'x.json'))

    const dialog = await screen.findByRole('dialog', { name: 'Import impossible' })
    expect(within(dialog).getByText("Ce fichier n'est pas une sauvegarde Ascent.")).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
    expect(repository.snapshot()).toEqual(initial)
  })
})

describe('données illisibles', () => {
  it("ne les efface pas et propose de les télécharger", async () => {
    const repository = {
      load: vi.fn(async () => {
        throw new StoredDataError('Les données enregistrées ne sont pas lisibles.', '{ cassé')
      }),
      save: vi.fn(async () => {}),
    }
    const user = userEvent.setup()
    render(<App repository={repository} now={now} />)
    await screen.findByRole('heading', { name: 'Données illisibles' })

    await user.click(screen.getByRole('button', { name: 'Télécharger les données brutes' }))
    expect(downloadTextFile).toHaveBeenCalledWith('ascent-donnees-illisibles-2026-10-04.json', '{ cassé')
    expect(repository.save).not.toHaveBeenCalled()
  })
})
