/**
 * Pose de l'alpiniste et illustration correspondante, à partir de l'état neutre
 * de progression. Fonctions pures, partagées par la scène du jour et le panorama.
 */
import type { HabitProgress } from '../../progress.ts'
import type { ClimberAssetId } from '../assets/manifest.ts'

/** Pose dessinée par la forme provisoire. */
export type Pose = 'rest' | 'walk' | 'bivouac' | 'tent' | 'celebrate'

const POSES: Record<HabitProgress['state'], Pose> = {
  idle: 'rest',
  done: 'walk',
  recoverable: 'bivouac',
  missed: 'tent',
  celebrating: 'celebrate',
}

export function poseFor(progress: Pick<HabitProgress, 'state'>): Pose {
  return POSES[progress.state]
}

const POSE_ASSETS: Record<Pose, ClimberAssetId> = {
  rest: 'climber-rest',
  walk: 'climber-walk',
  bivouac: 'climber-recovery',
  tent: 'climber-tent',
  celebrate: 'climber-celebrate',
}

/** Illustration correspondant à une pose. */
export function assetForPose(pose: Pose): ClimberAssetId {
  return POSE_ASSETS[pose]
}

/**
 * Illustration de l'alpiniste (Doc 07, section 6). Arrivé au bout du cycle sans
 * célébration en cours, il attend au sommet, prêt à partir vers la montagne suivante.
 */
export function climberAssetFor(progress: Pick<HabitProgress, 'state' | 'position'>): ClimberAssetId {
  const pose = poseFor(progress)
  if ((pose === 'rest' || pose === 'walk') && progress.position >= 1) return 'climber-summit'
  return assetForPose(pose)
}
