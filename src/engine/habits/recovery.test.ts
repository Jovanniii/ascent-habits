import { describe, expect, it } from 'vitest'
import { RECOVERY_LIMIT_PER_WEEK } from '../config.ts'
import type { Frequency } from '../model.ts'
import { completion, completionsBetween, completionsOn, makeHabit } from '../testing/factories.ts'
import { getRecoveryState, recoveriesUsedInWeek } from './recovery.ts'
import { computeStreak } from './streak.ts'

// Aujourd'hui : dimanche 4 octobre 2026, fin de la semaine du lundi 28 septembre.
const TODAY = '2026-10-04'
const MON_WED_FRI: Frequency = { type: 'specificDays', days: [1, 3, 5] }

describe('getRecoveryState : habitude quotidienne', () => {
  const habit = makeHabit()

  it('propose de rattraper hier quand hier est manqué', () => {
    const completions = completionsBetween('2026-09-25', '2026-10-02')
    expect(getRecoveryState(habit, completions, TODAY)).toEqual({ status: 'available', missedDate: '2026-10-03' })
  })

  it("reste disponible après avoir validé aujourd'hui", () => {
    const completions = [...completionsBetween('2026-09-25', '2026-10-02'), completion(TODAY)]
    expect(getRecoveryState(habit, completions, TODAY).status).toBe('available')
  })

  it("ne propose rien quand hier est validé", () => {
    expect(getRecoveryState(habit, completionsBetween('2026-09-25', '2026-10-03'), TODAY)).toEqual({ status: 'none' })
  })

  it("ne permet pas de rattraper un jour plus ancien que la veille", () => {
    // 2 octobre manqué, 3 octobre validé : le 2 n'est plus rattrapable.
    const completions = [...completionsBetween('2026-09-25', '2026-10-01'), completion('2026-10-03')]
    expect(getRecoveryState(habit, completions, TODAY)).toEqual({ status: 'none' })
  })

  it('signale un jour déjà rattrapé (pour pouvoir annuler)', () => {
    const completions = [...completionsBetween('2026-09-25', '2026-10-02'), completion('2026-10-03', 'recovery')]
    expect(getRecoveryState(habit, completions, TODAY)).toEqual({ status: 'recovered', missedDate: '2026-10-03' })
  })

  it("ne propose rien le jour de la création", () => {
    expect(getRecoveryState(makeHabit({ createdOn: TODAY }), [], TODAY)).toEqual({ status: 'none' })
  })

  it('ne propose rien pour une habitude en pause ou archivée', () => {
    const completions = completionsBetween('2026-09-25', '2026-10-02')
    expect(getRecoveryState({ ...habit, status: 'paused' }, completions, TODAY).status).toBe('none')
    expect(getRecoveryState({ ...habit, status: 'archived' }, completions, TODAY).status).toBe('none')
  })
})

describe('getRecoveryState : la série est préservée', () => {
  it('le rattrapage plus la validation du jour prolongent la série', () => {
    const habit = makeHabit()
    const before = completionsBetween('2026-09-25', '2026-10-02')
    expect(computeStreak(habit, before, TODAY).current).toBe(0)

    const after = [...before, completion('2026-10-03', 'recovery'), completion(TODAY)]
    expect(computeStreak(habit, after, TODAY).current).toBe(10)
  })

  it('un seul jour est rattrapable : deux jours manqués d’affilée cassent la série', () => {
    const habit = makeHabit()
    const completions = [
      ...completionsBetween('2026-09-25', '2026-10-01'),
      // 2 et 3 octobre manqués ; seul le 3 est rattrapable.
      completion('2026-10-03', 'recovery'),
    ]
    expect(computeStreak(habit, completions, TODAY).current).toBe(1)
  })
})

describe('getRecoveryState : jours précis (lundi, mercredi, vendredi)', () => {
  const habit = makeHabit({ frequency: MON_WED_FRI })
  const beforeFriday = completionsOn(['2026-09-28', '2026-09-30']) // vendredi 2 manqué

  it("rattrape le vendredi manqué pendant le week-end", () => {
    expect(getRecoveryState(habit, beforeFriday, '2026-10-03')).toEqual({
      status: 'available',
      missedDate: '2026-10-02',
    })
    expect(getRecoveryState(habit, beforeFriday, TODAY).status).toBe('available')
  })

  it('reste rattrapable jusqu’au jour prévu suivant inclus', () => {
    expect(getRecoveryState(habit, beforeFriday, '2026-10-05')).toEqual({
      status: 'available',
      missedDate: '2026-10-02',
    })
  })

  it("n'est plus rattrapable une fois le jour prévu suivant passé", () => {
    const completions = [...beforeFriday, completion('2026-10-05')]
    expect(getRecoveryState(habit, completions, '2026-10-06')).toEqual({ status: 'none' })
  })
})

describe('getRecoveryState : limite hebdomadaire', () => {
  const habit = makeHabit()

  it('vaut une récupération par semaine par défaut', () => {
    expect(RECOVERY_LIMIT_PER_WEEK).toBe(1)
  })

  it('bloque une deuxième récupération dans la même semaine', () => {
    const completions = [
      ...completionsBetween('2026-09-25', '2026-09-28'),
      completion('2026-09-29', 'recovery'),
      ...completionsBetween('2026-09-30', '2026-10-02'),
    ]
    expect(getRecoveryState(habit, completions, TODAY)).toEqual({
      status: 'limitReached',
      missedDate: '2026-10-03',
    })
  })

  it('redevient possible la semaine suivante', () => {
    const completions = [
      ...completionsBetween('2026-09-25', '2026-09-28'),
      completion('2026-09-29', 'recovery'),
      ...completionsBetween('2026-09-30', TODAY),
    ]
    // Lundi 5 octobre manqué, rattrapé le mardi 6 : nouvelle semaine.
    expect(getRecoveryState(habit, completions, '2026-10-06').status).toBe('available')
  })

  it('compte la semaine du jour rattrapé, pas celle du jour courant', () => {
    const completions = [
      ...completionsBetween('2026-09-25', '2026-09-28'),
      completion('2026-09-29', 'recovery'),
      ...completionsBetween('2026-09-30', '2026-10-03'),
    ]
    // Dimanche 4 manqué, rattrapé le lundi 5 : la semaine du 28 septembre a déjà servi.
    expect(getRecoveryState(habit, completions, '2026-10-05').status).toBe('limitReached')
  })

  it("ne compte pas les rattrapages d'une autre habitude", () => {
    const completions = [
      ...completionsBetween('2026-09-25', '2026-10-02'),
      completion('2026-09-29', 'recovery', 'autre'),
    ]
    expect(getRecoveryState(habit, completions, TODAY).status).toBe('available')
  })

  it('suit la limite passée en paramètre', () => {
    const completions = [
      ...completionsBetween('2026-09-25', '2026-09-28'),
      completion('2026-09-29', 'recovery'),
      ...completionsBetween('2026-09-30', '2026-10-02'),
    ]
    expect(getRecoveryState(habit, completions, TODAY, 2).status).toBe('available')
    expect(getRecoveryState(habit, completionsBetween('2026-09-25', '2026-10-02'), TODAY, 0).status).toBe(
      'limitReached',
    )
  })

  it('recoveriesUsedInWeek compte les rattrapages du lundi au dimanche', () => {
    const completions = [
      completion('2026-09-27', 'recovery'), // semaine précédente
      completion('2026-09-28', 'recovery'),
      completion('2026-10-01'),
      completion('2026-10-04', 'recovery'),
      completion('2026-10-05', 'recovery'), // semaine suivante
    ]
    expect(recoveriesUsedInWeek('habit-1', completions, '2026-10-01')).toBe(2)
  })
})

describe('getRecoveryState : pauses', () => {
  it('rattrape le dernier jour prévu avant la pause, au premier jour de reprise', () => {
    const habit = makeHabit({ pauses: [{ from: '2026-10-01', to: '2026-10-03' }] })
    const completions = completionsBetween('2026-09-25', '2026-09-29')
    expect(getRecoveryState(habit, completions, TODAY)).toEqual({ status: 'available', missedDate: '2026-09-30' })
  })
})
