/**
 * Préparation commune des tests d'interface (environnement jsdom).
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom n'implémente pas le défilement.
window.scrollTo = vi.fn() as typeof window.scrollTo

// jsdom n'implémente pas le dessin sur canevas : le décor dessiné reste vide.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext

/** Préférence système simulée « réduire les animations », modifiable par les tests. */
export const reducedMotion = {
  matches: false,
  listeners: new Set<() => void>(),
  set(value: boolean) {
    this.matches = value
    this.listeners.forEach((listener) => listener())
  },
}

// jsdom n'implémente pas matchMedia : seule la requête de mouvement réduit est simulée.
window.matchMedia = ((query: string) => ({
  get matches() {
    return query.includes('prefers-reduced-motion: reduce') ? reducedMotion.matches : false
  },
  media: query,
  onchange: null,
  addEventListener: (_type: string, listener: () => void) => reducedMotion.listeners.add(listener),
  removeEventListener: (_type: string, listener: () => void) => reducedMotion.listeners.delete(listener),
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia

afterEach(() => {
  cleanup()
  reducedMotion.matches = false
  reducedMotion.listeners.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-motion')
})
