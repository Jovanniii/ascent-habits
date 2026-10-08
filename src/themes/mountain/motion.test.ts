import { describe, expect, it } from 'vitest'
import goalsCss from './goals/goals.css?raw'
import tasksCss from './tasks/tasks.css?raw'

/**
 * Comme pour le panorama des habitudes (palette.test.ts) : aucune animation ni
 * transition hors du bloc « opt-in », et chaque règle animée vérifie à la fois
 * le réglage de l'application et celui de la scène.
 */
describe.each([
  ['tasks.css', tasksCss, ".task-obstacle[data-motion='on']"],
  ['goals.css', goalsCss, ".goal-summit[data-motion='on']"],
])('animations de %s', (_name, css, sceneSelector) => {
  it('ne déclare aucune animation ni transition hors du bloc « opt-in »', () => {
    const marker = '@media (prefers-reduced-motion: no-preference)'
    expect(css).toContain(marker)
    expect(css.slice(0, css.indexOf(marker))).not.toMatch(/\b(animation|transition)\s*:/)
    const rules = css.slice(css.indexOf(marker)).match(/[^{}]+\{[^{}]*\b(animation|transition)\s*:[^}]*\}/g) ?? []
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule).toContain(`:root[data-motion='full'] ${sceneSelector}`)
    }
  })
})
