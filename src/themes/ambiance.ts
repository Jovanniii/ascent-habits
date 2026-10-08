/**
 * Ambiance : moment de la journée affiché par un thème (matin, jour, soir, nuit).
 *
 * Logique neutre, commune à tous les thèmes : l'interface calcule le moment à
 * partir de l'heure locale et du réglage « Ambiance », puis le transmet par un
 * contexte React. Chaque thème choisit librement comment l'habiller (palette,
 * étoiles…) ; un thème qui ne s'en sert pas l'ignore.
 *
 * Un thème peut importer ce fichier (comme types.ts et progress.ts).
 *
 * Règle d'articulation avec le mode sombre du téléphone (journal, P5-D3) : le mode
 * sombre règle l'interface (cartes, textes), l'ambiance règle seulement le décor.
 */
import { createContext, useContext } from 'react'

/** Moment de la journée, dans l'ordre de la journée. */
export type DayPeriod = 'morning' | 'day' | 'evening' | 'night'

/** Réglage « Ambiance » : selon l'heure, ou fixé. */
export type AmbianceMode = 'auto' | 'day' | 'night'

export const AMBIANCE_MODES: readonly AmbianceMode[] = ['auto', 'day', 'night']

export const DEFAULT_AMBIANCE_MODE: AmbianceMode = 'auto'

/**
 * Heure (locale) de début de chaque moment. Heures fixes, sans géolocalisation ni
 * calcul du coucher du soleil (journal, P5-D2).
 */
export const DAY_PERIOD_STARTS: Readonly<Record<DayPeriod, number>> = {
  morning: 6,
  day: 10,
  evening: 18,
  night: 21,
}

const ORDER: readonly DayPeriod[] = ['morning', 'day', 'evening', 'night']

/** Moment de la journée correspondant à une heure locale. */
export function dayPeriodAt(date: Date): DayPeriod {
  const hour = date.getHours()
  let period: DayPeriod = 'night'
  for (const candidate of ORDER) {
    if (hour >= DAY_PERIOD_STARTS[candidate]) period = candidate
  }
  return period
}

/** Moment affiché selon le réglage : « toujours jour » et « toujours nuit » ignorent l'heure. */
export function resolveDayPeriod(mode: AmbianceMode, date: Date): DayPeriod {
  if (mode === 'day') return 'day'
  if (mode === 'night') return 'night'
  return dayPeriodAt(date)
}

/** Délai (ms) avant le prochain changement de moment, pour ne pas interroger l'heure en boucle. */
export function msUntilNextDayPeriod(date: Date): number {
  const starts = ORDER.map((period) => DAY_PERIOD_STARTS[period]).sort((a, b) => a - b)
  const hour = date.getHours()
  const nextHour = starts.find((start) => start > hour)
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), nextHour ?? starts[0]!, 0, 0, 0)
  if (nextHour === undefined) next.setDate(next.getDate() + 1)
  return Math.max(0, next.getTime() - date.getTime())
}

/** Réglage lu depuis l'appareil, ou réglage par défaut s'il est absent ou inconnu. */
export function parseAmbianceMode(raw: unknown): AmbianceMode {
  return AMBIANCE_MODES.find((mode) => mode === raw) ?? DEFAULT_AMBIANCE_MODE
}

/** Moment affiché, fourni par l'interface ; « jour » par défaut (tests, aperçus). */
export const DayPeriodContext = createContext<DayPeriod>('day')

/** Moment de la journée à habiller, pour les composants d'un thème. */
export function useDayPeriod(): DayPeriod {
  return useContext(DayPeriodContext)
}
