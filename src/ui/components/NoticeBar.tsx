import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Notice } from '../state/store.ts'
import { useAppStore } from '../state/store.ts'

/** Durée d'affichage d'un message simple. */
export const NOTICE_DURATION_MS = 4000
/** Durée d'affichage d'un message avec action (« Annuler ») : laisse le temps de réagir. */
export const ACTION_NOTICE_DURATION_MS = 8000

function focusScreenTitle(): void {
  document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true })
}

/**
 * Zone annoncée aux lecteurs d'écran pour les confirmations et erreurs.
 * Un message avec action ne disparaît pas tant qu'il a le focus ou qu'il est
 * survolé à la souris ; s'il disparaît alors qu'il avait le focus, le focus va
 * au titre de l'écran plutôt que de se perdre.
 */
export function NoticeBar() {
  const { notice, announcement, dismissNotice } = useAppStore()
  const [hoveredFor, setHoveredFor] = useState<Notice | null>(null)
  const [focusedFor, setFocusedFor] = useState<Notice | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<HTMLButtonElement>(null)
  const focusInside = useRef(false)
  const paused = notice !== null && (hoveredFor === notice || focusedFor === notice)

  useEffect(() => {
    if (!notice || paused) return
    const duration = notice.action ? ACTION_NOTICE_DURATION_MS : NOTICE_DURATION_MS
    const timer = setTimeout(dismissNotice, duration)
    return () => clearTimeout(timer)
  }, [notice, paused, dismissNotice])

  useLayoutEffect(() => {
    // Le message qui avait le focus vient d'être retiré ou remplacé.
    if (focusInside.current && !containerRef.current?.contains(document.activeElement)) {
      focusInside.current = false
      focusScreenTitle()
    }
  }, [notice])

  useEffect(() => {
    // Suppression faite au clavier : le bouton qui avait le focus a disparu,
    // le focus va à l'action proposée.
    if (notice?.action?.takeFocus) actionRef.current?.focus({ preventScroll: true })
  }, [notice])

  return (
    <div className="notice-area" role="status" aria-live="polite">
      {announcement && (
        <p key={announcement.id} className="visually-hidden">
          {announcement.message}
        </p>
      )}
      {notice && (
        <div
          ref={containerRef}
          className={`notice notice--${notice.kind}${notice.action ? ' notice--action' : ''}`}
          onPointerEnter={(event) => {
            if (notice.action && event.pointerType === 'mouse') setHoveredFor(notice)
          }}
          onPointerLeave={() => setHoveredFor(null)}
          onFocus={() => {
            focusInside.current = true
            if (notice.action) setFocusedFor(notice)
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              focusInside.current = false
              setFocusedFor(null)
            }
          }}
        >
          <p>{notice.message}</p>
          {notice.action && (
            <button
              ref={actionRef}
              type="button"
              className="notice__action"
              aria-label={notice.action.ariaLabel}
              onClick={() => notice.action?.onAction()}
            >
              {notice.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
