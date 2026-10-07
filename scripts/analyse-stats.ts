/**
 * Analyse des statistiques anonymes envoyées volontairement par les testeurs.
 *
 * Usage : npm run stats:analyse -- <dossier>
 *   (ou : node scripts/analyse-stats.ts <dossier>, Node 22.18 ou plus récent)
 *
 * Le dossier contient les fichiers « ascent-statistiques-anonymes-*.json »
 * (un fichier par testeur : garder le plus récent si un testeur en envoie plusieurs).
 * Le rapport est écrit en Markdown sur la sortie standard ; les fichiers ignorés
 * sont signalés sur la sortie d'erreur. Aucune donnée n'est envoyée nulle part.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { analyzeStats, formatStatsReport, parseAnonymousStats, type AnonymousStats } from '../src/storage/anonymousStats.ts'

async function main(): Promise<number> {
  const folder = process.argv[2]
  if (!folder) {
    console.error('Usage : npm run stats:analyse -- <dossier contenant les fichiers JSON>')
    return 2
  }

  const names = (await readdir(folder)).filter((name) => name.toLowerCase().endsWith('.json')).sort()
  const files: AnonymousStats[] = []
  for (const name of names) {
    let raw: unknown
    try {
      raw = JSON.parse(await readFile(join(folder, name), 'utf8'))
    } catch {
      console.error(`Ignoré (JSON illisible) : ${name}`)
      continue
    }
    const stats = parseAnonymousStats(raw)
    if (stats) files.push(stats)
    else console.error(`Ignoré (pas un fichier de statistiques anonymes Ascent) : ${name}`)
  }

  console.log(`# Statistiques anonymes Ascent\n`)
  console.log(formatStatsReport(analyzeStats(files)))
  return 0
}

process.exitCode = await main()
