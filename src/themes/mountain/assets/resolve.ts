/**
 * Chargement des illustrations du thème, avec repli automatique.
 *
 * Les fichiers présents dans assets/svg/ sont découverts à la compilation : un
 * fichier ajouté est pris en compte sans toucher au code, un fichier absent fait
 * retomber la scène sur sa forme provisoire. Les petits fichiers sont intégrés
 * au code par Vite, les autres sont servis à part et mis en cache hors ligne.
 */
import { assetFileName, type AssetId } from './manifest.ts'

/** Fichiers disponibles : chemin relatif (« ./svg/camp.svg ») → adresse publiée. */
export type AvailableAssets = Readonly<Record<string, string>>

const DISCOVERED: AvailableAssets = import.meta.glob<string>('./svg/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** Adresse du fichier d'un asset, ou null s'il n'est pas (encore) livré. */
export function resolveAsset(id: AssetId, available: AvailableAssets = DISCOVERED): string | null {
  return available[`./svg/${assetFileName(id)}`] ?? null
}

/** Fichiers livrés qui ne correspondent à aucun asset du manifeste (nom mal orthographié…). */
export function unknownAssetFiles(
  available: AvailableAssets,
  isKnown: (fileName: string) => boolean,
): string[] {
  return Object.keys(available)
    .map((path) => path.replace(/^\.\/svg\//, ''))
    .filter((fileName) => !isKnown(fileName))
}

export const DISCOVERED_ASSETS = DISCOVERED
