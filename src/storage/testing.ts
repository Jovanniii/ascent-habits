/**
 * Outils de test du stockage (non utilisés par l'application).
 */
import {
  addMilestone,
  addTask,
  createEmptyAppData,
  createGoal,
  createHabit,
  pauseHabit,
  recoverMissedDay,
  toggleHabitToday,
  toggleMilestone,
  toggleTask,
  type AppData,
  type CommandContext,
} from '../engine/index.ts'

/** Implémentation minimale de l'interface Storage du navigateur. */
export class FakeStorage implements Storage {
  private readonly items = new Map<string, string>()

  get length(): number {
    return this.items.size
  }

  clear(): void {
    this.items.clear()
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.items.delete(key)
  }

  setItem(key: string, value: string): void {
    this.items.set(key, String(value))
  }
}

function context(today: string): CommandContext {
  let counter = 0
  return { today, now: `${today}T08:00:00.000Z`, newId: () => `${today}-${++counter}` }
}

/** Jeu de données réaliste qui couvre tous les types d'objets. */
export function sampleAppData(): AppData {
  let data = createEmptyAppData({ themeId: 'plain', animationsEnabled: true })
  data = createGoal(data, { name: 'Courir 10 km', dueDate: '2027-03-01' }, context('2026-09-01'))
  data = addMilestone(data, '2026-09-01-1', '5 km', context('2026-09-02'))
  data = toggleMilestone(data, '2026-09-02-1')
  data = addMilestone(data, '2026-09-01-1', '10 km', context('2026-09-03'))
  data = createHabit(data, { name: 'Courir', frequency: { type: 'specificDays', days: [1, 3, 5] }, goalId: '2026-09-01-1' }, context('2026-09-01'))
  data = createHabit(data, { name: 'Lire', frequency: { type: 'daily' } }, context('2026-09-28'))
  data = toggleHabitToday(data, '2026-09-28-1', context('2026-09-28'))
  data = toggleHabitToday(data, '2026-09-28-1', context('2026-09-30'))
  data = recoverMissedDay(data, '2026-09-28-1', context('2026-09-30'))
  data = pauseHabit(data, '2026-09-01-1', context('2026-10-01'))
  data = addTask(data, { name: 'Acheter des chaussures', goalId: '2026-09-01-1', dueDate: '2026-10-10' }, context('2026-10-01'))
  data = addTask(data, { name: 'Rappeler le garage' }, context('2026-10-02'))
  data = toggleTask(data, '2026-10-02-1', context('2026-10-03'))
  return data
}
