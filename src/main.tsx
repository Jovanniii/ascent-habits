import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
