import type { Theme } from '../types.ts'
import { MountainScene } from './MountainScene.tsx'
import './mountain.css'

/**
 * Thème montagne, visuels provisoires (formes SVG simples). Palette du Doc 07 :
 * clair = jour (neige, ardoise), sombre = nuit (bleu nuit, brume). L'accent rouge
 * orangé n'est jamais utilisé pour l'interface : il reste réservé à la scène.
 */
export const theme: Theme = {
  id: 'mountain',
  name: 'Montagne',
  isDefault: true,
  tokens: {
    light: {
      '--color-bg': '#f7f4ef',
      '--color-surface': '#ffffff',
      '--color-surface-muted': '#eceff5',
      '--color-text': '#1f2a4d',
      '--color-text-muted': '#4a5573',
      '--color-border': '#c5cede',
      '--color-primary': '#4f6d8f',
      '--color-on-primary': '#ffffff',
      '--color-done': '#4f6d8f',
      '--color-on-done': '#ffffff',
      '--color-focus': '#1f2a4d',
    },
    dark: {
      '--color-bg': '#1f2a4d',
      '--color-surface': '#27335a',
      '--color-surface-muted': '#303d68',
      '--color-text': '#f7f4ef',
      '--color-text-muted': '#c4cce0',
      '--color-border': '#55648f',
      '--color-primary': '#a8b8d8',
      '--color-on-primary': '#1f2a4d',
      '--color-done': '#a8b8d8',
      '--color-on-done': '#1f2a4d',
      '--color-focus': '#ffd9b0',
    },
  },
  HabitScene: MountainScene,
}
