import { useId, useRef, useState, type ChangeEvent } from 'react'
import { toLocalDate, updateSettings, type AppData } from '../../engine/index.ts'
import {
  backupFileName,
  createBackup,
  hasUserContent,
  parseBackup,
  serializeBackup,
  summarizeData,
  type DataSummary,
} from '../../storage/index.ts'
import { THEMES } from '../../themes/index.ts'
import { Dialog } from '../components/Dialog.tsx'
import { downloadTextFile } from '../download.ts'
import { formatFullDate, plural } from '../format.ts'
import { useAppStore } from '../state/store.ts'

type ImportState =
  | { kind: 'idle' }
  | { kind: 'invalid'; message: string; issues: string[] }
  | { kind: 'confirm'; data: AppData; exportedAt: string | null }

function describe(summary: DataSummary): string {
  return [
    plural(summary.habits, 'habitude'),
    plural(summary.tasks, 'tâche'),
    plural(summary.goals, 'objectif'),
  ].join(', ')
}

export function SettingsScreen() {
  const { data, today, now, run, replaceAll } = useAppStore()
  const [importState, setImportState] = useState<ImportState>({ kind: 'idle' })
  const [safetyExport, setSafetyExport] = useState(true)
  const fileInput = useRef<HTMLInputElement>(null)
  const animationsId = useId()
  const themeId = useId()

  const exportData = (fileName = backupFileName(today)) => {
    downloadTextFile(fileName, serializeBackup(createBackup(data, now().toISOString())))
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const result = parseBackup(await file.text())
    if (result.ok) {
      setSafetyExport(true)
      setImportState({ kind: 'confirm', data: result.data, exportedAt: result.exportedAt })
    } else {
      setImportState({ kind: 'invalid', message: result.message, issues: result.issues })
    }
  }

  const confirmImport = (imported: AppData) => {
    // Export de sécurité proposé automatiquement avant de remplacer les données.
    if (safetyExport && hasUserContent(data)) {
      exportData(`ascent-sauvegarde-avant-import-${today}.json`)
    }
    replaceAll(imported, 'Données importées.')
    setImportState({ kind: 'idle' })
  }

  const closeImport = () => setImportState({ kind: 'idle' })

  return (
    <section className="screen" aria-labelledby="settings-title">
      <header className="screen__header">
        <h1 id="settings-title" className="screen__title" tabIndex={-1}>Réglages</h1>
      </header>

      <section className="card section" aria-labelledby="settings-display">
        <h2 id="settings-display" className="section__title">Affichage</h2>
        <div className="setting">
          <label htmlFor={animationsId} className="setting__label">
            Animations
            <span className="setting__hint">À désactiver pour une interface plus sobre et sans mouvement.</span>
          </label>
          <input
            id={animationsId}
            type="checkbox"
            role="switch"
            className="switch"
            checked={data.settings.animationsEnabled}
            onChange={(event) => run((d) => updateSettings(d, { animationsEnabled: event.target.checked }))}
          />
        </div>
        <label className="field" htmlFor={themeId}>
          <span className="field__label">Thème</span>
          <select
            id={themeId}
            className="input"
            value={data.settings.themeId}
            onChange={(event) => run((d) => updateSettings(d, { themeId: event.target.value }))}
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card section" aria-labelledby="settings-data">
        <h2 id="settings-data" className="section__title">Sauvegarde</h2>
        <p className="section__text">
          Les données restent sur cet appareil. Un export régulier permet de les conserver en cas de changement de
          téléphone ou de désinstallation.
        </p>
        <div className="actions actions--wrap">
          <button type="button" className="button button--primary" onClick={() => exportData()}>
            Exporter mes données
          </button>
          <button type="button" className="button button--secondary" onClick={() => fileInput.current?.click()}>
            Importer une sauvegarde
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            tabIndex={-1}
            aria-label="Fichier de sauvegarde à importer"
            onChange={handleFile}
          />
        </div>
      </section>

      <p className="app-version">Ascent {__APP_VERSION__}</p>

      <Dialog open={importState.kind === 'invalid'} title="Import impossible" onClose={closeImport}>
        {importState.kind === 'invalid' && (
          <>
            <p>{importState.message}</p>
            {importState.issues.length > 0 && (
              <ul className="issues">
                {importState.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
            <p>Les données actuelles n’ont pas été modifiées.</p>
            <div className="actions">
              <button type="button" className="button button--primary" onClick={closeImport}>
                Fermer
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog open={importState.kind === 'confirm'} title="Remplacer les données ?" onClose={closeImport}>
        {importState.kind === 'confirm' && (
          <>
            <p>
              Sauvegarde{importState.exportedAt && ` du ${formatFullDate(toLocalDate(new Date(importState.exportedAt)))}`} :{' '}
              {describe(summarizeData(importState.data))}.
            </p>
            <p>
              Elle remplacera toutes les données actuelles de cet appareil ({describe(summarizeData(data))}).
            </p>
            {hasUserContent(data) && (
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={safetyExport}
                  onChange={(event) => setSafetyExport(event.target.checked)}
                />
                <span>Télécharger d’abord une sauvegarde des données actuelles (conseillé)</span>
              </label>
            )}
            <div className="actions">
              <button type="button" className="button button--secondary" onClick={closeImport}>
                Annuler
              </button>
              <button type="button" className="button button--primary" onClick={() => confirmImport(importState.data)}>
                Remplacer les données
              </button>
            </div>
          </>
        )}
      </Dialog>
    </section>
  )
}
