/**
 * Affiche un asset du manifeste dans une scène SVG, ou sa forme provisoire
 * (children) si le fichier est absent ou ne se charge pas.
 */
import { useState, type ReactNode } from 'react'
import type { AssetId } from './manifest.ts'
import { resolveAsset, type AvailableAssets } from './resolve.ts'

interface Props {
  id: AssetId
  /** Cadre de l'image dans le repère de la scène. */
  x: number
  y: number
  width: number
  height: number
  /** Forme provisoire, dessinée tant que l'illustration n'est pas disponible. */
  children?: ReactNode
  /** Fichiers disponibles (tests). */
  available?: AvailableAssets
  /**
   * Classe posée sur l'illustration, pour qu'elle reçoive les mêmes animations
   * que la forme provisoire (ex. disparition d'un obstacle de tâche).
   */
  className?: string
}

export function SceneAsset({ id, x, y, width, height, children = null, available, className }: Props) {
  const url = resolveAsset(id, available)
  // Échec mémorisé par adresse : une autre variante (lumière, état) retente le chargement.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  if (url === null || failedUrl === url) return <>{children}</>
  return (
    <image
      href={url}
      x={x}
      y={y}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMax meet"
      className={className}
      data-asset={id}
      onError={() => setFailedUrl(url)}
    />
  )
}
