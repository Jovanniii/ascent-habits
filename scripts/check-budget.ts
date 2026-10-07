/**
 * Vérifie le budget de performance sur le build (dist/) : à lancer après
 * « npm run build ». Voir docs/pipeline-assets.md, section « Budget ».
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { PERFORMANCE_BUDGET } from '../src/themes/mountain/assets/budget.ts'

const ASSETS = join(import.meta.dirname, '..', 'dist', 'assets')
const files = readdirSync(ASSETS)

function sum(extension: string, measure: (bytes: Buffer) => number): number {
  return files
    .filter((name) => name.endsWith(extension))
    .reduce((total, name) => total + measure(readFileSync(join(ASSETS, name))), 0)
}

const raw = (bytes: Buffer) => bytes.length
const gzip = (bytes: Buffer) => gzipSync(bytes, { level: 9 }).length

const checks: [string, number, number][] = [
  ['JavaScript (gzip)', sum('.js', gzip), PERFORMANCE_BUDGET.jsGzipBytes],
  ['CSS (gzip)', sum('.css', gzip), PERFORMANCE_BUDGET.cssGzipBytes],
  ['Polices woff2', sum('.woff2', raw), PERFORMANCE_BUDGET.fontsTotalBytes],
  ['Illustrations SVG servies à part', sum('.svg', raw), PERFORMANCE_BUDGET.sceneAssetsTotalBytes],
]

let failed = false
for (const [label, bytes, budget] of checks) {
  const ok = bytes <= budget
  failed ||= !ok
  const kb = (n: number) => `${(n / 1024).toFixed(1)} Ko`
  console[ok ? 'log' : 'error'](`${ok ? '✓' : '✗'} ${label} : ${kb(bytes)} / ${kb(budget)}`)
}
if (failed) process.exit(1)
