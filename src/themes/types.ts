/**
 * Contrat d'un thème.
 *
 * Un thème est un module interchangeable qui habille les données du moteur :
 * jetons de couleur communs à l'interface et, s'il le souhaite, une illustration
 * des habitudes. L'interface garde la main sur tout ce qui est interactif et
 * textuel (bouton de coche, libellés, accessibilité) : un thème ne fournit que
 * du décor.
 *
 * Règle d'import : un thème (dossier src/themes/<id>/) n'importe que ce fichier,
 * progress.ts et le moteur, jamais le registre ni src/themes/index.ts.
 */
import type { ComponentType } from 'react'
import type { GoalProgress } from '../engine/index.ts'
import type { HabitProgress } from './progress.ts'

/** Variables CSS appliquées à la racine du document (ex. « --color-bg »). */
export type ThemeTokens = Record<`--${string}`, string>

/** Dernier geste de l'utilisateur sur une habitude : seuls ces gestes sont animés. */
export interface HabitGesture {
  kind: 'checked' | 'unchecked'
  /** Change à chaque geste, pour rejouer l'animation. */
  id: number
}

/** Données neutres transmises à l'illustration d'une habitude. */
export interface HabitSceneProps {
  progress: HabitProgress
  /** Geste en cours d'animation, ou null (aucune animation au chargement). */
  gesture: HabitGesture | null
  /** Faux si le réglage de l'application ou celui de l'appareil réduit les animations. */
  motionAllowed: boolean
  /** Rang de l'habitude dans la liste, pour décaler les boucles d'animation. */
  index: number
}

/** Données neutres transmises à l'illustration d'une tâche à faire. */
export interface TaskIllustrationProps {
  /** Identifiant de la tâche : la variante dessinée en dépend de façon stable. */
  taskId: string
  /** Vrai pendant la courte animation qui suit la coche (la tâche est déjà terminée). */
  clearing: boolean
  /** Faux si le réglage de l'application ou celui de l'appareil réduit les animations. */
  motionAllowed: boolean
}

/** Données neutres transmises à la scène d'un objectif. */
export interface GoalSceneProps {
  /** Jalons terminés et total, calculés par le moteur. */
  progress: GoalProgress
  /** Vrai si l'utilisateur a marqué l'objectif comme atteint. */
  achieved: boolean
  /** Vrai pendant la célébration qui suit « Marquer comme atteint ». */
  celebrating: boolean
  /** Faux si le réglage de l'application ou celui de l'appareil réduit les animations. */
  motionAllowed: boolean
}

export interface Theme {
  id: string
  /** Nom affiché dans les réglages. */
  name: string
  /** Thème proposé aux nouvelles installations (un seul thème par défaut). */
  isDefault?: boolean
  tokens: {
    light: ThemeTokens
    dark: ThemeTokens
  }
  /** Illustration décorative d'une habitude du jour, affichée dans le bouton de coche. */
  HabitScene?: ComponentType<HabitSceneProps>
  /** Illustration décorative d'une tâche à faire, affichée à côté de sa case à cocher. */
  TaskIllustration?: ComponentType<TaskIllustrationProps>
  /** Scène décorative d'un objectif, affichée au-dessus de sa progression et de ses jalons. */
  GoalScene?: ComponentType<GoalSceneProps>
}
