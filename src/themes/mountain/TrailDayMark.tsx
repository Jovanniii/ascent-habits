/**
 * Décor d'un jour du calendrier, style « carnet de randonnée » (Doc 07 §7) :
 * tampon à petit sommet pour un jour validé, pont de corde pour un rattrapage,
 * crayon du carnet pour un jour noté après coup, tente au repos pour un jour non validé,
 * et chaîne de montagnes sous les jours d'une série. Purement décoratif : le
 * libellé complet de chaque jour est donné par l'interface.
 */
import type { ReactNode } from 'react'
import type { CalendarDayMarkProps } from '../types.ts'

type Ridge = 'start' | 'middle' | 'end' | 'single' | 'bridge'

/**
 * Crêtes sur une case de 48 × 20. Les bords gauche et droit sont à la même
 * hauteur (14) pour que la chaîne paraisse continue d'un jour à l'autre.
 */
const RIDGES: Record<Ridge, string> = {
  middle: 'M0 20 L0 14 L8 8 L15 12 L24 3 L32 10 L39 6 L48 14 L48 20 Z',
  start: 'M14 20 L24 4 L32 10 L39 6 L48 14 L48 20 Z',
  end: 'M0 20 L0 14 L8 8 L15 12 L24 4 L34 20 Z',
  single: 'M12 20 L24 5 L36 20 Z',
  bridge: 'M0 20 L0 14 L12 16 L24 15 L36 16 L48 14 L48 20 Z',
}

function Stamp({ dashed = false, children }: { dashed?: boolean; children: ReactNode }) {
  return (
    <>
      <circle className={`mountain-day__stamp${dashed ? ' is-dashed' : ''}`} cx="12" cy="12" r="10" />
      {children}
    </>
  )
}

/** Petit sommet enneigé, motif du tampon d'un jour validé. */
function Peak({ muted = false }: { muted?: boolean }) {
  return (
    <>
      <path className={muted ? 'mountain-day__muted-fill' : 'mountain-day__ink-fill'} d="M5.5 16.5 L10.5 8 L13 12 L14.8 9.6 L18.5 16.5 Z" />
      {!muted && <path className="mountain-day__halo-line" d="M9 10.6 L10.5 8 L12 10.4" />}
    </>
  )
}

function Symbol({ state }: Pick<CalendarDayMarkProps, 'state'>) {
  switch (state) {
    case 'done':
      return (
        <Stamp>
          <Peak />
        </Stamp>
      )
    case 'recovered':
      return (
        <Stamp>
          <path className="mountain-day__ink-fill" d="M4.5 17.5 V13.5 H8 V17.5 Z M16 17.5 V13.5 H19.5 V17.5 Z" />
          <path className="mountain-day__ink-line" d="M8 13.5 H16 M7 13.5 V8.5 M17 13.5 V8.5 M7 9 Q12 12.5 17 9" />
        </Stamp>
      )
    case 'late':
      return (
        <Stamp dashed>
          <path className="mountain-day__ink-fill" d="M7.5 16.5 L14.8 9.2 L16.8 11.2 L9.5 18.5 L7 19 Z" />
          <path className="mountain-day__ink-line" d="M15.8 8.2 L17.8 10.2" />
        </Stamp>
      )
    case 'notDone':
      // Une tente au repos : un jour sans coche n'est pas un échec (Doc 07 §2).
      return <path className="mountain-day__muted-line" d="M4.5 18.5 L12 6 L19.5 18.5 Z M10 18.5 L12 13.5 L14 18.5" />
    case 'pending':
      return <circle className="mountain-day__muted-line is-dashed" cx="12" cy="12" r="9" />
    case 'paused':
      return <path className="mountain-day__muted-fill" d="M14 5.5a6.8 6.8 0 1 0 4.8 11.6A7.6 7.6 0 0 1 14 5.5z" />
    case 'offSchedule':
      return <Peak muted />
    default:
      return null
  }
}

export function TrailDayMark({ state, chain, bridge }: CalendarDayMarkProps) {
  let ridge: Ridge | null = null
  if (chain && chain.length > 1) ridge = chain.position
  else if (bridge) ridge = 'bridge'
  const hasSymbol = !['unscheduled', 'beforeCreation', 'future'].includes(state)
  return (
    <span className="mountain-day" data-state={state}>
      {ridge && (
        <svg className="mountain-day__ridge" viewBox="0 0 48 20" preserveAspectRatio="none" aria-hidden="true">
          <path d={RIDGES[ridge]} />
        </svg>
      )}
      {hasSymbol && (
        <svg className="mountain-day__symbol" viewBox="0 0 24 24" aria-hidden="true">
          <Symbol state={state} />
        </svg>
      )}
    </span>
  )
}
