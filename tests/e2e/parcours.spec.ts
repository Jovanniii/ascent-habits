/**
 * Parcours clés de l'application, sur téléphone et tablette simulés.
 */
import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  addTask,
  checkButton,
  createGoalWithMilestones,
  createHabit,
  downloadText,
  goToTab,
  openFreshApp,
} from './helpers.ts'

test.beforeEach(async ({ page }) => {
  await openFreshApp(page)
})

test('créer une habitude, la cocher puis annuler la coche', async ({ page }) => {
  await createHabit(page, 'Lire 10 pages')
  const check = checkButton(page, 'Lire 10 pages')
  await expect(check).toHaveAttribute('aria-pressed', 'false')

  await check.click()
  await expect(check).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.habit').filter({ hasText: 'Lire 10 pages' })).toContainText('1 validation')

  // Annuler = toucher une seconde fois.
  await check.click()
  await expect(check).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.habit').filter({ hasText: 'Lire 10 pages' })).toContainText('0 validation')
})

test('ajouter une tâche et la terminer', async ({ page }) => {
  await addTask(page, 'Appeler le garage')
  // La tâche terminée change de liste : un simple toucher, puis on vérifie où elle se trouve.
  await page.getByRole('checkbox', { name: /Appeler le garage/ }).click()
  await expect(page.getByText('Terminées (1)')).toBeVisible()
  await expect(page.getByText('Aucune tâche pour l’instant.')).toBeVisible()
})

test('créer un objectif avec des jalons et suivre sa progression', async ({ page }) => {
  await createGoalWithMilestones(page, 'Courir 10 km', ['Courir 5 km', 'Courir 10 km sans pause'])
  const progress = page.getByRole('progressbar', { name: 'Progression de « Courir 10 km »' })
  await expect(progress).toHaveAttribute('aria-valuenow', '0')

  await page.getByRole('checkbox', { name: 'Courir 5 km' }).check()
  await expect(progress).toHaveAttribute('aria-valuenow', '50')
  await expect(page.getByText('1 jalon terminé sur 2 · 50 %')).toBeVisible()
})

test('changer de thème', async ({ page }) => {
  await createHabit(page, 'Méditer')
  // Thème par défaut des nouvelles installations : l'habitude du jour est illustrée.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mountain')
  await expect(page.locator('.habit--scene')).toHaveCount(1)

  await goToTab(page, 'Réglages')
  await page.getByLabel('Thème').selectOption({ label: 'Sobre' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'plain')

  await goToTab(page, 'Aujourd’hui')
  await expect(page.locator('.habit--scene')).toHaveCount(0)
  await expect(checkButton(page, 'Méditer')).toBeVisible()

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'plain')
})

test('recharger la page et retrouver ses données', async ({ page }) => {
  await createHabit(page, 'Boire de l’eau')
  await checkButton(page, 'Boire de l’eau').click()
  await addTask(page, 'Envoyer le dossier')
  await createGoalWithMilestones(page, 'Apprendre l’italien', ['Niveau A1'])

  await page.reload()

  await expect(checkButton(page, 'Boire de l’eau')).toHaveAttribute('aria-pressed', 'true')
  await goToTab(page, 'Tâches')
  await expect(page.locator('.task__name', { hasText: 'Envoyer le dossier' })).toBeVisible()
  await goToTab(page, 'Objectifs')
  await expect(page.getByRole('checkbox', { name: 'Niveau A1' })).toBeVisible()
})

test('exporter puis importer une sauvegarde', async ({ page }, testInfo) => {
  await createHabit(page, 'Marcher 20 minutes')
  await checkButton(page, 'Marcher 20 minutes').click()
  await addTask(page, 'Réserver le train')

  await goToTab(page, 'Réglages')
  const { download, text } = await downloadText(page, () =>
    page.getByRole('button', { name: 'Exporter mes données' }).click(),
  )
  expect(download.suggestedFilename()).toMatch(/^ascent-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/)
  expect(JSON.parse(text)).toMatchObject({ app: 'ascent', data: { habits: [{ name: 'Marcher 20 minutes' }] } })
  const backupPath = testInfo.outputPath('sauvegarde.json')
  await writeFile(backupPath, text)

  // Nouvel appareil : plus aucune donnée.
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Ajouter une habitude' })).toBeVisible()

  await goToTab(page, 'Réglages')
  await page.getByLabel('Fichier de sauvegarde à importer').setInputFiles(backupPath)
  const dialog = page.getByRole('dialog', { name: 'Remplacer les données ?' })
  await expect(dialog).toContainText('1 habitude, 1 tâche, 0 objectif')
  await dialog.getByRole('button', { name: 'Remplacer les données' }).click()

  await goToTab(page, 'Aujourd’hui')
  await expect(checkButton(page, 'Marcher 20 minutes')).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await goToTab(page, 'Tâches')
  await expect(page.locator('.task__name', { hasText: 'Réserver le train' })).toBeVisible()
})

test('exporter des statistiques anonymes sans aucun texte saisi', async ({ page }) => {
  await createHabit(page, 'Habitude très personnelle')
  await checkButton(page, 'Habitude très personnelle').click()
  await addTask(page, 'Tâche confidentielle')
  await createGoalWithMilestones(page, 'Objectif secret', ['Jalon intime'])

  await goToTab(page, 'Réglages')
  const { download, text } = await downloadText(page, () =>
    page.getByRole('button', { name: 'Exporter mes statistiques anonymes' }).click(),
  )
  expect(download.suggestedFilename()).toMatch(/^ascent-statistiques-anonymes-\d{4}-\d{2}-\d{2}\.json$/)
  for (const secret of ['personnelle', 'confidentielle', 'secret', 'intime']) {
    expect(text).not.toContain(secret)
  }
  const stats = JSON.parse(text)
  expect(stats).toMatchObject({ format: 'ascent-statistiques-anonymes', themeId: 'mountain' })
  expect(stats.habits).toHaveLength(1)
  expect(stats.completions).toEqual([expect.objectContaining({ habit: 0, kind: 'normal' })])
  expect(stats.goals).toEqual([expect.objectContaining({ milestones: 1, milestonesDone: 0 })])
})
