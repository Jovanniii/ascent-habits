import type { Theme } from '../types.ts'

/**
 * Thème sobre, sans illustration. Contrastes conformes WCAG AA.
 */
export const theme: Theme = {
  id: 'plain',
  name: 'Sobre',
  tokens: {
    light: {
      '--color-bg': '#f6f7f9',
      '--color-surface': '#ffffff',
      '--color-surface-muted': '#eef0f3',
      '--color-text': '#1d2430',
      '--color-text-muted': '#545e6c',
      '--color-border': '#c9ced6',
      '--color-primary': '#2f3b4c',
      '--color-on-primary': '#ffffff',
      '--color-done': '#256b4a',
      '--color-on-done': '#ffffff',
      '--color-focus': '#1a5fd0',
    },
    dark: {
      '--color-bg': '#12161c',
      '--color-surface': '#1b2028',
      '--color-surface-muted': '#262d38',
      '--color-text': '#e8ebf0',
      '--color-text-muted': '#a7b0bd',
      '--color-border': '#3e4757',
      '--color-primary': '#c9d3e0',
      '--color-on-primary': '#12161c',
      '--color-done': '#7cc8a2',
      '--color-on-done': '#0d1a13',
      '--color-focus': '#79aefc',
    },
  },
}
