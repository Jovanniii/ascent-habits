/**
 * Outils partagés des tests de bout en bout.
 */
import { expect, type Download, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

export type TabName = 'Aujourd’hui' | 'Tâches' | 'Objectifs' | 'Calendrier' | 'Réglages'

/** Ouvre l'application sur un appareil neuf (aucune donnée enregistrée). */
export async function openFreshApp(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: 'Aujourd’hui' })).toBeVisible()
}

export async function goToTab(page: Page, tab: TabName): Promise<void> {
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name: tab }).click()
  await expect(page.getByRole('heading', { level: 1, name: tab })).toBeVisible()
}

export function checkButton(page: Page, habitName: string) {
  return page.getByRole('button', { name: `Valider « ${habitName} » pour aujourd'hui` })
}

/** Crée une habitude quotidienne depuis l'écran « Aujourd'hui ». */
export async function createHabit(page: Page, name: string): Promise<void> {
  await goToTab(page, 'Aujourd’hui')
  const addButton = page.getByRole('button', { name: 'Ajouter une habitude' })
  // Première habitude : formulaire directement sur l'écran ; ensuite : dans une fenêtre.
  if (await addButton.isVisible()) await addButton.click()
  await page.getByLabel('Nom de l\'habitude').fill(name)
  await page.getByRole('button', { name: 'Créer l’habitude' }).click()
  await expect(checkButton(page, name)).toBeVisible()
}

export async function addTask(page: Page, name: string): Promise<void> {
  await goToTab(page, 'Tâches')
  await page.getByLabel('Nouvelle tâche').fill(name)
  await page.getByRole('button', { name: 'Ajouter la tâche' }).click()
  await expect(page.locator('.task__name', { hasText: name })).toBeVisible()
}

export async function createGoalWithMilestones(page: Page, name: string, milestones: string[]): Promise<void> {
  await goToTab(page, 'Objectifs')
  await page.getByLabel('Nouvel objectif').fill(name)
  await page.getByRole('button', { name: 'Créer l’objectif' }).click()
  for (const milestone of milestones) {
    await page.getByLabel(`Nouveau jalon pour « ${name} »`).fill(milestone)
    await page.getByRole('listitem').filter({ hasText: name }).getByRole('button', { name: 'Ajouter', exact: true }).click()
    await expect(page.getByRole('checkbox', { name: milestone })).toBeVisible()
  }
}

/** Lance un téléchargement et renvoie le contenu texte du fichier. */
export async function downloadText(page: Page, trigger: () => Promise<void>): Promise<{ download: Download; text: string }> {
  const [download] = await Promise.all([page.waitForEvent('download'), trigger()])
  const path = await download.path()
  return { download, text: await readFile(path, 'utf8') }
}
