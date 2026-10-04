import { createContext, useContext } from 'react'
import type { AppData, CommandContext, LocalDate } from '../../engine/index.ts'

/** Une action de l'interface : une commande pure du moteur. */
export type Command = (data: AppData, ctx: CommandContext) => AppData

export interface AppStore {
  data: AppData
  today: LocalDate
  /** Instant courant, pour horodater les exports. */
  now: () => Date
  /** Applique une commande puis enregistre. Renvoie false si la commande est refusée. */
  run: (command: Command, successMessage?: string) => boolean
  /** Remplace toutes les données (import). */
  replaceAll: (data: AppData, successMessage?: string) => void
  /** Message de confirmation ou d'erreur annoncé à l'utilisateur. */
  notice: Notice | null
  notify: (notice: Notice) => void
}

export interface Notice {
  kind: 'info' | 'error'
  message: string
}

export const StoreContext = createContext<AppStore | null>(null)

export function useAppStore(): AppStore {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('useAppStore doit être utilisé dans AppStoreProvider.')
  }
  return store
}
