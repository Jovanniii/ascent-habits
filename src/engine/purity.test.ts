import { describe, expect, it } from 'vitest'

// Garde-fou du CLAUDE.md : aucune référence au thème montagne dans le moteur.
const sources = import.meta.glob(['./**/*.ts', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const THEME_WORDS = /montagne|mountain|alpinis|climber|sommet|summit/i

describe('pureté du moteur', () => {
  it('trouve les sources à vérifier', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(5)
  })

  it.each(Object.entries(sources))('%s ne mentionne aucun élément de thème', (_path, content) => {
    expect(content).not.toMatch(THEME_WORDS)
  })
})
