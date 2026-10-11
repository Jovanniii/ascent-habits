/**
 * Grand décor « Cordée » (Doc 08) : une seule grande montagne, une voie par
 * habitude et par objectif, un village vivant au premier plan. Décoratif
 * (aria-hidden) : l'interface donne les mêmes informations en texte.
 *
 * Avec les animations, la scène vit en continu (nuages, brume, neige,
 * randonneurs) ; sans elles, une image fixe est redessinée seulement quand les
 * données, l'heure ou la taille changent.
 */
import { useEffect, useMemo, useRef } from 'react'
import type { SceneProps } from '../../../types.ts'
import { SceneRenderer } from './renderer.ts'
import { buildTracks } from './tracks.ts'
import { normalizeHour } from './sky.ts'

export function CordeeScene({ habits, goals, pendingTasks, hour, variant, motionAllowed }: SceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<SceneRenderer | null>(null)
  const tracks = useMemo(() => buildTracks(habits, goals), [habits, goals])
  const input = useMemo(
    () => ({ tracks, pendingTasks: Math.max(0, Math.floor(pendingTasks)), hour: normalizeHour(hour), motion: motionAllowed, variant }),
    [tracks, pendingTasks, hour, motionAllowed, variant],
  )
  const latest = useRef(input)

  // Création du moteur de rendu et suivi de la taille du cadre.
  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const scene = new SceneRenderer(context)
    renderer.current = scene
    scene.setInput(latest.current)
    const fit = () => {
      const box = element.getBoundingClientRect()
      scene.resize(box.width, box.height, window.devicePixelRatio || 1)
      scene.render(0)
    }
    fit()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null
    observer?.observe(element)
    return () => {
      observer?.disconnect()
      renderer.current = null
    }
  }, [])

  // Nouvelles données : la scène les reprend ; image fixe sans animation.
  useEffect(() => {
    latest.current = input
    renderer.current?.setInput(input)
    if (!input.motion) renderer.current?.render(0)
  }, [input])

  // Boucle d'animation, seulement si les animations sont permises.
  useEffect(() => {
    if (!motionAllowed || typeof requestAnimationFrame !== 'function') return
    let id = 0
    let last = performance.now()
    const loop = (now: number) => {
      renderer.current?.render((now - last) / 1000)
      last = now
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [motionAllowed])

  return (
    <div
      className="cordee-scene"
      data-variant={variant}
      data-motion={motionAllowed ? 'on' : 'off'}
      data-tracks={tracks.length}
      data-waiting={Math.min(input.pendingTasks, 12)}
      aria-hidden="true"
    >
      <canvas ref={canvas} className="cordee-scene__canvas" />
    </div>
  )
}
