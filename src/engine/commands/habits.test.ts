import { describe, expect, it } from 'vitest'
import { computeStreak } from '../habits/streak.ts'
import { previewFrequencyChange, sameFrequency } from '../habits/frequency.ts'
import type { AppData } from '../model.ts'
import { completion, completionsBetween, makeAppData, makeContext, makeHabit } from '../testing/factories.ts'
import { CommandError } from './context.ts'
import {
  archiveHabit,
  cancelRecovery,
  createHabit,
  deleteHabit,
  pauseHabit,
  recoverMissedDay,
  restoreHabit,
  resumeHabit,
  toggleHabitToday,
  updateHabit,
} from './habits.ts'

const TODAY = '2026-10-04'

function expectCommandError(action: () => unknown, code: CommandError['code']): void {
  try {
    action()
  } catch (error) {
    expect(error).toBeInstanceOf(CommandError)
    expect((error as CommandError).code).toBe(code)
    return
  }
  throw new Error(`Une CommandError « ${code} » était attendue.`)
}

function withHabit(overrides: Partial<AppData> = {}): AppData {
  return makeAppData({ habits: [makeHabit()], ...overrides })
}

function streakOf(data: AppData, today = TODAY): number {
  return computeStreak(data.habits[0]!, data.completions, today).current
}

describe('createHabit', () => {
  it('crée une habitude active à partir du jour courant', () => {
    const data = createHabit(makeAppData(), { name: '  Lire   10 pages ', frequency: { type: 'daily' } }, makeContext())
    expect(data.habits).toEqual([
      {
        id: 'id-1',
        name: 'Lire 10 pages',
        frequency: { type: 'daily' },
        createdOn: TODAY,
        status: 'active',
        pauses: [],
      },
    ])
  })

  it('trie et dédoublonne les jours choisis', () => {
    const data = createHabit(
      makeAppData(),
      { name: 'Sport', frequency: { type: 'specificDays', days: [5, 1, 3, 1] } },
      makeContext(),
    )
    expect(data.habits[0]?.frequency).toEqual({ type: 'specificDays', days: [1, 3, 5] })
  })

  it('traite les sept jours comme « tous les jours »', () => {
    const data = createHabit(
      makeAppData(),
      { name: 'Marcher', frequency: { type: 'specificDays', days: [1, 2, 3, 4, 5, 6, 7] } },
      makeContext(),
    )
    expect(data.habits[0]?.frequency).toEqual({ type: 'daily' })
  })

  it('peut être liée à un objectif existant', () => {
    const goal = { id: 'goal-1', name: 'Courir 10 km', status: 'active' as const, createdAt: '' }
    const data = createHabit(
      makeAppData({ goals: [goal] }),
      { name: 'Courir', frequency: { type: 'daily' }, goalId: 'goal-1' },
      makeContext(),
    )
    expect(data.habits[0]?.goalId).toBe('goal-1')
  })

  it('refuse un nom vide, une liste de jours vide ou un objectif inconnu', () => {
    expectCommandError(() => createHabit(makeAppData(), { name: '   ', frequency: { type: 'daily' } }, makeContext()), 'invalid-name')
    expectCommandError(
      () => createHabit(makeAppData(), { name: 'Lire', frequency: { type: 'specificDays', days: [] } }, makeContext()),
      'invalid-frequency',
    )
    expectCommandError(
      () => createHabit(makeAppData(), { name: 'Lire', frequency: { type: 'daily' }, goalId: 'inconnu' }, makeContext()),
      'not-found',
    )
  })

  it('refuse un nom trop long', () => {
    expectCommandError(
      () => createHabit(makeAppData(), { name: 'a'.repeat(121), frequency: { type: 'daily' } }, makeContext()),
      'invalid-name',
    )
  })

  it('ne modifie pas les données reçues', () => {
    const data = makeAppData()
    const frozen = structuredClone(data)
    createHabit(data, { name: 'Lire', frequency: { type: 'daily' } }, makeContext())
    expect(data).toEqual(frozen)
  })
})

describe('toggleHabitToday', () => {
  it("coche puis décoche l'habitude pour aujourd'hui", () => {
    const checked = toggleHabitToday(withHabit(), 'habit-1', makeContext())
    expect(checked.completions).toEqual([{ habitId: 'habit-1', date: TODAY, kind: 'normal' }])

    const unchecked = toggleHabitToday(checked, 'habit-1', makeContext())
    expect(unchecked.completions).toEqual([])
  })

  it("refuse de cocher un jour non prévu", () => {
    const data = makeAppData({ habits: [makeHabit({ frequency: { type: 'specificDays', days: [1] } })] })
    expectCommandError(() => toggleHabitToday(data, 'habit-1', makeContext()), 'not-scheduled')
  })

  it('refuse de cocher une habitude en pause, mais permet d’annuler une coche', () => {
    const paused = makeAppData({
      habits: [makeHabit({ status: 'paused', pauses: [{ from: '2026-10-05' }] })],
      completions: [completion(TODAY)],
    })
    expect(toggleHabitToday(paused, 'habit-1', makeContext()).completions).toEqual([])
    expectCommandError(
      () => toggleHabitToday({ ...paused, completions: [] }, 'habit-1', makeContext()),
      'invalid-state',
    )
  })

  it('signale une habitude inconnue', () => {
    expectCommandError(() => toggleHabitToday(makeAppData(), 'inconnue', makeContext()), 'not-found')
  })
})

describe('recoverMissedDay et cancelRecovery', () => {
  const missedYesterday = withHabit({ completions: completionsBetween('2026-09-25', '2026-10-02') })

  it('valide le jour manqué en rattrapage et préserve la série', () => {
    const recovered = recoverMissedDay(missedYesterday, 'habit-1', makeContext())
    expect(recovered.completions.at(-1)).toEqual({ habitId: 'habit-1', date: '2026-10-03', kind: 'recovery' })
    expect(streakOf(recovered)).toBe(9)

    const checkedToday = toggleHabitToday(recovered, 'habit-1', makeContext())
    expect(streakOf(checkedToday)).toBe(10)
  })

  it("refuse un second rattrapage dans la même semaine", () => {
    const data = withHabit({
      completions: [
        ...completionsBetween('2026-09-25', '2026-09-28'),
        completion('2026-09-29', 'recovery'),
        ...completionsBetween('2026-09-30', '2026-10-02'),
      ],
    })
    expectCommandError(() => recoverMissedDay(data, 'habit-1', makeContext()), 'recovery-unavailable')
  })

  it('refuse un rattrapage quand rien ne manque', () => {
    const data = withHabit({ completions: completionsBetween('2026-09-25', '2026-10-03') })
    expectCommandError(() => recoverMissedDay(data, 'habit-1', makeContext()), 'recovery-unavailable')
  })

  it('annule un rattrapage fait par erreur et libère le quota', () => {
    const recovered = recoverMissedDay(missedYesterday, 'habit-1', makeContext())
    const cancelled = cancelRecovery(recovered, 'habit-1', makeContext())
    expect(cancelled.completions).toEqual(missedYesterday.completions)
    expect(() => recoverMissedDay(cancelled, 'habit-1', makeContext())).not.toThrow()
  })

  it("refuse d'annuler quand aucun rattrapage n'a été fait", () => {
    expectCommandError(() => cancelRecovery(missedYesterday, 'habit-1', makeContext()), 'invalid-state')
  })
})

describe('pauseHabit et resumeHabit', () => {
  it("met en pause dès aujourd'hui si l'habitude n'est pas cochée", () => {
    const paused = pauseHabit(withHabit(), 'habit-1', makeContext())
    expect(paused.habits[0]).toMatchObject({ status: 'paused', pauses: [{ from: TODAY }] })
  })

  it("met en pause à partir de demain si aujourd'hui est déjà coché", () => {
    const paused = pauseHabit(withHabit({ completions: [completion(TODAY)] }), 'habit-1', makeContext())
    expect(paused.habits[0]?.pauses).toEqual([{ from: '2026-10-05' }])
    expect(streakOf(paused)).toBe(1)
  })

  it('ferme la période de pause à la veille de la reprise', () => {
    const paused = pauseHabit(withHabit(), 'habit-1', makeContext('2026-09-28'))
    const resumed = resumeHabit(paused, 'habit-1', makeContext(TODAY))
    expect(resumed.habits[0]).toMatchObject({ status: 'active', pauses: [{ from: '2026-09-28', to: '2026-10-03' }] })
  })

  it('efface une pause reprise le jour même', () => {
    const paused = pauseHabit(withHabit(), 'habit-1', makeContext())
    const resumed = resumeHabit(paused, 'habit-1', makeContext())
    expect(resumed.habits[0]).toMatchObject({ status: 'active', pauses: [] })
  })

  it('ne casse pas la série', () => {
    const before = withHabit({ completions: completionsBetween('2026-09-20', '2026-09-27') })
    const paused = pauseHabit(before, 'habit-1', makeContext('2026-09-28'))
    const resumed = resumeHabit(paused, 'habit-1', makeContext(TODAY))
    expect(streakOf(resumed)).toBe(8)
    expect(streakOf(toggleHabitToday(resumed, 'habit-1', makeContext()))).toBe(9)
  })

  it('refuse les transitions impossibles', () => {
    expectCommandError(() => resumeHabit(withHabit(), 'habit-1', makeContext()), 'invalid-state')
    const paused = pauseHabit(withHabit(), 'habit-1', makeContext())
    expectCommandError(() => pauseHabit(paused, 'habit-1', makeContext()), 'invalid-state')
  })
})

describe('archiveHabit, restoreHabit et deleteHabit', () => {
  it("archive en traitant les jours d'archivage comme une pause", () => {
    const before = withHabit({ completions: completionsBetween('2026-09-20', '2026-09-27') })
    const archived = archiveHabit(before, 'habit-1', makeContext('2026-09-28'))
    expect(archived.habits[0]).toMatchObject({ status: 'archived', pauses: [{ from: '2026-09-28' }] })

    const restored = restoreHabit(archived, 'habit-1', makeContext(TODAY))
    expect(restored.habits[0]?.status).toBe('active')
    expect(streakOf(restored)).toBe(8)
  })

  it("garde une seule période ouverte quand on archive une habitude en pause", () => {
    const paused = pauseHabit(withHabit(), 'habit-1', makeContext('2026-09-28'))
    const archived = archiveHabit(paused, 'habit-1', makeContext(TODAY))
    expect(archived.habits[0]?.pauses).toEqual([{ from: '2026-09-28' }])
    expect(archiveHabit(archived, 'habit-1', makeContext())).toBe(archived)
  })

  it("refuse de restaurer une habitude qui n'est pas archivée", () => {
    expectCommandError(() => restoreHabit(withHabit(), 'habit-1', makeContext()), 'invalid-state')
  })

  it("supprime l'habitude et ses validations", () => {
    const data = withHabit({ completions: [completion(TODAY), completion(TODAY, 'normal', 'autre')] })
    const deleted = deleteHabit(data, 'habit-1')
    expect(deleted.habits).toEqual([])
    expect(deleted.completions).toEqual([completion(TODAY, 'normal', 'autre')])
  })
})

describe('updateHabit', () => {
  it('renomme, change la fréquence et gère le lien avec un objectif', () => {
    const goal = { id: 'goal-1', name: 'Objectif', status: 'active' as const, createdAt: '' }
    const data = withHabit({ goals: [goal] })
    const updated = updateHabit(data, 'habit-1', {
      name: 'Lire le soir',
      frequency: { type: 'specificDays', days: [6, 7] },
      goalId: 'goal-1',
    })
    expect(updated.habits[0]).toMatchObject({
      name: 'Lire le soir',
      frequency: { type: 'specificDays', days: [6, 7] },
      goalId: 'goal-1',
    })
    expect(updateHabit(updated, 'habit-1', { goalId: null }).habits[0]).not.toHaveProperty('goalId')
  })

  it('valide les modifications', () => {
    expectCommandError(() => updateHabit(withHabit(), 'habit-1', { name: '' }), 'invalid-name')
    expectCommandError(() => updateHabit(withHabit(), 'habit-1', { goalId: 'inconnu' }), 'not-found')
  })
})

describe('previewFrequencyChange', () => {
  it('montre que la série affichée peut changer', () => {
    // Validé tous les jours sauf le mardi 29 et le jeudi 1er.
    const completions = [
      ...completionsBetween('2026-09-21', '2026-09-28'),
      completion('2026-09-30'),
      ...completionsBetween('2026-10-02', '2026-10-03'),
    ]
    const habit = makeHabit()
    const preview = previewFrequencyChange(habit, completions, { type: 'specificDays', days: [1, 3, 5] }, TODAY)
    expect(preview.before.current).toBe(2)
    expect(preview.after.current).toBe(6)
    expect(preview.currentStreakChanges).toBe(true)
  })

  it("indique quand la série ne change pas", () => {
    const preview = previewFrequencyChange(makeHabit(), completionsBetween('2026-09-21', '2026-10-03'), { type: 'daily' }, TODAY)
    expect(preview.currentStreakChanges).toBe(false)
  })

  it('compare deux fréquences', () => {
    expect(sameFrequency({ type: 'daily' }, { type: 'daily' })).toBe(true)
    expect(sameFrequency({ type: 'daily' }, { type: 'specificDays', days: [1] })).toBe(false)
    expect(sameFrequency({ type: 'specificDays', days: [1, 3] }, { type: 'specificDays', days: [1, 3] })).toBe(true)
    expect(sameFrequency({ type: 'specificDays', days: [1, 3] }, { type: 'specificDays', days: [1, 4] })).toBe(false)
  })
})
