/**
 * Obstacles du sentier : chaque tâche à faire est dessinée comme un obstacle.
 * La variante est choisie de façon stable à partir de l'identifiant de la tâche :
 * une même tâche garde le même obstacle d'une ouverture à l'autre, sans rien
 * enregistrer dans les données.
 */

export const OBSTACLE_VARIANTS = ['rock', 'low-cloud', 'branch', 'scree'] as const

export type ObstacleVariant = (typeof OBSTACLE_VARIANTS)[number]

/** Empreinte FNV-1a sur 32 bits : déterministe, rapide et bien répartie pour des identifiants courts. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

export function obstacleVariant(taskId: string): ObstacleVariant {
  return OBSTACLE_VARIANTS[fnv1a(taskId) % OBSTACLE_VARIANTS.length]!
}
