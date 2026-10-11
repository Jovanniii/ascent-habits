import { useEffect, useState } from 'react'
import type { AmbianceMode } from '../../themes/index.ts'
import { useAmbianceSetting } from './useAmbiance.ts'

/** Heures retenues quand le réglage « Ambiance » fixe le moment de la journée. */
export const FIXED_DECOR_HOURS = { day: 13, night: 23 } as const

/** Heure affichée par le décor, en heures décimales (16 h 30 → 16,5). */
export function decorHour(mode: AmbianceMode, date: Date): number {
  if (mode === 'day') return FIXED_DECOR_HOURS.day
  if (mode === 'night') return FIXED_DECOR_HOURS.night
  return date.getHours() + date.getMinutes() / 60
}

/** Heure lisible : 16,5 → « 16 h 30 ». */
export function formatDecorHour(hour: number): string {
  const total = Math.round((((hour % 24) + 24) % 24) * 60) % (24 * 60)
  const minutes = total % 60
  return `${Math.floor(total / 60)} h ${String(minutes).padStart(2, '0')}`
}

/**
 * Heure réelle du décor, en dégradé continu (journal, DA-D4) : recalculée chaque
 * minute et au retour sur l'application. Le réglage « Ambiance » peut la fixer.
 */
export function useDecorHour(now: () => Date): number {
  const mode = useAmbianceSetting()?.mode ?? 'auto'
  const [hour, setHour] = useState(() => decorHour(mode, now()))

  useEffect(() => {
    const refresh = () => setHour(decorHour(mode, now()))
    refresh()
    if (mode !== 'auto') return
    const timer = setInterval(refresh, 60_000)
    const onVisible = () => {
      if (document.visibilityState !== 'hidden') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [mode, now])

  return hour
}
