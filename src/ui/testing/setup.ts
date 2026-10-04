/**
 * Préparation commune des tests d'interface (environnement jsdom).
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom n'implémente pas le défilement.
window.scrollTo = vi.fn() as typeof window.scrollTo

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-motion')
})
