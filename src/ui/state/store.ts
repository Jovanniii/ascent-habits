import { createContext, useContext } from 'react'
import type { AppData, CommandContext, LocalDate } from '../../engine/index.ts'

/** Une action de l'interface : une commande pure du moteur. */
export type Command = (data: AppData, ctx: CommandContext) => AppData

export interface AppStore {
  data: AppData
  today: LocalDate
  /** Instant courant, pour horodater les exports. */
  now: () => Date
  /**
   * Applique une commande puis enregistre. Renvoie false si la commande est refusée.
   * Le retour est un message visible (texte) ou une annonce détaillée.
   */
  run: (command: Command, feedback?: Feedback) => boolean
  /** Remplace toutes les données (import). */
  replaceAll: (data: AppData, feedback?: Feedback) => void
  /** Message de confirmation ou d'erreur annoncé à l'utilisateur. */
  notice: Notice | null
  /**
   * Annonce destinée aux seuls lecteurs d'écran. Elle est séparée du message
   * visible pour ne jamais faire disparaître une action en cours (« Annuler »).
   */
  announcement: Announcement | null
  notify: (notice: Notice) => void
  dismissNotice: () => void
}

export interface Announcement {
  message: string
  /** Change à chaque annonce, pour qu'un même texte soit annoncé de nouveau. */
  id: number
}

export interface Notice {
  kind: 'info' | 'error'
  message: string
  /** Annonce destinée aux seuls lecteurs d'écran (aucun message visible). */
  srOnly?: boolean
  /** Action proposée dans le message, par exemple « Annuler ». */
  action?: NoticeAction
}

export interface NoticeAction {
  /** Libellé visible (court). */
  label: string
  /** Nom accessible avec le contexte, qui commence par le libellé visible. */
  ariaLabel?: string
  /** Donne le focus à l'action (quand l'élément qui l'avait vient de disparaître). */
  takeFocus?: boolean
  onAction: () => void
}

/** Texte d'un message visible, ou annonce détaillée. */
export type Feedback = string | Notice

export function toNotice(feedback: Feedback): Notice {
  return typeof feedback === 'string' ? { kind: 'info', message: feedback } : feedback
}

export const StoreContext = createContext<AppStore | null>(null)

export function useAppStore(): AppStore {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('useAppStore doit être utilisé dans AppStoreProvider.')
  }
  return store
}
