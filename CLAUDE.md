# Projet : application d'habitudes, tâches et objectifs gamifiée (nom provisoire : Ascent)

## Contexte
Application personnelle conçue comme un projet de portfolio product manager.
Elle réunit trois objets : habitudes (récurrentes, sans fin), tâches (ponctuelles) et objectifs (destination avec jalons).
Positionnement : usage rapide (ouvrir, cocher, repartir en moins d'une minute), gamification comme décor visuel agréable, aucune pression de rétention, aucun message culpabilisant.
Le thème visuel du MVP est la montagne. D'autres thèmes viendront plus tard : l'architecture doit séparer le moteur (données et logique) de l'habillage visuel (thème).

## Documents de référence
- docs/01-probleme-vision.md
- docs/06-backlog-mvp.md (user stories, priorités M/S/C/W)
- docs/07-direction-artistique-montagne.md

## Stack
React + TypeScript + Vite, PWA installable, stockage local (IndexedDB ou localStorage via une couche d'abstraction), aucun backend au MVP, déploiement sur GitHub Pages. Tests avec Vitest.

## Règles de travail
- Parler et commenter en français ; noms de code en anglais.


- Petites itérations : une fonctionnalité par branche, commits clairs, pull request à chaque étape.
- Toute la logique métier (séries, récupération, progression des objectifs) vit dans des fonctions pures testées, indépendantes de l'interface.
- Les thèmes sont des modules interchangeables (couleurs, assets, animations) ; aucune référence à la montagne dans le moteur.
- Interface mobile d'abord, accessible (contrastes, tailles tactiles, option pour réduire les animations).
- Ne jamais ajouter de mécanique de culpabilisation (pas de pénalité, pas de message négatif).
- Avant tout gros changement, proposer un plan et attendre validation.


## Mode de travail en sessions parallèles
- Plusieurs sessions Claude Code peuvent travailler en même temps, chacune sur sa propre branche (claude/<piste>) créée depuis main à jour.
- Chaque session reste dans son périmètre de fichiers, indiqué dans son prompt. Hors périmètre : changement minimal, signalé dans la PR.
- Fichiers partagés sensibles : src/themes/types.ts, src/themes/registry.ts, docs/journal-decisions.md, package.json. Y ajouter uniquement, ne jamais réorganiser. En cas de conflit au rebase, conserver les deux côtés.
- Identifiants du journal de décisions préfixés par la piste (P4-D1, P5-D1, P6-D1…), jamais renumérotés.
- Autonomie : ne pas attendre de validation pour les choix courants. Décider, consigner dans docs/journal-decisions.md (décision, alternatives écartées, raison) et lister dans la PR « Décisions prises » et « À confirmer ». S'arrêter et demander uniquement pour : changement du schéma de données (AppData, schemaVersion), suppression d'une fonctionnalité, ajout d'une dépendance lourde, tout ce qui touche à la vie privée.
- Avant d'ouvrir la PR : lint, types, tests et build au vert, rebase sur main.
- Chaque PR contient : résumé, décisions prises, points à confirmer, hypothèses à tester, façon de tester sur téléphone.
