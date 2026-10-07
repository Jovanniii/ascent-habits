/**
 * Éléments de la scène, partagés par la scène du jour et le panorama. Chacun
 * affiche l'illustration du manifeste si elle est livrée, sinon sa forme
 * provisoire (formes SVG simples). Repère : pieds ou pied du mât en (0, 0).
 */
import { SceneAsset } from '../assets/SceneAsset.tsx'
import type { ClimberAssetId } from '../assets/manifest.ts'
import type { SceneLight } from './palettes.ts'
import { assetForPose, type Pose } from './poses.ts'

/** Chaînes lointaines (repère 320 × 76), prolongées de part et d'autre du cadre. */
const FAR_RANGE =
  'M-480 76 L-480 38 Q-420 24 -360 36 Q-300 22 -240 34 Q-180 20 -120 34 Q-60 22 0 38 Q30 24 64 36 Q100 20 140 34 Q186 18 232 32 Q276 22 320 34 Q380 22 440 36 Q520 20 600 34 Q680 24 800 36 L800 76 Z'
const MID_RANGE =
  'M-480 76 L-480 54 Q-400 40 -320 52 Q-240 40 -160 54 Q-80 42 0 54 Q36 40 76 52 Q112 42 150 54 Q200 46 250 56 Q290 48 320 58 Q400 44 480 54 Q560 42 640 54 Q720 44 800 54 L800 76 Z'

/**
 * Plan de montagnes 1 (lointain) ou 2 (intermédiaire), dans le repère 320 × 76 :
 * l'illustration (1280 × 120) s'étend de x = −480 à 800, posée sur le bas du cadre.
 */
export function Range({ depth, light }: { depth: 1 | 2; light: SceneLight }) {
  return (
    <SceneAsset id={`plane-${depth}-${light}`} x={-480} y={76 - 120} width={1280} height={120}>
      <path d={depth === 1 ? FAR_RANGE : MID_RANGE} className={depth === 1 ? 'mountain-scene__far' : 'mountain-scene__mid'} />
    </SceneAsset>
  )
}

export function Camp({ reached }: { reached: boolean }) {
  return (
    <g className={`mountain-scene__camp${reached ? ' is-reached' : ''}`}>
      <SceneAsset id="camp" x={-6} y={-12} width={12} height={12}>
        <path d="M-4 0 Q-2 -5 0 -6 Q2 -5 4 0 Z" className="mountain-scene__tent" />
        <rect x="3.4" y="-11" width="0.9" height="11" rx="0.4" className="mountain-scene__pole" />
        <path d="M4.3 -11 L8.5 -9.6 L4.3 -8.2 Z" className="mountain-scene__pennant" />
      </SceneAsset>
    </g>
  )
}

export function Flame({ intensity }: { intensity: 1 | 2 }) {
  const scale = intensity === 2 ? 1.35 : 1
  return (
    <g className="mountain-scene__flame" transform={`translate(-11 0) scale(${scale})`}>
      <SceneAsset id={`flame-${intensity}`} x={-3.6} y={-9} width={7.2} height={9}>
        <ellipse cx="0" cy="-3.8" rx="3.4" ry="4.4" className="mountain-scene__halo" />
        <path d="M0 -7.5 Q2.6 -4.4 1.8 -2 Q1 -0.4 0 -0.4 Q-1 -0.4 -1.8 -2 Q-2.4 -4 0 -7.5 Z" className="mountain-scene__accent" />
      </SceneAsset>
    </g>
  )
}

export function SummitFlag({ reached }: { reached: boolean }) {
  return (
    <g className={reached ? 'is-reached' : undefined}>
      <SceneAsset id="summit-flag" x={-0.5} y={-10} width={10} height={10}>
        <ellipse cx="4.6" cy="-6.6" rx="6" ry="3.8" className="mountain-scene__halo" />
        <rect x="-0.5" y="-9" width="1" height="9" rx="0.5" className="mountain-scene__pole" />
        <path d="M0.5 -9 L9 -6.6 L0.5 -4.2 Z" className="mountain-scene__summit-flag" />
      </SceneAsset>
    </g>
  )
}

/** Forme provisoire de l'alpiniste selon sa pose. */
function ProvisionalClimber({ pose }: { pose: Pose }) {
  if (pose === 'tent') {
    // Au repos à la tente : rien d'un échec, simplement une pause.
    return (
      <g className="mountain-scene__resting">
        <ellipse cx="0" cy="-4" rx="7" ry="6" className="mountain-scene__halo" />
        <path d="M-6 0 Q-3 -8 0 -9 Q3 -8 6 0 Z" className="mountain-scene__tent is-reached" />
        <circle cx="0" cy="-2.6" r="1.6" className="mountain-scene__accent" />
      </g>
    )
  }
  const sitting = pose === 'bivouac'
  return (
    <g className={`mountain-scene__body is-${pose}`}>
      <ellipse cx="0" cy={sitting ? -4.5 : -6.8} rx="3.8" ry={sitting ? 5.5 : 7.6} className="mountain-scene__halo" />
      {pose === 'bivouac' && <path d="M2 -3 Q8 -6 12 -12" className="mountain-scene__rope" />}
      <rect
        x="-1.8"
        y={sitting ? -6 : -10}
        width="3.6"
        height={sitting ? 5 : 8}
        rx="1.6"
        className="mountain-scene__accent"
        transform={pose === 'walk' ? 'rotate(12 0 0)' : undefined}
      />
      <circle cx={pose === 'walk' ? 1.6 : 0} cy={sitting ? -7.8 : -11.6} r="1.9" className="mountain-scene__accent" />
      {pose === 'celebrate' && (
        <>
          <rect x="-3.6" y="-15" width="1.1" height="5" rx="0.5" className="mountain-scene__accent" />
          <rect x="2.5" y="-15" width="1.1" height="5" rx="0.5" className="mountain-scene__accent" />
        </>
      )}
    </g>
  )
}

/** Alpiniste : `asset` précise l'illustration (ex. au sommet), sinon celle de la pose. */
export function Climber({ pose, asset = assetForPose(pose) }: { pose: Pose; asset?: ClimberAssetId }) {
  return (
    // La classe « is-<pose> » reste sur un groupe, illustration ou non, pour la respiration.
    <g className={`mountain-scene__figure is-${pose}`}>
      <SceneAsset key={asset} id={asset} x={-5} y={-13.3} width={10} height={13.3}>
        <ProvisionalClimber pose={pose} />
      </SceneAsset>
    </g>
  )
}
