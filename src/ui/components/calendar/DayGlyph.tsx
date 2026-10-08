import type { HabitDayState } from '../../../engine/index.ts'

/**
 * Symboles simples des jours, dessinés par l'interface quand le thème ne fournit
 * pas de décor. Chaque état a sa forme : l'information ne repose pas sur la couleur.
 */
interface Glyph {
  paths: { d: string; dashed?: boolean }[]
  muted?: boolean
}

const CIRCLE = 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17'

const GLYPHS: Partial<Record<HabitDayState, Glyph>> = {
  done: { paths: [{ d: 'M5 12.5l4.5 4.5L19 7.5' }] },
  recovered: { paths: [{ d: 'M19 12a7 7 0 1 1-2.05-4.95M19 4.5V8h-3.5' }] },
  late: { paths: [{ d: CIRCLE, dashed: true }, { d: 'M8.5 12.5l2.5 2.5 4.5-5' }] },
  pending: { paths: [{ d: CIRCLE, dashed: true }], muted: true },
  notDone: { paths: [{ d: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6' }], muted: true },
  paused: { paths: [{ d: 'M9.5 8v8M14.5 8v8' }], muted: true },
  offSchedule: { paths: [{ d: 'M8 12.5l3 3 5-6' }], muted: true },
}

export function DayGlyph({ state }: { state: HabitDayState }) {
  const glyph = GLYPHS[state]
  if (!glyph) return null
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`day-glyph${glyph.muted ? ' day-glyph--muted' : ''}`}>
      {glyph.paths.map((path) => (
        <path key={path.d} d={path.d} className={path.dashed ? 'day-glyph__dashed' : undefined} />
      ))}
    </svg>
  )
}
