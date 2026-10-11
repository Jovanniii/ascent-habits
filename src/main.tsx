import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { createLocalStorageRepository, createMemoryRepository, type AppRepository } from './storage/index.ts'
import { App } from './ui/App.tsx'
import './ui/styles.css'

/** localStorage peut être inaccessible (réglages de confidentialité stricts) : repli en mémoire. */
function createRepository(): { repository: AppRepository; storageAvailable: boolean; preferences?: Storage } {
  try {
    const storage = window.localStorage
    const probe = '__ascent_probe__'
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return { repository: createLocalStorageRepository(storage), storageAvailable: true, preferences: storage }
  } catch {
    return { repository: createMemoryRepository(), storageAvailable: false }
  }
}

// Nouvelle version publiée : le service worker la télécharge, puis la page se
// recharge d'elle-même (sinon l'ancienne version reste affichée depuis le cache).
// La version est aussi vérifiée toutes les heures pour une appli restée ouverte.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000)
  },
})

const { repository, storageAvailable, preferences } = createRepository()
const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      repository={repository}
      prefersReducedMotion={prefersReducedMotion}
      storageAvailable={storageAvailable}
      preferences={preferences}
    />
  </StrictMode>,
)
