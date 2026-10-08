/**
 * Vérifications automatiques d'accessibilité (axe-core) sur les écrans principaux,
 * dans chaque thème, en clair et en sombre.
 *
 * axe ne détecte qu'une partie des problèmes : la liste des vérifications
 * manuelles est dans docs/protocole-test-utilisateur.md (section accessibilité).
 */
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { addTask, checkButton, createGoalWithMilestones, createHabit, goToTab, openFreshApp, type TabName } from './helpers.ts'

/** Règles WCAG 2.1 niveaux A et AA, plus les bonnes pratiques d'axe. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function expectNoViolations(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}) : ${violation.help}\n` +
      violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n'),
  )
  expect(summary, `Problèmes d'accessibilité sur « ${label} »`).toEqual([])
}

const SCREENS: TabName[] = ['Aujourd’hui', 'Tâches', 'Objectifs', 'Calendrier', 'Réglages']
const THEMES = [
  { id: 'mountain', label: 'Montagne' },
  { id: 'plain', label: 'Sobre' },
]

test('écran d’accueil vide', async ({ page }) => {
  await openFreshApp(page)
  await expectNoViolations(page, 'Aujourd’hui (vide)')
})

for (const colorScheme of ['light', 'dark'] as const) {
  for (const theme of THEMES) {
    test(`écrans principaux, thème ${theme.label}, mode ${colorScheme === 'light' ? 'clair' : 'sombre'}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await openFreshApp(page)
      await goToTab(page, 'Réglages')
      await page.getByLabel('Thème').selectOption({ label: theme.label })
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id)

      // Contenu représentatif : habitude cochée et non cochée, tâche, objectif avec jalons.
      await createHabit(page, 'Lire')
      await createHabit(page, 'Courir')
      await checkButton(page, 'Lire').click()
      await addTask(page, 'Appeler le garage')
      await createGoalWithMilestones(page, 'Courir 10 km', ['5 km', '10 km'])
      await page.getByRole('checkbox', { name: '5 km' }).check()

      for (const screen of SCREENS) {
        await goToTab(page, screen)
        await expectNoViolations(page, `${screen}, ${theme.label}, ${colorScheme}`)
      }
    })
  }
}

test('fenêtre « Nouvelle habitude »', async ({ page }) => {
  await openFreshApp(page)
  await createHabit(page, 'Lire')
  await page.getByRole('button', { name: 'Ajouter une habitude' }).click()
  await expect(page.getByRole('dialog', { name: 'Nouvelle habitude' })).toBeVisible()
  await expectNoViolations(page, 'Fenêtre Nouvelle habitude')
})

test('fenêtre de gestion d’une habitude', async ({ page }) => {
  await openFreshApp(page)
  await createHabit(page, 'Lire')
  await page.getByRole('button', { name: 'Gérer « Lire »' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectNoViolations(page, 'Fenêtre de gestion')
})
