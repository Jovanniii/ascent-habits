/**
 * Optimise les illustrations du thème montagne et vérifie leur nommage.
 *
 *   npm run assets:optimize            optimise les fichiers sur place
 *   npm run assets:check               vérifie sans rien modifier (CI)
 *   node scripts/optimize-svg.ts a.svg traite seulement les fichiers donnés
 *
 * Voir docs/pipeline-assets.md.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { PERFORMANCE_BUDGET } from '../src/themes/mountain/assets/budget.ts'
import { ASSET_MANIFEST, isAssetId } from '../src/themes/mountain/assets/manifest.ts'
import { optimizeSvg } from '../src/themes/mountain/assets/svgOptimizer.ts'

const ASSET_DIR = join(import.meta.dirname, '..', 'src', 'themes', 'mountain', 'assets', 'svg')

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const files = args.filter((arg) => !arg.startsWith('--'))
const targets = files.length > 0 ? files : readdirSync(ASSET_DIR).filter((name) => name.endsWith('.svg')).map((name) => join(ASSET_DIR, name))

let failures = 0
let total = 0
for (const path of targets) {
  const name = basename(path, '.svg')
  const source = readFileSync(path, 'utf8')
  const result = optimizeSvg(source)
  const problems = [...result.issues]
  if (!isAssetId(name)) problems.push('nom absent du manifeste (attendu : <id>.svg, voir manifest.ts)')
  const spec = ASSET_MANIFEST.find((asset) => asset.id === name)
  if (spec && result.viewBox) {
    const expected = spec.width / spec.height
    const actual = result.viewBox.width / result.viewBox.height
    if (Math.abs(actual - expected) / expected > 0.02) {
      problems.push(`proportions ${result.viewBox.width} × ${result.viewBox.height}, attendu ${spec.width} × ${spec.height}`)
    }
  }
  if (result.bytesAfter > PERFORMANCE_BUDGET.sceneAssetMaxBytes) {
    problems.push(`${result.bytesAfter} octets, budget ${PERFORMANCE_BUDGET.sceneAssetMaxBytes}`)
  }
  if (checkOnly && result.svg !== source) problems.push('pas encore optimisé (lancer npm run assets:optimize)')
  if (!checkOnly && result.svg !== source) writeFileSync(path, result.svg)
  total += result.bytesAfter

  const sizes = `${result.bytesBefore} → ${result.bytesAfter} octets`
  if (problems.length > 0) {
    failures += 1
    console.error(`✗ ${basename(path)} (${sizes})\n  - ${problems.join('\n  - ')}`)
  } else {
    console.log(`✓ ${basename(path)} (${sizes})`)
  }
}

if (total > PERFORMANCE_BUDGET.sceneAssetsTotalBytes) {
  failures += 1
  console.error(`✗ Poids total de la scène : ${total} octets, budget ${PERFORMANCE_BUDGET.sceneAssetsTotalBytes}`)
}
console.log(`${targets.length} illustration(s), ${total} octets au total.`)
if (failures > 0) process.exit(1)
