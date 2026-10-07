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
import type { ChainMark, HabitDayState } from '../engine/index.ts'
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
}
