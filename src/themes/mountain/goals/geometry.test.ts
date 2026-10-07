import { describe, expect, it } from 'vitest'
import { GOAL_VIEWBOX_HEIGHT, GOAL_VIEWBOX_WIDTH, goalLayout, pointOnTrail, stepAt } from './geometry.ts'

/** Altitude à l'écran (plus elle est grande, plus c'est haut). */
const altitude = (fraction: number) => GOAL_VIEWBOX_HEIGHT - pointOnTrail(fraction).y
const layout = (done: number, total: number, achieved = false) => goalLayout({ done, total, achieved })

describe('position de l’alpiniste et hauteur du sommet (P4-D2)', () => {
  it('sans jalon : l’alpiniste est au départ, le sommet un pas plus loin', () => {
    const l = layout(0, 0)
    expect(l.climber).toBe(0)
    expect(l.summit).toBe(stepAt(1))
    expect(l.pennants).toEqual([])
    expect(l.readyForSummit).toBe(false)
  })

  it('un jalon : un fanion entre le départ et le sommet, planté une fois terminé', () => {
    expect(layout(0, 1)).toMatchObject({ climber: 0, summit: stepAt(2), pennants: [{ at: stepAt(1), planted: false }] })
    expect(layout(1, 1)).toMatchObject({ climber: stepAt(1), summit: stepAt(2), pennants: [{ at: stepAt(1), planted: true }] })
  })

  it('jalon ajouté après une progression : l’alpiniste ne recule pas, le sommet monte', () => {
    for (const [done, total] of [
      [1, 2],
      [2, 2],
      [3, 5],
      [9, 10],
    ] as const) {
      const before = layout(done, total)
      const after = layout(done, total + 1)
      expect(after.climber).toBe(before.climber)
      expect(after.summit).toBeGreaterThan(before.summit)
      expect(altitude(after.summit)).toBeGreaterThan(altitude(before.summit))
      // Les fanions déjà plantés restent exactement à leur place.
      expect(after.pennants.slice(0, total)).toEqual(before.pennants)
    }
  })

  it('jalon supprimé : le sommet redescend ; l’alpiniste ne bouge que si le jalon était terminé', () => {
    // Jalon à faire supprimé (3 sur 5 → 3 sur 4).
    expect(layout(3, 4).climber).toBe(layout(3, 5).climber)
    expect(layout(3, 4).summit).toBeLessThan(layout(3, 5).summit)
    // Jalon terminé supprimé (3 sur 5 → 2 sur 4) : correction de l'historique, comme décocher.
    expect(layout(2, 4).climber).toBeLessThan(layout(3, 5).climber)
  })

  it('à 100 % : juste sous le sommet, l’action « atteint » est suggérée ; atteint : au sommet', () => {
    const ready = layout(4, 4)
    expect(ready.readyForSummit).toBe(true)
    expect(ready.climber).toBeLessThan(ready.summit)
    const achieved = layout(4, 4, true)
    expect(achieved.climber).toBe(achieved.summit)
    expect(achieved.readyForSummit).toBe(false)
    // Un objectif peut être marqué comme atteint à tout moment (D6).
    expect(layout(1, 4, true).climber).toBe(layout(1, 4, true).summit)
  })

  it('retour sous 100 % en ajoutant un jalon : même position, sommet plus haut', () => {
    const full = layout(4, 4)
    const more = layout(4, 5)
    expect(more.readyForSummit).toBe(false)
    expect(more.climber).toBe(full.climber)
    expect(more.summit).toBeGreaterThan(full.summit)
  })

  it('la position ne dépend que du nombre de jalons terminés et croît à chaque jalon', () => {
    for (let done = 0; done < 30; done += 1) {
      const positions = [done, done + 1, done + 7, done + 40].map((total) => layout(done, total).climber)
      expect(new Set(positions).size).toBe(1)
      expect(layout(done + 1, done + 1).climber).toBeGreaterThan(layout(done, done + 1).climber)
    }
  })

  it('garde le sommet dans le cadre, même avec beaucoup de jalons', () => {
    for (const total of [0, 1, 5, 50, 500]) {
      const top = pointOnTrail(layout(0, total).summit)
      expect(top.y).toBeGreaterThan(8)
      expect(top.x).toBeLessThan(GOAL_VIEWBOX_WIDTH)
    }
  })

  it('reste robuste face à des valeurs incohérentes', () => {
    expect(layout(5, 3).climber).toBe(stepAt(3))
    expect(layout(-1, 2).climber).toBe(0)
    expect(stepAt(Number.NaN)).toBe(0)
  })
})
