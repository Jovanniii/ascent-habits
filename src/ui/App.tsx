import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createEmptyAppData, toLocalDate, type AppData } from '../engine/index.ts'
import { StoredDataError, type AppRepository } from '../storage/index.ts'
import { DEFAULT_THEME_ID, applyTheme, getTheme } from '../themes/index.ts'
import { Dialog } from './components/Dialog.tsx'
import { NoticeBar } from './components/NoticeBar.tsx'
import { TabBar, type TabId } from './components/TabBar.tsx'
import { downloadTextFile } from './download.ts'
import { GoalsScreen } from './screens/GoalsScreen.tsx'
import { CalendarScreen } from './screens/CalendarScreen.tsx'
import { SettingsScreen } from './screens/SettingsScreen.tsx'
import { TasksScreen } from './screens/TasksScreen.tsx'
import { TodayScreen } from './screens/TodayScreen.tsx'
import { AppStoreProvider } from './state/AppStoreProvider.tsx'
import { useAppStore } from './state/store.ts'
import { AmbianceProvider } from './state/AmbianceProvider.tsx'
import type { PreferenceStorage } from './state/useAmbiance.ts'

const systemNow = () => new Date()

interface Props {
  repository: AppRepository
  /** Horloge injectable (tests). */
  now?: () => Date
  /** Préférence système « réduire les animations », utilisée à la première ouverture. */
  prefersReducedMotion?: boolean
  /** Faux si le stockage de l'appareil est indisponible (navigation privée stricte…). */
  storageAvailable?: boolean
  /** Préférences propres à l'appareil (réglage « Ambiance »), hors des données exportées. */
  preferences?: PreferenceStorage
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: AppData }
  | { kind: 'unreadable'; error: StoredDataError }
  | { kind: 'failed' }

function initialData(prefersReducedMotion: boolean): AppData {
  return createEmptyAppData({ themeId: DEFAULT_THEME_ID, animationsEnabled: !prefersReducedMotion })
}

export function App({
  repository,
  now = systemNow,
  prefersReducedMotion = false,
  storageAvailable = true,
  preferences,
}: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    repository
      .load()
      .then((data) => {
        if (!cancelled) setState({ kind: 'ready', data: data ?? initialData(prefersReducedMotion) })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState(error instanceof StoredDataError ? { kind: 'unreadable', error } : { kind: 'failed' })
      })
    return () => {
      cancelled = true
    }
  }, [repository, prefersReducedMotion])

  if (state.kind === 'loading') {
    return <p className="loading">Chargement…</p>
  }
  if (state.kind === 'failed') {
    return (
      <main className="screen">
        <h1 className="screen__title">Ascent</h1>
        <p>Les données de cet appareil n’ont pas pu être chargées. Recharger la page pour réessayer.</p>
      </main>
    )
  }
  if (state.kind === 'unreadable') {
    return (
      <UnreadableData
        error={state.error}
        today={toLocalDate(now())}
        onReset={async () => {
          const fresh = initialData(prefersReducedMotion)
          await repository.save(fresh)
          setState({ kind: 'ready', data: fresh })
        }}
      />
    )
  }
  return (
    <AppStoreProvider initialData={state.data} repository={repository} now={now}>
      <AmbianceProvider now={now} storage={preferences}>
        <Shell storageAvailable={storageAvailable} />
      </AmbianceProvider>
    </AppStoreProvider>
  )
}

function Shell({ storageAvailable }: { storageAvailable: boolean }) {
  const { data } = useAppStore()
  const [tab, setTab] = useState<TabId>('today')
  const mainRef = useRef<HTMLElement>(null)
  const tabChanged = useRef(false)

  // Avant l'affichage : pas de premier rendu sans couleurs ni préférence d'animation.
  useLayoutEffect(() => {
    applyTheme(getTheme(data.settings.themeId), data.settings.animationsEnabled)
  }, [data.settings.themeId, data.settings.animationsEnabled])

  useEffect(() => {
    // Après un changement d'onglet, le focus va au titre du nouvel écran (lecteurs d'écran).
    if (!tabChanged.current) return
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus()
    window.scrollTo({ top: 0 })
  }, [tab])

  const changeTab = (next: TabId) => {
    tabChanged.current = true
    setTab(next)
  }

  return (
    <div className="app">
      {!storageAvailable && (
        <p className="banner" role="alert">
          Le stockage de cet appareil est indisponible : les données ne seront pas conservées après fermeture.
        </p>
      )}
      <main ref={mainRef} className="app__main">
        {tab === 'today' && <TodayScreen />}
        {tab === 'tasks' && <TasksScreen />}
        {tab === 'goals' && <GoalsScreen />}
        {tab === 'calendar' && <CalendarScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <NoticeBar />
      <TabBar current={tab} onChange={changeTab} />
    </div>
  )
}

interface UnreadableProps {
  error: StoredDataError
  today: string
  onReset: () => Promise<void>
}

/** Données présentes mais illisibles : rien n'est effacé sans accord explicite. */
function UnreadableData({ error, today, onReset }: UnreadableProps) {
  const [confirming, setConfirming] = useState(false)
  const [downloadFirst, setDownloadFirst] = useState(true)
  const downloadRaw = () => downloadTextFile(`ascent-donnees-illisibles-${today}.json`, error.raw)

  return (
    <main className="screen">
      <h1 className="screen__title">Données illisibles</h1>
      <p>Les données enregistrées sur cet appareil n’ont pas pu être lues. Elles n’ont pas été modifiées.</p>
      {error.issues.length > 0 && (
        <ul className="issues">
          {error.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
      <div className="actions actions--wrap">
        <button type="button" className="button button--primary" onClick={downloadRaw}>
          Télécharger les données brutes
        </button>
        <button type="button" className="button button--secondary" onClick={() => setConfirming(true)}>
          Repartir de zéro
        </button>
      </div>
      <Dialog open={confirming} title="Repartir de zéro ?" onClose={() => setConfirming(false)}>
        <p>Les données illisibles seront remplacées par des données vides.</p>
        <label className="checkbox-field">
          <input
            type="checkbox"
            className="checkbox"
            checked={downloadFirst}
            onChange={(event) => setDownloadFirst(event.target.checked)}
          />
          <span>Télécharger d’abord les données brutes (conseillé)</span>
        </label>
        <div className="actions">
          <button type="button" className="button button--secondary" onClick={() => setConfirming(false)}>
            Annuler
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              if (downloadFirst) downloadRaw()
              void onReset()
            }}
          >
            Repartir de zéro
          </button>
        </div>
      </Dialog>
    </main>
  )
}
