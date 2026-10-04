export type TabId = 'today' | 'tasks' | 'goals' | 'settings'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'today', label: 'Aujourd’hui', icon: 'M5 12.5l4.5 4.5L19 7.5' },
  { id: 'tasks', label: 'Tâches', icon: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01' },
  { id: 'goals', label: 'Objectifs', icon: 'M5 21V4m0 0h11l-2 4 2 4H5' },
  { id: 'settings', label: 'Réglages', icon: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6' },
]

interface Props {
  current: TabId
  onChange: (tab: TabId) => void
}

/** Navigation principale, en bas de l'écran pour être atteinte au pouce. */
export function TabBar({ current, onChange }: Props) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="tabbar__item"
          aria-current={current === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tabbar__icon">
            <path d={tab.icon} />
          </svg>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
