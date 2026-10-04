/**
 * Progression d'un objectif : part des jalons terminés.
 *
 * Elle est recalculée à chaque lecture à partir des jalons existants, donc
 * ajouter ou supprimer un jalon la met à jour sans autre action. Les habitudes
 * et tâches liées n'y contribuent pas encore (voir le journal de décisions).
 */
import type { Milestone } from '../model.ts'

export interface GoalProgress {
  done: number
  total: number
  /** Entre 0 et 1 ; 0 s'il n'y a aucun jalon. */
  ratio: number
  /** Pourcentage entier arrondi à l'inférieur : 100 % seulement quand tout est terminé. */
  percent: number
  /** Vrai si au moins un jalon existe et qu'ils sont tous terminés. */
  allDone: boolean
}

export function computeGoalProgress(goalId: string, milestones: readonly Milestone[]): GoalProgress {
  let done = 0
  let total = 0
  for (const milestone of milestones) {
    if (milestone.goalId !== goalId) continue
    total += 1
    if (milestone.status === 'done') done += 1
  }
  return {
    done,
    total,
    ratio: total === 0 ? 0 : done / total,
    // Multiplier avant de diviser évite les erreurs d'arrondi (29/100*100 = 28,999…).
    percent: total === 0 ? 0 : Math.floor((done * 100) / total),
    allDone: total > 0 && done === total,
  }
}
