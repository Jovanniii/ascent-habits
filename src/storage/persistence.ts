/**
 * Demande au navigateur de ne pas effacer les données en cas de manque d'espace.
 * Sans effet (et sans erreur) si l'API n'est pas disponible.
 */
export async function requestPersistentStorage(storageManager: StorageManager | undefined): Promise<boolean> {
  if (!storageManager?.persist) {
    return false
  }
  try {
    if (await storageManager.persisted()) {
      return true
    }
    return await storageManager.persist()
  } catch {
    return false
  }
}
