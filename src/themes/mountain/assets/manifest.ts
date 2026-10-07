/**
 * Manifeste des illustrations attendues pour le thème (Doc 07, section 9).
 *
 * Chaque asset a un identifiant typé, qui est aussi son nom de fichier :
 * src/themes/mountain/assets/svg/<id>.svg. Tant qu'un fichier est absent, la
 * scène dessine sa forme provisoire (voir resolve.ts). Convention complète :
 * docs/pipeline-assets.md.
 *
 * Ce fichier n'importe que des constantes sans dépendance : le script
 * d'optimisation (scripts/optimize-svg.ts) le lit aussi pour vérifier les noms.
 */
import { OBSTACLE_VARIANTS } from '../tasks/obstacles.ts'

/** Plans de montagnes, du plus lointain (1) au premier plan (4). */
export const PLANE_DEPTHS = [1, 2, 3, 4] as const
/** Variantes de lumière des plans (le matin réutilise le jour). */
export const PLANE_LIGHTS = ['day', 'evening', 'night'] as const
/** États de l'alpiniste (Doc 07, section 6). */
export const CLIMBER_STATES = ['rest', 'walk', 'tent', 'celebrate', 'summit', 'recovery'] as const
export const FLAME_LEVELS = [1, 2] as const
/** Variantes d'obstacle de tâche (piste 4). */
export const OBSTACLE_KINDS = OBSTACLE_VARIANTS
export const CALENDAR_ICONS = ['validated', 'recovered', 'missed'] as const

export type PlaneAssetId = `plane-${(typeof PLANE_DEPTHS)[number]}-${(typeof PLANE_LIGHTS)[number]}`
export type ClimberAssetId = `climber-${(typeof CLIMBER_STATES)[number]}`
export type FlameAssetId = `flame-${(typeof FLAME_LEVELS)[number]}`
export type ObstacleAssetId = `obstacle-${(typeof OBSTACLE_KINDS)[number]}`
export type CalendarAssetId = `calendar-${(typeof CALENDAR_ICONS)[number]}`

export type AssetId =
  | PlaneAssetId
  | ClimberAssetId
  | 'camp'
  | FlameAssetId
  | ObstacleAssetId
  | 'summit-flag'
  | 'goal-summit'
  | 'pennant'
  | CalendarAssetId

export type AssetGroup = 'plane' | 'climber' | 'camp' | 'flame' | 'obstacle' | 'summit' | 'pennant' | 'calendar'

export interface AssetSpec {
  id: AssetId
  group: AssetGroup
  /** Taille du viewBox attendu (unités SVG), qui fixe les proportions. */
  width: number
  height: number
  /**
   * Point d'ancrage dans le viewBox, posé sur le décor : les pieds de l'alpiniste,
   * le pied du mât, le bas d'un plan…
   */
  anchor: 'bottom-center' | 'bottom-left'
  /** Ce que la scène dessine tant que le fichier est absent. */
  fallback: 'provisional-shape' | 'none'
  description: string
}

function spec(
  id: AssetId,
  group: AssetGroup,
  size: [number, number],
  anchor: AssetSpec['anchor'],
  fallback: AssetSpec['fallback'],
  description: string,
): AssetSpec {
  return { id, group, width: size[0], height: size[1], anchor, fallback, description }
}

const PLANE_NAMES: Record<(typeof PLANE_DEPTHS)[number], string> = {
  1: 'Chaîne lointaine',
  2: 'Chaîne intermédiaire',
  3: 'Collines proches',
  4: 'Premier plan',
}

const CLIMBER_NAMES: Record<(typeof CLIMBER_STATES)[number], string> = {
  rest: 'Alpiniste au repos (pas encore validé aujourd’hui)',
  walk: 'Alpiniste en marche (habitude validée)',
  tent: 'Pause à la tente (jour manqué, sans culpabilité)',
  celebrate: 'Célébration (palier atteint, bras levés)',
  summit: 'Au sommet, prêt à partir vers une nouvelle montagne',
  recovery: 'Récupération (rattrape le chemin, corde)',
}

const OBSTACLE_NAMES: Record<(typeof OBSTACLE_KINDS)[number], string> = {
  rock: 'rocher',
  'low-cloud': 'nuage bas',
  branch: 'branche',
  scree: 'éboulis',
}

export const ASSET_MANIFEST: readonly AssetSpec[] = [
  ...PLANE_DEPTHS.flatMap((depth) =>
    PLANE_LIGHTS.map((light) =>
      spec(
        `plane-${depth}-${light}`,
        'plane',
        [1280, 120],
        'bottom-left',
        // Les plans 1 et 2 existent déjà en forme provisoire ; 3 et 4 sont nouveaux.
        depth <= 2 ? 'provisional-shape' : 'none',
        `${PLANE_NAMES[depth]}, lumière ${light === 'day' ? 'de jour' : light === 'evening' ? 'du soir' : 'de nuit'}`,
      ),
    ),
  ),
  ...CLIMBER_STATES.map((state) =>
    spec(`climber-${state}`, 'climber', [24, 32], 'bottom-center', 'provisional-shape', CLIMBER_NAMES[state]),
  ),
  spec('camp', 'camp', [24, 24], 'bottom-center', 'provisional-shape', 'Camp de base (tente et fanion) à chaque palier'),
  ...FLAME_LEVELS.map((level) =>
    spec(
      `flame-${level}`,
      'flame',
      [16, 20],
      'bottom-center',
      'provisional-shape',
      level === 1 ? 'Flamme de série, intensité douce' : 'Flamme de série, intensité vive (premier palier atteint)',
    ),
  ),
  ...OBSTACLE_KINDS.map((kind) =>
    spec(`obstacle-${kind}`, 'obstacle', [32, 24], 'bottom-center', 'provisional-shape', `Obstacle de tâche : ${OBSTACLE_NAMES[kind]}`),
  ),
  spec('summit-flag', 'summit', [20, 20], 'bottom-left', 'provisional-shape', 'Drapeau planté au sommet d’une habitude'),
  spec('goal-summit', 'summit', [160, 120], 'bottom-center', 'none', 'Grand sommet d’objectif à l’horizon'),
  spec('pennant', 'pennant', [12, 20], 'bottom-left', 'provisional-shape', 'Fanion de jalon planté sur le chemin'),
  ...CALENDAR_ICONS.map((icon) =>
    spec(
      `calendar-${icon}`,
      'calendar',
      [24, 24],
      'bottom-center',
      'none',
      icon === 'validated'
        ? 'Calendrier : jour validé'
        : icon === 'recovered'
          ? 'Calendrier : jour rattrapé'
          : 'Calendrier : jour non validé (neutre)',
    ),
  ),
]

/** Nom de fichier attendu pour un asset. */
export function assetFileName(id: AssetId): string {
  return `${id}.svg`
}

export function isAssetId(value: string): value is AssetId {
  return ASSET_MANIFEST.some((asset) => asset.id === value)
}
