import { useEffect, useState } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function systemReducesMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/**
 * Les animations sont permises si le réglage de l'application les autorise et si
 * l'appareil ne demande pas de les réduire. Le réglage de l'appareil est suivi en
 * direct, pas seulement à la première ouverture.
 */
export function useMotionAllowed(animationsEnabled: boolean): { allowed: boolean; systemReduced: boolean } {
  const [systemReduced, setSystemReduced] = useState(systemReducesMotion)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    const onChange = () => setSystemReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return { allowed: animationsEnabled && !systemReduced, systemReduced }
}
