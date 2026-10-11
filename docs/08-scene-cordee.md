# Doc 08 : Scène « Cordée », direction artistique validée

Ce document fixe la direction artistique validée le 11 octobre 2026 à partir du prototype `docs/prototypes/cordee-scene.html`. Il complète le Doc 07 et en remplace certaines parties (voir section 4).

Pour voir le prototype : ouvrir le fichier dans un navigateur, sur ordinateur ou sur téléphone. Il est autonome (un seul fichier, aucun asset).

## 1. Intention

Une scène de montagne vivante et chaleureuse, que l'on a envie de regarder chaque jour.

- **La scène façon Alto's Odyssey** : ciel en dégradé, couchers de soleil, nuits étoilées, plans de montagnes qui pâlissent avec la distance (perspective atmosphérique), halos et rayons de lumière, brume entre les plans.
- **Les objets façon Old Man's Journey** : cabanes, sapins, rochers, personnages dessinés à la main, avec matière et détails. Dans le prototype, ils sont encore dessinés par le code : ce sont des emplacements provisoires, à remplacer par des illustrations peintes.
- **Plus chaud qu'Alto** : ombres violettes ou bleu doux plutôt que noires, lumière dorée, ambiance par défaut proche de l'heure dorée.

## 2. Composition de la scène

De l'arrière vers l'avant :

1. **Ciel** : dégradé à trois couleurs, soleil avec halo et rayons, lune, étoiles qui scintillent, nuages éclairés par le soleil.
2. **Trois plans de montagnes lointaines** : crêtes enneigées, liseré de lumière sur les arêtes, brume entre chaque plan. Seuls ces plans et les nuages défilent lentement.
3. **La grande montagne** : face éclairée et face à l'ombre selon la position du soleil, calotte de neige qui scintille, hachures de roche, sapins sur les pentes basses. Elle porte **une voie d'ascension par habitude et par objectif**.
4. **Le village** (premier plan, fixe) : plateau enneigé, sentier, six cabanes (fumée, fenêtres allumées la nuit), sapins, rochers, barrière, lanternes. Des **randonneurs de passage**, seuls ou encordés, traversent le village en continu.
5. **Finitions** : neige qui tombe (désactivable), grain de papier léger, vignettage.

## 3. Règles visuelles

- **Une seule palette par moment de la journée** pour tout : les objets prennent la teinte de la lumière de la scène (orangés au coucher de soleil, bleutés la nuit).
- **Perspective atmosphérique** : plus un plan est loin, plus il se rapproche de la couleur de l'horizon et moins il est détaillé.
- **Lumière** : liseré clair sur les arêtes, face éclairée du côté du soleil, scintillement de la neige au soleil.
- **Rien ne défile au premier plan** : seuls le ciel, les nuages et les montagnes lointaines bougent. Le village et la grande montagne restent fixes.

## 4. Ce qui change par rapport au Doc 07

| Doc 07 | Scène Cordée |
|---|---|
| Une montagne par habitude, côte à côte (section 5) | Une seule grande montagne, une voie par habitude et par objectif |
| Objectif = grand sommet lointain à l'horizon | Objectif = une voie sur la même montagne, en tirets, un fanion par jalon ; l'alpiniste porte un fanion |
| Formes simples, aplats, pas de contours durs (section 2) | Scène en aplats et dégradés ; objets dessinés avec un léger contour crayonné |
| L'alpiniste bouge, le reste respire à peine | Vie ambiante : nuages, brume, fumée, neige, randonneurs du village (tout coupé si les animations sont réduites) |
| 4 tranches horaires fixes | Dégradé continu dans le prototype (à arbitrer, voir section 6) |

Restent valables : paliers 21 j, 2 mois, 6 mois, 1 an ; aucune culpabilisation ; règle « l'alpiniste ne recule jamais quand on ajoute un jalon » ; cycle jour et nuit.

## 5. Intégration (11 octobre 2026)

Réalisée dans `src/themes/mountain/scene/canvas/` :

- `sky.ts` : lumière en dégradé continu selon l'heure (moments clés de minuit à minuit).
- `layout.ts`, `routes.ts` : géométrie de la scène et des voies, sans limite de nombre.
- `tracks.ts` : traduction des habitudes (paliers) et des objectifs (jalons, règle P4-D2) en cordées.
- `renderer.ts` : rendu Canvas 2D ; les objets (cabanes, sapins, personnages) sont des fonctions isolées, à remplacer plus tard par des illustrations peintes.
- `CordeeScene.tsx` : composant décoratif (`aria-hidden`), fourni par le thème dans le nouvel emplacement `Theme.Scene`.

Où la scène s'affiche :

- **En bandeau en haut d'« Aujourd'hui »**, dès qu'il existe une habitude ou un objectif.
- **En plein écran dans « Panorama »**, avec le curseur « Heure du décor », le bouton « Faire défiler » (une heure par seconde) et « Maintenant » pour revenir à l'heure réelle. Les habitudes, les objectifs en cours et le nombre de tâches du jour sont repris en texte sous le décor.

Animations : nuages, brume, neige, fumée, randonneurs et montée des alpinistes, toutes coupées si l'application ou l'appareil demande de réduire les animations (une image fixe est alors dessinée).

## 6. Les tâches dans la scène

Idées étudiées :

1. **Randonneurs au poteau de départ** (retenue) : chaque tâche du jour est un randonneur qui attend au poteau indicateur du village ; terminer une tâche le fait partir sur le sentier.
2. Obstacles sur le sentier du village (rochers, congères) que l'on dégage.
3. Colis de ravitaillement à monter au refuge par un téléphérique.
4. Lanternes du village qui s'allument une à une.
5. Mulet chargé de sacs, un sac par tâche, qui part quand tout est fait.

L'idée 1 a été retenue : elle prolonge la vie du village, elle reste lisible avec beaucoup de tâches (au plus 12 randonneurs dessinés) et le départ du randonneur est une petite récompense sans pression.

## 7. Suite

- Remplacer les objets dessinés par des illustrations peintes (cabanes, sapins, alpinistes, randonneurs), via le pipeline d'assets.
- Mesurer la fluidité sur un téléphone d'entrée de gamme.
- Test utilisateur : « Est-ce que ça te donne envie de cocher ? ».
