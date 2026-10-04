import { useAppStore } from '../state/store.ts'

/** Zone annoncée aux lecteurs d'écran pour les confirmations et erreurs. */
export function NoticeBar() {
  const { notice } = useAppStore()
  return (
    <div className="notice-area" role="status" aria-live="polite">
      {notice && <p className={`notice notice--${notice.kind}`}>{notice.message}</p>}
    </div>
  )
}
