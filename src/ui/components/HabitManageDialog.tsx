import { useState } from 'react'
import {
  archiveHabit,
  deleteHabit,
  pauseHabit,
  previewFrequencyChange,
  restoreHabit,
  resumeHabit,
  sameFrequency,
  updateHabit,
  type Habit,
} from '../../engine/index.ts'
import { formatFrequency, formatValidations } from '../format.ts'
import { useAppStore } from '../state/store.ts'
import { Dialog } from './Dialog.tsx'
import { HabitForm, type HabitFormValues } from './HabitForm.tsx'

interface Props {
  habit: Habit
  open: boolean
  onClose: () => void
}

type Step = { kind: 'edit' } | { kind: 'confirmFrequency'; values: HabitFormValues } | { kind: 'confirmDelete' }

export function HabitManageDialog({ habit, open, onClose }: Props) {
  const { data, today, run } = useAppStore()
  const [step, setStep] = useState<Step>({ kind: 'edit' })
  const activeGoals = data.goals.filter((goal) => goal.status === 'active' || goal.id === habit.goalId)

  const close = () => {
    setStep({ kind: 'edit' })
    onClose()
  }

  const save = (values: HabitFormValues) => {
    const saved = run(
      (d) => updateHabit(d, habit.id, { name: values.name, frequency: values.frequency, goalId: values.goalId || null }),
      'Habitude modifiée.',
    )
    if (saved) close()
  }

  const handleSubmit = (values: HabitFormValues) => {
    // Un changement de fréquence s'applique à tout l'historique : on demande confirmation.
    if (!sameFrequency(values.frequency, habit.frequency)) {
      setStep({ kind: 'confirmFrequency', values })
    } else {
      save(values)
    }
  }

  const act = (succeeded: boolean) => {
    if (succeeded) close()
  }

  let title = `Gérer « ${habit.name} »`
  if (step.kind === 'confirmFrequency') title = 'Changer la fréquence ?'
  if (step.kind === 'confirmDelete') title = 'Supprimer définitivement ?'

  return (
    <Dialog open={open} title={title} onClose={close}>
      {step.kind === 'edit' && (
        <>
          <HabitForm
            initialValues={{ name: habit.name, frequency: habit.frequency, goalId: habit.goalId ?? '' }}
            goals={activeGoals}
            submitLabel="Enregistrer"
            onSubmit={handleSubmit}
            onCancel={close}
          />
          <div className="dialog__section">
            <h3 className="dialog__subtitle">Autres actions</h3>
            <div className="actions actions--wrap">
              {habit.status === 'active' && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => act(run((d, ctx) => pauseHabit(d, habit.id, ctx), `« ${habit.name} » est en pause.`))}
                >
                  Mettre en pause
                </button>
              )}
              {habit.status === 'paused' && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => act(run((d, ctx) => resumeHabit(d, habit.id, ctx), `« ${habit.name} » a repris.`))}
                >
                  Reprendre
                </button>
              )}
              {habit.status !== 'archived' ? (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => act(run((d, ctx) => archiveHabit(d, habit.id, ctx), `« ${habit.name} » est archivée.`))}
                >
                  Archiver
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => act(run((d, ctx) => restoreHabit(d, habit.id, ctx), `« ${habit.name} » est restaurée.`))}
                  >
                    Restaurer
                  </button>
                  <button type="button" className="button button--secondary" onClick={() => setStep({ kind: 'confirmDelete' })}>
                    Supprimer définitivement
                  </button>
                </>
              )}
            </div>
            <p className="field__hint">La pause et l’archivage conservent la série.</p>
          </div>
        </>
      )}

      {step.kind === 'confirmFrequency' && (
        <FrequencyConfirmation
          habit={habit}
          values={step.values}
          today={today}
          completions={data.completions}
          onBack={() => setStep({ kind: 'edit' })}
          onConfirm={() => save(step.values)}
        />
      )}

      {step.kind === 'confirmDelete' && (
        <>
          <p>« {habit.name} » et tout son historique seront supprimés de cet appareil.</p>
          <div className="actions">
            <button type="button" className="button button--secondary" onClick={() => setStep({ kind: 'edit' })}>
              Annuler
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => act(run((d) => deleteHabit(d, habit.id), 'Habitude supprimée.'))}
            >
              Supprimer
            </button>
          </div>
        </>
      )}
    </Dialog>
  )
}

interface ConfirmationProps {
  habit: Habit
  values: HabitFormValues
  today: string
  completions: Parameters<typeof previewFrequencyChange>[1]
  onBack: () => void
  onConfirm: () => void
}

/** Écran de confirmation : la nouvelle fréquence s'applique à tout l'historique. */
function FrequencyConfirmation({ habit, values, today, completions, onBack, onConfirm }: ConfirmationProps) {
  const preview = previewFrequencyChange(habit, completions, values.frequency, today)
  return (
    <>
      <p>
        Nouvelle fréquence : <strong>{formatFrequency(values.frequency)}</strong> (actuellement{' '}
        {formatFrequency(habit.frequency).toLowerCase()}).
      </p>
      <p>
        La nouvelle fréquence s’applique à tout l’historique de l’habitude : la série affichée peut changer.
      </p>
      <p className="preview">
        {preview.currentStreakChanges ? (
          <>
            Série actuelle : {formatValidations(preview.before.current)} → <strong>{formatValidations(preview.after.current)}</strong>
          </>
        ) : (
          <>Série actuelle inchangée : {formatValidations(preview.after.current)}</>
        )}
      </p>
      <div className="actions">
        <button type="button" className="button button--secondary" onClick={onBack}>
          Retour
        </button>
        <button type="button" className="button button--primary" onClick={onConfirm}>
          Confirmer
        </button>
      </div>
    </>
  )
}
