/**
 * Tests de bout en bout (Playwright) : parcours clés, accessibilité (axe) et PWA.
 *
 * Lancement : npm run test:e2e
 * Les tests tournent sur le build de production servi par « vite preview »,
 * dans Chromium, avec un téléphone et une tablette simulés.
 */
import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const isCI = Boolean(process.env.CI)

// Chromium déjà installé ailleurs (environnement sans téléchargement) : chemin facultatif.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: './e2e',
  outputDir: '../test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { outputFolder: '../playwright-report', open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/ascent-habits/`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'telephone', use: { ...devices['Pixel 7'] } },
    { name: 'tablette', use: { ...devices['Galaxy Tab S4'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    cwd: resolve(import.meta.dirname, '..'),
    url: `http://localhost:${PORT}/ascent-habits/`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
})
