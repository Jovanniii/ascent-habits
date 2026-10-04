import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Génère les icônes PNG de la PWA à partir du logo provisoire (npm run icons).
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#2f3b4c' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#2f3b4c' } },
  },
  images: ['public/favicon.svg'],
})
