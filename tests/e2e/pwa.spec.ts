/**
 * Application installable et utilisable hors ligne.
 *
 * Lighthouse ne note plus les PWA depuis sa version 12 : ces critères sont
 * vérifiés ici (voir P6-D3 dans docs/journal-decisions.md).
 */
import { expect, test } from '@playwright/test'
import { checkButton, createHabit, openFreshApp } from './helpers.ts'

test('le manifeste rend l’application installable', async ({ page, request }) => {
  await openFreshApp(page)
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()
  const response = await request.get(new URL(href!, page.url()).toString())
  expect(response.ok()).toBe(true)
  const manifest = await response.json()

  expect(manifest).toMatchObject({ name: 'Ascent', lang: 'fr', display: 'standalone', start_url: '/ascent-habits/' })
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(true)
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(new URL(icon.src, new URL(href!, page.url())).toString())).ok()).toBe(true)
  }
})

test('l’application se recharge hors ligne avec ses données', async ({ page, context }) => {
  await openFreshApp(page)
  // Le service worker doit contrôler la page avant de couper le réseau.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
  await createHabit(page, 'Étirements')
  await checkButton(page, 'Étirements').click()

  await context.setOffline(true)
  await page.reload()
  await expect(checkButton(page, 'Étirements')).toHaveAttribute('aria-pressed', 'true')
  await context.setOffline(false)
})
