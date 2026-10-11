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

## 5. Plan d'intégration proposé (à valider)

Le prototype est en Canvas 2D, sans asset. Il ne remplace pas directement le code existant (SVG et CSS) : l'intégration se fait par étapes, une branche par étape.

1. **Moteur de scène Canvas** dans `src/themes/mountain/scene/canvas/` : palettes, bruit, calques, brume, ciel. Logique en fonctions pures testées (interpolation des palettes, géométrie des crêtes et des voies). Composant décoratif `aria-hidden`, l'interface garde tout le texte et l'interactif (P4-D1, P5-D6).
2. **Voies dynamiques** : génération de N voies sur la grande montagne selon le nombre d'habitudes et d'objectifs. Position des alpinistes calculée par le moteur existant : paliers de `STREAK_TIERS` pour les habitudes, `stepAt` de `goalLayout` pour les objectifs (P4-D2), et non `jalons terminés / total` comme dans le prototype.
3. **Village et randonneurs**, entièrement coupés si `useMotionAllowed` renvoie faux.
4. **Remplacement des objets dessinés** (cabanes, sapins, alpinistes) par des illustrations peintes, via le pipeline d'assets existant (`docs/pipeline-assets.md`).
5. **Mesure** : budget de performance (`npm run check:budget`), fluidité sur téléphone d'entrée de gamme, test utilisateur (« Est-ce que ça te donne envie de cocher ? »).

## 6. Points à trancher

- **Où vit la scène** : remplace-t-elle le panorama (P5-D6), s'affiche-t-elle en haut de l'écran « Aujourd'hui », ou les deux ?
- **Animation ambiante** : accepte-t-on plusieurs mouvements simultanés (nuages, brume, randonneurs), ce qui revient sur P5-D5 ?
- **Cycle jour et nuit** : dégradé continu selon l'heure réelle, ou conserver les quatre tranches fixes (P5-D2) avec des transitions ?
- **Nombre de voies** : au-delà de 5 ou 6 voies, la montagne devient chargée. Faut-il une limite, ou une deuxième montagne ?
- **Tâches** : comment les représenter dans cette scène (obstacles sur les voies, randonneurs du village, autre) ?
