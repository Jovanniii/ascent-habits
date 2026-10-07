/**
 * Budget de performance du thème (docs/pipeline-assets.md, section « Budget »).
 *
 * Vérifié automatiquement : par les tests pour les illustrations sources, et par
 * scripts/check-budget.ts sur le build (étape de la CI). Ce fichier n'importe rien.
 */
const KB = 1024

export const PERFORMANCE_BUDGET = {
  /** Une illustration SVG, une fois optimisée. */
  sceneAssetMaxBytes: 12 * KB,
  /** Toutes les illustrations de la scène réunies (le poids de la scène). */
  sceneAssetsTotalBytes: 150 * KB,
  /** Polices du thème (woff2), toutes graisses. */
  fontsTotalBytes: 40 * KB,
  /** JavaScript de l'application, compressé (gzip). */
  jsGzipBytes: 130 * KB,
  /** Feuilles de style, compressées (gzip). */
  cssGzipBytes: 12 * KB,
} as const
