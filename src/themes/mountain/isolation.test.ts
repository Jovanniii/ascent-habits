import { describe, expect, it } from 'vitest'

/**
 * Garde-fou : aucune référence à la montagne en dehors de ce dossier (CLAUDE.md).
 * Le moteur, le stockage, l'interface et les autres thèmes restent neutres.
 * Ce fichier est le seul autorisé à contenir ce vocabulaire hors du dossier… car il y est.
 */
const sources = import.meta.glob(['/src/**/*.{ts,tsx,css}', '!/src/themes/mountain/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const VOCABULARY =
  /\b(montagnes?|mountains?|alpinist\w*|alpinis\w*|climb\w*|sommets?|summits?|bivouacs?|tentes?|camps?|neiges?|snow|peaks?)\b/i

describe('isolation du thème montagne', () => {
  it('analyse bien les sources de l’application', () => {
    const paths = Object.keys(sources)
    expect(paths.length).toBeGreaterThan(40)
    expect(paths.some((path) => path.startsWith('/src/engine/'))).toBe(true)
    expect(paths.some((path) => path.startsWith('/src/ui/'))).toBe(true)
    expect(paths.some((path) => path.startsWith('/src/themes/mountain/'))).toBe(false)
  })

  it.each(Object.entries(sources))('%s ne mentionne pas la montagne', (_path, content) => {
    expect(content).not.toMatch(VOCABULARY)
  })
})
