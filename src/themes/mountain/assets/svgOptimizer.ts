/**
 * Optimisation et contrôle des illustrations SVG, sans dépendance.
 *
 * Utilisé par scripts/optimize-svg.ts (et testé ici) : retire ce que les logiciels
 * de dessin ajoutent (commentaires, métadonnées, attributs d'éditeur), arrondit
 * les coordonnées, compacte les espaces ; puis signale ce qui est interdit dans
 * une illustration de l'application (scripts, liens externes, images bitmap,
 * filtres, animations SMIL). Ce n'est pas un analyseur XML complet : il vise les
 * fichiers exportés par Figma, Illustrator ou Inkscape.
 */

export interface SvgCheck {
  /** Problèmes bloquants : le fichier ne doit pas être livré tel quel. */
  issues: string[]
  /** Taille du viewBox, si elle est lisible. */
  viewBox: { width: number; height: number } | null
}

export interface SvgOptimization extends SvgCheck {
  svg: string
  bytesBefore: number
  bytesAfter: number
}

/** Préfixes d'attributs et d'éléments propres aux éditeurs. */
const EDITOR_PREFIXES = ['inkscape', 'sodipodi', 'sketch', 'serif', 'figma', 'illustrator', 'i', 'x', 'graph', 'a']

/** Attributs numériques arrondis (coordonnées, tailles, chemins). */
const NUMERIC_ATTRIBUTES = [
  'd',
  'points',
  'transform',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'stroke-width',
  'offset',
  'viewBox',
]

const FORBIDDEN: readonly [RegExp, string][] = [
  [/<script\b/i, 'contient un script'],
  [/\son[a-z]+\s*=/i, 'contient un gestionnaire d’événement (on…)'],
  [/<foreignObject\b/i, 'contient un foreignObject'],
  [/<image\b/i, 'contient une image intégrée (bitmap ou SVG externe)'],
  [/<(animate|animateTransform|animateMotion|set)\b/i, 'contient une animation SMIL (les animations passent par CSS)'],
  [/<filter\b/i, 'contient un filtre SVG (coûteux sur téléphone)'],
  [/<text\b/i, 'contient du texte (non traduisible, à vectoriser)'],
  [/\bhref\s*=\s*["'](?!#)/i, 'contient un lien externe (seuls les liens internes « #id » sont permis)'],
  [/url\(\s*(?!["']?#)/i, 'référence une ressource externe dans url()'],
  [/@import\b/i, 'contient un @import'],
]

function roundNumbers(value: string, precision: number): string {
  return value.replace(/-?\d*\.\d+(?:e-?\d+)?/gi, (match) => {
    const rounded = Number(Number(match).toFixed(precision))
    return String(Object.is(rounded, -0) ? 0 : rounded)
  })
}

/** Contrôle un SVG sans le modifier. */
export function checkSvg(source: string): SvgCheck {
  const issues: string[] = []
  if (!/<svg\b/i.test(source)) issues.push('n’est pas un fichier SVG')
  for (const [pattern, message] of FORBIDDEN) {
    if (pattern.test(source)) issues.push(message)
  }
  const match = /<svg\b[^>]*\bviewBox\s*=\s*["']\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(source)
  const viewBox = match ? { width: Number(match[3]), height: Number(match[4]) } : null
  if (!viewBox) issues.push('n’a pas de viewBox (les proportions doivent être fixées)')
  return { issues, viewBox }
}

/** Optimise un SVG (déterministe : l'appliquer deux fois ne change plus rien). */
export function optimizeSvg(source: string, precision = 2): SvgOptimization {
  let svg = source
    // Prologue XML, doctype, commentaires.
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Métadonnées, titres et descriptions : l'illustration est décorative (aria-hidden).
    .replace(/<(metadata|title|desc)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(metadata|title|desc)\b[^>]*\/>/gi, '')

  const prefixes = EDITOR_PREFIXES.join('|')
  svg = svg
    // Éléments d'éditeur (<sodipodi:namedview …/> ou avec contenu).
    .replace(new RegExp(`<(${prefixes}):[\\w-]+\\b[^>]*\\/>`, 'gi'), '')
    .replace(new RegExp(`<((?:${prefixes}):[\\w-]+)\\b[^>]*>[\\s\\S]*?<\\/\\1>`, 'gi'), '')
    // Déclarations d'espaces de noms et attributs d'éditeur.
    .replace(new RegExp(`\\s+xmlns:(${prefixes})\\s*=\\s*"[^"]*"`, 'gi'), '')
    .replace(new RegExp(`\\s+(${prefixes}):[\\w-]+\\s*=\\s*"[^"]*"`, 'gi'), '')
    .replace(/\s+data-name\s*=\s*"[^"]*"/gi, '')
    // xlink n'est plus nécessaire quand il n'est pas utilisé.
    .replace(/\s+xmlns:xlink\s*=\s*"[^"]*"/gi, (m) => (/xlink:href/.test(svg) ? m : ''))

  // Arrondi des valeurs numériques.
  svg = svg.replace(
    new RegExp(`\\s(${NUMERIC_ATTRIBUTES.join('|')})\\s*=\\s*"([^"]*)"`, 'g'),
    (_m, name: string, value: string) => ` ${name}="${roundNumbers(value, precision).replace(/\s+/g, ' ').trim()}"`,
  )

  svg = svg
    // Groupes et définitions vides.
    .replace(/<defs\s*\/>|<defs>\s*<\/defs>/gi, '')
    .replace(/<g\s*\/>|<g>\s*<\/g>/gi, '')
    // Espaces entre les balises, et en fin de fichier.
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const check = checkSvg(svg)
  return {
    svg: `${svg}\n`,
    bytesBefore: new TextEncoder().encode(source).length,
    bytesAfter: new TextEncoder().encode(`${svg}\n`).length,
    ...check,
  }
}
