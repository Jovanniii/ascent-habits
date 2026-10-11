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
import type { ChainMark, GoalProgress, HabitDayState } from '../engine/index.ts'
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

/** Données neutres transmises au décor d'un jour du calendrier (vue par habitude). */
export interface CalendarDayMarkProps {
  state: HabitDayState
  /** Position du jour dans une chaîne de série, ou null. */
  chain: ChainMark | null
  /** Jour non validé à l'intérieur d'une chaîne (non prévu ou en pause). */
  bridge: boolean
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
  /**
   * Jetons de couleur, communs à tous les thèmes. Le calendrier utilise en plus
   * `--calendar-heat-0` à `--calendar-heat-4` (carte de chaleur) avec leurs couleurs
   * de texte `--calendar-on-heat-*`, `--calendar-mark` (symboles) et
   * `--calendar-chain` (bande des séries).
   */
  tokens: {
    light: ThemeTokens
    dark: ThemeTokens
  }
  /** Illustration décorative d'une habitude du jour, affichée dans le bouton de coche. */
  HabitScene?: ComponentType<HabitSceneProps>
  /**
   * Décor d'un jour du calendrier (symbole et chaîne de série), décoratif. Sans lui,
   * l'interface dessine des symboles simples avec les jetons du thème.
   */
  CalendarDayMark?: ComponentType<CalendarDayMarkProps>
  /** Illustration décorative d'une tâche à faire, affichée à côté de sa case à cocher. */
  TaskIllustration?: ComponentType<TaskIllustrationProps>
  /** Scène décorative d'un objectif, affichée au-dessus de sa progression et de ses jalons. */
  GoalScene?: ComponentType<GoalSceneProps>
  /** Le décor suit le moment de la journée (réglage « Ambiance » proposé dans les réglages). */
  followsAmbiance?: boolean
  /** Vue d'ensemble décorative de toutes les habitudes, en lecture seule (écran « Panorama »). */
  Panorama?: ComponentType<PanoramaProps>
  /**
   * Grand décor vivant de toutes les habitudes, objectifs et tâches du jour, décoratif.
   * S'il existe, il remplace `Panorama` dans l'écran « Panorama » et s'affiche aussi en
   * bandeau en haut de « Aujourd'hui ».
   */
  Scene?: ComponentType<SceneProps>
}

/** Une habitude dans la vue d'ensemble : seulement des données neutres. */
export interface PanoramaHabit {
  id: string
  /** Nom de l'habitude, repris en décor (le texte accessible reste dans l'interface). */
  label: string
  progress: HabitProgress
}

/** Données neutres transmises à la vue d'ensemble (décorative, sans interaction). */
export interface PanoramaProps {
  habits: readonly PanoramaHabit[]
  /** Faux si le réglage de l'application ou celui de l'appareil réduit les animations. */
  motionAllowed: boolean
}

/** Une habitude dans le grand décor. */
export interface SceneHabit {
  id: string
  label: string
  progress: HabitProgress
  /** Habitude en pause : son personnage se repose. */
  paused: boolean
}

/** Un objectif en cours dans le grand décor. */
export interface SceneGoal {
  id: string
  label: string
  /** Jalons terminés et total, calculés par le moteur. */
  progress: GoalProgress
  achieved: boolean
}

/** Données neutres transmises au grand décor (décoratif, sans interaction). */
export interface SceneProps {
  habits: readonly SceneHabit[]
  goals: readonly SceneGoal[]
  /** Nombre de tâches à faire aujourd'hui (en retard comprises). */
  pendingTasks: number
  /** Heure locale affichée, en heures décimales de 0 à 24 (16,5 = 16 h 30). */
  hour: number
  /** « banner » : bandeau en haut d'Aujourd'hui ; « full » : écran Panorama. */
  variant: 'banner' | 'full'
  /** Faux si le réglage de l'application ou celui de l'appareil réduit les animations. */
  motionAllowed: boolean
}
