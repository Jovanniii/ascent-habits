import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import packageJson from './package.json' with { type: 'json' }

// Chemin de publication sur GitHub Pages : https://<compte>.github.io/ascent-habits/
const base = '/ascent-habits/'

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: base,
        name: 'Ascent',
        short_name: 'Ascent',
        description: 'Habitudes, tâches et objectifs : ouvrir, cocher, repartir.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f6f7f9',
        theme_color: '#2f3b4c',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // woff2 : polices auto-hébergées du thème, disponibles hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // Les tests lisent le CSS brut (?raw) : garde-fou d'isolation, palette, animations.
    css: { include: [/\.css(\?.*)?$/] },
    coverage: {
      // La couverture vise la logique métier, le stockage et la logique des thèmes.
      include: ['src/engine/**', 'src/storage/**', 'src/themes/**/*.ts'],
      exclude: ['**/*.test.ts', '**/testing/**', '**/index.ts'],
      thresholds: { lines: 95, branches: 85 },
    },
  },
})
