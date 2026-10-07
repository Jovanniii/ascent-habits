import { describe, expect, it } from 'vitest'
import { checkSvg, optimizeSvg } from './svgOptimizer.ts'

const EXPORTED = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   viewBox="0 0 24.000000 32.000000" inkscape:version="1.3">
  <title>Alpiniste</title>
  <metadata><rdf>…</rdf></metadata>
  <sodipodi:namedview id="base" pagecolor="#ffffff" />
  <defs></defs>
  <g inkscape:label="Calque 1" data-name="corps">
    <path d="M 12.123456 31.999999 L 3.3333333 10.0001 Z" fill="#e8573c" />
    <circle cx="12.0049" cy="5.55555" r="3.14159" fill="#e8573c"/>
  </g>
  <g></g>
</svg>
`

describe('optimisation SVG', () => {
  it('retire les ajouts des logiciels de dessin et arrondit les coordonnées', () => {
    const result = optimizeSvg(EXPORTED)
    expect(result.svg).not.toMatch(/<\?xml|<!--|<title|<metadata|sodipodi|inkscape|data-name|<defs>|<g><\/g>/)
    expect(result.svg).toContain('viewBox="0 0 24 32"')
    expect(result.svg).toContain('d="M 12.12 32 L 3.33 10 Z"')
    expect(result.svg).toContain('cx="12" cy="5.56" r="3.14"')
    expect(result.issues).toEqual([])
    expect(result.viewBox).toEqual({ width: 24, height: 32 })
    expect(result.bytesAfter).toBeLessThan(result.bytesBefore)
  })

  it('est stable : une deuxième passe ne change rien', () => {
    const once = optimizeSvg(EXPORTED).svg
    expect(optimizeSvg(once).svg).toBe(once)
  })

  it('garde les références internes (dégradés)', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="a"/></defs><rect fill="url(#a)" width="10" height="10"/><use href="#a"/></svg>'
    expect(checkSvg(svg).issues).toEqual([])
  })

  it.each([
    ['<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>', 'script'],
    ['<svg viewBox="0 0 1 1" onload="x()"></svg>', 'gestionnaire'],
    ['<svg viewBox="0 0 1 1"><image href="photo.png"/></svg>', 'image'],
    ['<svg viewBox="0 0 1 1"><use href="https://exemple.fr/a.svg#b"/></svg>', 'lien externe'],
    ['<svg viewBox="0 0 1 1"><rect fill="url(\'https://exemple.fr/x\')"/></svg>', 'url()'],
    ['<svg viewBox="0 0 1 1"><animate attributeName="x"/></svg>', 'SMIL'],
    ['<svg viewBox="0 0 1 1"><filter id="f"/></svg>', 'filtre'],
    ['<svg viewBox="0 0 1 1"><text>Bonjour</text></svg>', 'texte'],
    ['<svg width="10" height="10"></svg>', 'viewBox'],
    ['<p>pas un svg</p>', 'SVG'],
  ])('refuse %s', (svg, expected) => {
    expect(checkSvg(svg).issues.join(' ')).toContain(expected)
  })
})
