# Ascent (nom provisoire)

Application personnelle d'habitudes, de tâches et d'objectifs : ouvrir, cocher, repartir en moins d'une minute.
La gamification est un décor agréable, sans pression ni message culpabilisant.

Projet de portfolio product manager. Voir [docs/](docs/) pour la vision, le backlog, la direction artistique et le [journal de décisions](docs/journal-decisions.md).

> Itération 2 : thème montagne avec des visuels provisoires (formes SVG simples), en plus du thème « Sobre ».

## Fonctionnalités actuelles

- **Habitudes** :
  - fréquence quotidienne ou à jours précis ;
  - coche en un toucher, annulable ;
  - série actuelle exprimée en nombre de validations ;
  - paliers (21 jours, 2 mois, 6 mois, 1 an) ;
  - récupération d'un jour manqué, limitée à une par semaine ;
  - pause, archivage.
- **Tâches** : ajout avec échéance facultative, coche, historique.
- **Objectifs** : jalons ajoutables, modifiables et supprimables à tout moment, progression recalculée, action « Marquer comme atteint ».
- **Réglages** :
  - activation ou désactivation des animations ;
  - choix du thème ;
  - export et import JSON, avec export de sécurité avant tout remplacement.
- **Thèmes** :
  - « Montagne » (par défaut pour les nouvelles installations) : chaque habitude du jour s'affiche dans un petit panorama où un alpiniste progresse vers le prochain palier ; un toucher sur le panorama coche l'habitude ;
  - « Sobre » : interface sans illustration.
- **PWA** : installable sur l'écran d'accueil, fonctionne hors ligne.

Les données restent sur l'appareil : aucun compte, aucun serveur, aucune donnée envoyée.

## Démarrer

Prérequis : Node.js 22.

```bash
npm ci
npm run dev        # http://localhost:5173/ascent-habits/
```

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm test` | Tests (Vitest) |
| `npm run test:coverage` | Tests avec couverture du moteur et du stockage |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert le build de production localement |
| `npm run icons` | Régénère les icônes PWA depuis `public/favicon.svg` |

## Architecture

```
src/
  engine/     Moteur : modèle, règles métier et commandes, en TypeScript pur
  storage/    Stockage abstrait (AppRepository), localStorage, validation, export/import
  themes/     Thèmes interchangeables : contrat, registre, progression neutre (progress.ts),
              « mountain » (scène SVG) et « plain » (sobre)
  ui/         Interface React (écrans, composants, état)
```

- **Moteur (`src/engine`) :**
  - Il ne dépend ni de React, ni du stockage, ni des thèmes, ni des API du navigateur. Une règle ESLint le vérifie.
  - Il ne contient aucune référence au thème montagne. Un test le vérifie.
- **Logique métier :**
  - Les séries, la récupération, les paliers et la progression des objectifs sont des fonctions pures testées.
  - Chaque action de l'interface est une commande pure `(données, entrée, contexte) => données`. L'heure et la génération d'identifiants sont injectées par le contexte.
- **Réglages métier :** la limite de récupération et les paliers sont des constantes de `src/engine/config.ts`.
- **Thèmes :**
  - Un thème est un dossier `src/themes/<id>/` qui exporte `theme` depuis `theme.ts` : jetons de couleur et, s'il le souhaite, une illustration décorative des habitudes.
  - L'interface garde le bouton de coche et tous les textes ; le thème ne fournit que du décor.
  - Aucune référence à la montagne en dehors de `src/themes/mountain/` (vérifié par un test), et dépendances entre modules contrôlées par ESLint.
- **Stockage :** l'interface `AppRepository` est asynchrone. Un backend ou IndexedDB pourra remplacer le localStorage en v2 sans toucher au reste.

## Déploiement sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et déploie l'application à chaque push sur `main`.

Une seule fois, dans les réglages du dépôt : **Settings → Pages → Build and deployment → Source : « GitHub Actions »**.

L'application est ensuite servie à l'adresse `https://<compte>.github.io/ascent-habits/`.

Le workflow `.github/workflows/ci.yml` lance le lint, la vérification des types, les tests et le build sur chaque pull request.

## Installer sur un téléphone

- **Android (Chrome)** : ouvrir l'adresse, puis menu ⋮ → « Installer l'application » ou « Ajouter à l'écran d'accueil ».
- **iPhone (Safari)** : ouvrir l'adresse, puis bouton Partager → « Sur l'écran d'accueil ».

Une fois installée, l'application s'ouvre en plein écran et fonctionne sans connexion.
Pensez à exporter régulièrement vos données depuis les Réglages.
