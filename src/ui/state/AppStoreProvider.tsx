import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CommandError, type AppData } from '../../engine/index.ts'
import { hasUserContent, requestPersistentStorage, type AppRepository } from '../../storage/index.ts'
import { createId } from './ids.ts'
import { StoreContext, toNotice, type Announcement, type AppStore, type Command, type Feedback, type Notice } from './store.ts'
import { useToday } from './useToday.ts'

/** Délai avant une annonce destinée aux lecteurs d'écran. */
const ANNOUNCEMENT_DELAY_MS = 150

interface Props {
  initialData: AppData
  repository: AppRepository
  now: () => Date
  children: ReactNode
}

export function AppStoreProvider({ initialData, repository, now, children }: Props) {
  const [data, setData] = useState(initialData)
  const [notice, setNotice] = useState<Notice | null>(null)
  const dataRef = useRef(initialData)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const persistenceRequested = useRef(false)
  const today = useToday(now)

  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const announcementCount = useRef(0)

  const notify = useCallback((next: Notice) => {
    if (next.srOnly) {
      // Léger délai : l'annonce passe après un éventuel déplacement du focus,
      // qui sinon l'interromprait.
      announcementCount.current += 1
      const id = announcementCount.current
      setTimeout(() => setAnnouncement({ message: next.message, id }), ANNOUNCEMENT_DELAY_MS)
    } else {
      setNotice(next)
    }
  }, [])
  const dismissNotice = useCallback(() => setNotice(null), [])

  const commit = useCallback(
    (next: AppData) => {
      dataRef.current = next
      setData(next)
      // Les enregistrements sont mis en file pour rester dans l'ordre des actions.
      saveQueue.current = saveQueue.current
        .then(() => repository.save(next))
        .then(() => {
          // Demande de stockage persistant dès le premier contenu, pas à l'ouverture
          // (certains navigateurs affichent une demande d'autorisation).
          if (!persistenceRequested.current && hasUserContent(next)) {
            persistenceRequested.current = true
            void requestPersistentStorage(navigator.storage)
          }
        })
        .catch(() => {
          setNotice({ kind: 'error', message: "Les modifications n'ont pas pu être enregistrées sur cet appareil." })
        })
    },
    [repository],
  )

  const run = useCallback(
    (command: Command, feedback?: Feedback) => {
      try {
        const next = command(dataRef.current, { today, now: now().toISOString(), newId: createId })
        commit(next)
        if (feedback) notify(toNotice(feedback))
        return true
      } catch (error) {
        if (error instanceof CommandError) {
          setNotice({ kind: 'error', message: error.message })
          return false
        }
        throw error
      }
    },
    [commit, notify, now, today],
  )

  const replaceAll = useCallback(
    (next: AppData, feedback?: Feedback) => {
      commit(next)
      if (feedback) notify(toNotice(feedback))
    },
    [commit, notify],
  )

  const store = useMemo<AppStore>(
    () => ({ data, today, now, run, replaceAll, notice, announcement, notify, dismissNotice }),
    [data, today, now, run, replaceAll, notice, announcement, notify, dismissNotice],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
