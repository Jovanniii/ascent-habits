import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  DEFAULT_AMBIANCE_MODE,
  msUntilNextDayPeriod,
  parseAmbianceMode,
  resolveDayPeriod,
  type AmbianceMode,
  type DayPeriod,
} from '../../themes/index.ts'

/**
 * Préférence propre à l'appareil, hors des données de l'application : elle n'est
 * ni exportée ni importée (pas de changement du schéma, journal P5-D4).
 */
export type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>

export const AMBIANCE_STORAGE_KEY = 'ascent:ambiance'

function readMode(storage: PreferenceStorage | undefined): AmbianceMode {
  try {
    return parseAmbianceMode(storage?.getItem(AMBIANCE_STORAGE_KEY))
  } catch {
    return DEFAULT_AMBIANCE_MODE
  }
}

export interface Ambiance {
  mode: AmbianceMode
  period: DayPeriod
  setMode: (mode: AmbianceMode) => void
}

/**
 * Réglage « Ambiance » et moment de la journée affiché. En automatique, le moment
 * est recalculé au prochain changement d'heure prévu et au retour sur l'application
 * (une PWA peut rester ouverte en arrière-plan).
 */
export function useAmbiance(now: () => Date, storage?: PreferenceStorage): Ambiance {
  const [mode, setModeState] = useState(() => readMode(storage))
  const [period, setPeriod] = useState(() => resolveDayPeriod(mode, now()))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      const current = now()
      setPeriod(resolveDayPeriod(mode, current))
      // Une seconde de marge : le prochain calcul tombe bien dans le nouveau moment.
      if (mode === 'auto') timer = setTimeout(refresh, msUntilNextDayPeriod(current) + 1000)
    }
    const onVisible = () => {
      if (document.visibilityState !== 'hidden') refresh()
    }
    // L'état initial est déjà juste au montage : on attend le prochain changement.
    if (mode === 'auto') timer = setTimeout(refresh, msUntilNextDayPeriod(now()) + 1000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [mode, now])

  const setMode = useCallback(
    (next: AmbianceMode) => {
      setModeState(next)
      setPeriod(resolveDayPeriod(next, now()))
      try {
        storage?.setItem(AMBIANCE_STORAGE_KEY, next)
      } catch {
        // Stockage indisponible : le réglage vaut jusqu'à la fermeture.
      }
    },
    [now, storage],
  )

  return { mode, period, setMode }
}

/** Réglage « Ambiance » transmis aux écrans (l'écran Réglages le modifie). */
export const AmbianceSettingContext = createContext<Ambiance | null>(null)

export function useAmbianceSetting(): Ambiance | null {
  return useContext(AmbianceSettingContext)
}
