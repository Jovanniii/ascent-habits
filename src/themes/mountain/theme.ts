import type { Theme } from '../types.ts'
import { MountainScene } from './MountainScene.tsx'
import { TrailDayMark } from './TrailDayMark.tsx'
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
      '--calendar-heat-0': '#f7f4ef',
      '--calendar-heat-1': '#fbe3d6',
      '--calendar-heat-2': '#f6bea6',
      '--calendar-heat-3': '#ef8f70',
      '--calendar-heat-4': '#e8573c',
      '--calendar-on-heat-0': '#1f2a4d',
      '--calendar-on-heat-1': '#1f2a4d',
      '--calendar-on-heat-2': '#1f2a4d',
      '--calendar-on-heat-3': '#1f2a4d',
      '--calendar-on-heat-4': '#1a0f0c',
      '--calendar-mark': '#4f6d8f',
      '--calendar-chain': '#dfe5f0',
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
      '--calendar-heat-0': '#27335a',
      '--calendar-heat-1': '#423f6b',
      '--calendar-heat-2': '#6e4867',
      '--calendar-heat-3': '#a8524f',
      '--calendar-heat-4': '#e8573c',
      '--calendar-on-heat-0': '#f7f4ef',
      '--calendar-on-heat-1': '#f7f4ef',
      '--calendar-on-heat-2': '#f7f4ef',
      '--calendar-on-heat-3': '#ffffff',
      '--calendar-on-heat-4': '#1a0f0c',
      '--calendar-mark': '#a8b8d8',
      '--calendar-chain': '#303d68',
    },
  },
  HabitScene: MountainScene,
  CalendarDayMark: TrailDayMark,
}
