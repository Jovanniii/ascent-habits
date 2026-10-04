/**
 * Contrat de stockage des données.
 *
 * L'interface est asynchrone pour qu'une autre implémentation (IndexedDB, backend
 * en v2) puisse remplacer le stockage local sans toucher au reste de l'application.
 */
import type { AppData } from '../engine/index.ts'

export interface AppRepository {
  /** Charge les données ; null si rien n'a encore été enregistré (première ouverture). */
  load(): Promise<AppData | null>
  /** Enregistre l'ensemble des données. */
  save(data: AppData): Promise<void>
}
