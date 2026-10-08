import { useEffect, type RefObject } from 'react'

/** Variables CSS lues par mountain.css pour décaler les plans lointains. */
export const PARALLAX_SCROLL_VAR = '--panorama-scroll'
export const PARALLAX_ROOM_VAR = '--panorama-room'

/**
 * Parallaxe léger : quand on fait défiler la rangée de montagnes, les plans
 * lointains glissent moins vite. Le hook ne fait qu'exposer la position de
 * défilement en variables CSS (une fois par image au plus) ; le décalage lui-même
 * est une transformation CSS, déclarée dans le bloc « opt-in » de mountain.css.
 *
 * Désactivé (aucun écouteur, variables retirées) si les animations sont réduites.
 */
export function useParallax(
  viewport: RefObject<HTMLElement | null>,
  scroller: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    const target = viewport.current
    const source = scroller.current
    if (!target || !source) return
    const clear = () => {
      target.style.removeProperty(PARALLAX_SCROLL_VAR)
      target.style.removeProperty(PARALLAX_ROOM_VAR)
    }
    if (!enabled) {
      clear()
      return
    }

    let frame = 0
    const write = () => {
      frame = 0
      target.style.setProperty(PARALLAX_SCROLL_VAR, String(Math.round(source.scrollLeft)))
      target.style.setProperty(PARALLAX_ROOM_VAR, String(Math.max(0, source.scrollWidth - source.clientWidth)))
    }
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(write)
    }
    write()
    source.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      source.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      clear()
    }
  }, [viewport, scroller, enabled])
}
