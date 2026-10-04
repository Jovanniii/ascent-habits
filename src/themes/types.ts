/**
 * Contrat d'un thème.
 *
 * Un thème est un module interchangeable qui habille les données du moteur. Au
 * MVP, il fournit des jetons de couleur ; les assets et animations s'ajouteront
 * à ce contrat avec le thème illustré.
 */

/** Variables CSS appliquées à la racine du document (ex. « --color-bg »). */
export type ThemeTokens = Record<`--${string}`, string>

export interface Theme {
  id: string
  /** Nom affiché dans les réglages. */
  name: string
  tokens: {
    light: ThemeTokens
    dark: ThemeTokens
  }
}
