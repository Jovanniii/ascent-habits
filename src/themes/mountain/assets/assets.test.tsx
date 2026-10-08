// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PERFORMANCE_BUDGET } from './budget.ts'
import { ASSET_MANIFEST, CLIMBER_STATES, PLANE_LIGHTS, assetFileName, isAssetId } from './manifest.ts'
import { DISCOVERED_ASSETS, resolveAsset, unknownAssetFiles } from './resolve.ts'
import { SceneAsset } from './SceneAsset.tsx'
import { checkSvg } from './svgOptimizer.ts'

afterEach(cleanup)

/** Contenu des illustrations livrées (texte brut), pour les contrôles de poids. */
const SOURCES = import.meta.glob<string>('./svg/*.svg', { eager: true, query: '?raw', import: 'default' })

describe('manifeste des illustrations', () => {
  it('liste chaque asset du Doc 07, une seule fois, avec un nom de fichier sûr', () => {
    const ids = ASSET_MANIFEST.map((asset) => asset.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(assetFileName(id)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.svg$/)
    // 4 plans × 3 lumières, 6 états, camp, 2 flammes, 4 obstacles, sommet, drapeau, fanion, 3 icônes.
    expect(ASSET_MANIFEST.filter((a) => a.group === 'plane')).toHaveLength(4 * PLANE_LIGHTS.length)
    expect(ASSET_MANIFEST.filter((a) => a.group === 'climber')).toHaveLength(CLIMBER_STATES.length)
    expect(ASSET_MANIFEST.filter((a) => a.group === 'flame')).toHaveLength(2)
    expect(ASSET_MANIFEST.filter((a) => a.group === 'obstacle')).toHaveLength(4)
    expect(ASSET_MANIFEST.filter((a) => a.group === 'calendar')).toHaveLength(3)
    for (const id of ['camp', 'summit-flag', 'goal-summit', 'pennant']) expect(isAssetId(id)).toBe(true)
    expect(isAssetId('alpiniste')).toBe(false)
  })

  it('donne des dimensions et une description à chaque asset', () => {
    for (const asset of ASSET_MANIFEST) {
      expect(asset.width).toBeGreaterThan(0)
      expect(asset.height).toBeGreaterThan(0)
      expect(asset.description.length).toBeGreaterThan(5)
    }
  })
})

describe('repli quand une illustration manque', () => {
  const available = { './svg/camp.svg': '/assets/camp-123.svg' }

  it('trouve un fichier livré et renvoie null pour un fichier absent', () => {
    expect(resolveAsset('camp', available)).toBe('/assets/camp-123.svg')
    expect(resolveAsset('climber-rest', available)).toBeNull()
    expect(resolveAsset('climber-rest', {})).toBeNull()
  })

  it('signale les fichiers livrés qui ne sont pas dans le manifeste', () => {
    const files = { ...available, './svg/alpiniste.svg': '/x.svg' }
    expect(unknownAssetFiles(files, (name) => isAssetId(name.replace(/\.svg$/, '')))).toEqual(['alpiniste.svg'])
  })

  it('dessine la forme provisoire quand le fichier est absent', () => {
    const { container } = render(
      <svg>
        <SceneAsset id="climber-rest" x={0} y={0} width={10} height={10} available={{}}>
          <circle className="provisional" r="2" />
        </SceneAsset>
      </svg>,
    )
    expect(container.querySelector('.provisional')).not.toBeNull()
    expect(container.querySelector('image')).toBeNull()
  })

  it('affiche l’illustration quand elle existe, et retombe sur la forme si elle ne se charge pas', () => {
    const { container } = render(
      <svg>
        <SceneAsset id="camp" x={-6} y={-12} width={12} height={12} available={available}>
          <circle className="provisional" r="2" />
        </SceneAsset>
      </svg>,
    )
    const image = container.querySelector('image')!
    expect(image).toHaveAttribute('href', '/assets/camp-123.svg')
    expect(image).toHaveAttribute('data-asset', 'camp')
    expect(container.querySelector('.provisional')).toBeNull()

    fireEvent.error(image)
    expect(container.querySelector('image')).toBeNull()
    expect(container.querySelector('.provisional')).not.toBeNull()
  })

  it('pose la classe demandée sur l’illustration (mêmes animations que la forme provisoire)', () => {
    const { container } = render(
      <svg>
        <SceneAsset id="camp" x={0} y={0} width={12} height={12} available={available} className="task-obstacle__shape" />
      </svg>,
    )
    expect(container.querySelector('image')).toHaveClass('task-obstacle__shape')
  })
})

describe('illustrations livrées', () => {
  it('portent toutes un nom du manifeste', () => {
    expect(unknownAssetFiles(DISCOVERED_ASSETS, (name) => isAssetId(name.replace(/\.svg$/, '')))).toEqual([])
  })

  it.each(Object.entries(SOURCES))('%s respecte les règles et le budget', (_path, content) => {
    expect(checkSvg(content).issues).toEqual([])
    expect(new TextEncoder().encode(content).length).toBeLessThanOrEqual(PERFORMANCE_BUDGET.sceneAssetMaxBytes)
  })

  it('restent dans le poids total de la scène', () => {
    const total = Object.values(SOURCES).reduce((sum, content) => sum + new TextEncoder().encode(content).length, 0)
    expect(total).toBeLessThanOrEqual(PERFORMANCE_BUDGET.sceneAssetsTotalBytes)
  })
})
