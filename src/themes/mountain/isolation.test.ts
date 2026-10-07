import { describe, expect, it } from 'vitest'

/**
 * Garde-fou : aucune référence à la montagne en dehors de ce dossier (CLAUDE.md).
 * Le moteur, le stockage, l'interface et les autres thèmes restent neutres.
 * Seul le test de pureté du moteur est exclu : il contient la liste des mots interdits.
 */
const sources = import.meta.glob(
  ['/src/**/*.{ts,tsx,css}', '!/src/themes/mountain/**', '!/src/engine/purity.test.ts'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const VOCABULARY =
  /\b(montagnes?|mountains?|alpinist\w*|alpinis\w*|climb\w*|sommets?|summits?|bivouacs?|camps?|neiges?|snow\w*|peaks?)\b/i

/** Découpe les identifiants composés (camelCase, SNAKE_CASE, kebab-case) en mots. */
function words(content: string): string {
  return content
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
}

export function mentionsMountain(content: string): boolean {
  return VOCABULARY.test(words(content))
}

describe('détecteur de vocabulaire', () => {
  it('repère les mots et les identifiants composés', () => {
    for (const sample of ['la montagne', 'MountainScene', 'SUMMIT_DAYS', 'isSummit', 'snowCapPath', 'campDays', 'peakY', 'mountain-scene']) {
      expect(mentionsMountain(sample), sample).toBe(true)
    }
  })

  it('accepte les mots courants proches', () => {
    for (const sample of ['il tente de cocher', 'en attente', 'campagne', 'speaker', 'Ascent']) {
      expect(mentionsMountain(sample), sample).toBe(false)
    }
  })
})

describe('isolation du thème montagne', () => {
  it('analyse bien les sources de l’application', () => {
    const paths = Object.keys(sources)
    expect(paths.length).toBeGreaterThan(40)
    expect(paths.some((path) => path.startsWith('/src/engine/'))).toBe(true)
    expect(paths.some((path) => path.endsWith('.css'))).toBe(true)
    expect(paths.some((path) => path.startsWith('/src/themes/mountain/'))).toBe(false)
  })

  it.each(Object.entries(sources))('%s ne mentionne pas la montagne', (_path, content) => {
    expect(mentionsMountain(content)).toBe(false)
  })
})
