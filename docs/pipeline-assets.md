# Pipeline d'assets du thème montagne

Ce document explique comment livrer les vraies illustrations du thème montagne (Doc 07, section 9) sans toucher au code, et quel budget de performance elles doivent respecter.

En résumé : on dépose un fichier SVG bien nommé dans `src/themes/mountain/assets/svg/`, on lance `npm run assets:optimize`, et la scène l'utilise. Tant qu'un fichier manque, la scène dessine sa forme provisoire actuelle.

---

## 1. Où vont les fichiers

```
src/themes/mountain/assets/
├── manifest.ts      liste typée de tous les assets attendus (source de vérité)
├── resolve.ts       découverte des fichiers et repli quand un fichier manque
├── SceneAsset.tsx   affichage dans la scène : illustration ou forme provisoire
├── svgOptimizer.ts  optimisation et contrôle (sans dépendance)
├── budget.ts        seuils de performance
├── fonts/           Nunito 400 et 700, woff2, sous-ensemble latin (licence OFL)
└── svg/             les illustrations livrées : <id>.svg
```

## 2. Formats acceptés

| Format | Accepté | Pourquoi |
| --- | --- | --- |
| SVG | Oui, seul format des illustrations | Vectoriel (net sur tous les écrans), léger, conforme au Doc 07 (section 10) |
| PNG, JPEG, WebP | Non au MVP | Poids, flou sur grands écrans ; à rediscuter si une texture l'exige |
| Lottie, GIF, vidéo | Non | Les animations passent par CSS (transform et opacity), coupables par l'utilisateur |

Règles pour un SVG (vérifiées par `npm run assets:check` et par les tests) :

- un `viewBox` aux proportions du manifeste (tolérance 2 %) ;
- aplats de couleur et dégradés simples, formes arrondies, pas de contour dur (Doc 07) ;
- pas de texte (à vectoriser), pas de script, pas de gestionnaire `on…`, pas de `foreignObject` ;
- pas d'image intégrée (bitmap ou SVG externe), pas de lien externe : seules les références internes `#id` sont permises ;
- pas de filtre SVG (flou, ombre) ni d'animation SMIL : trop coûteux sur téléphone ;
- au plus **12 Ko** par fichier une fois optimisé.

## 3. Nommage

Le nom du fichier est l'identifiant du manifeste suivi de `.svg`, en minuscules et tirets. Un fichier dont le nom n'est pas dans le manifeste est refusé (test « illustrations livrées »).

| Groupe | Fichiers | viewBox | Ancrage | Forme provisoire si absent |
| --- | --- | --- | --- | --- |
| Plans de montagnes (1 lointain → 4 premier plan) × lumière | `plane-1-day.svg` … `plane-4-night.svg` (12 fichiers : `day`, `evening`, `night`) | 1280 × 120 | bas gauche | plans 1 et 2 : chaînes actuelles ; plans 3 et 4 : rien |
| Alpiniste, 6 états | `climber-rest`, `climber-walk`, `climber-tent`, `climber-celebrate`, `climber-summit`, `climber-recovery` | 24 × 32 | pieds, en bas au centre | silhouette actuelle |
| Camp de base | `camp.svg` | 24 × 24 | bas centre | tente et fanion actuels |
| Flamme de série, 2 niveaux | `flame-1.svg`, `flame-2.svg` | 16 × 20 | bas centre | flamme actuelle |
| Obstacles de tâche | `obstacle-rock`, `obstacle-low-cloud`, `obstacle-branch`, `obstacle-scree` | 32 × 24 | bas centre | obstacles actuels de la piste 4 |
| Drapeau de sommet d'habitude | `summit-flag.svg` | 20 × 20 | pied du mât, en bas à gauche | drapeau actuel |
| Sommet d'objectif | `goal-summit.svg` | 160 × 120 | bas centre | rien : au manifeste, pas encore affiché (le sommet actuel est calculé) |
| Fanion de jalon | `pennant.svg` | 12 × 20 | pied du mât, en bas à gauche | fanion actuel |
| Icônes de calendrier | `calendar-validated`, `calendar-recovered`, `calendar-missed` | 24 × 24 | bas centre | rien : au manifeste, à afficher par le calendrier |

Lumières : le matin réutilise les plans de jour, seul le ciel change (palette « matin »). Les plans 1 à 4 ont une variante par lumière parce qu'une image SVG chargée à part ne reçoit pas les couleurs de la page.

Couleurs : rester dans la palette du Doc 07 (`scene/palettes.ts`). L'accent rouge orangé `#E8573C` est réservé à l'alpiniste, à la flamme et au drapeau ; posé sur le décor, il garde un halo clair (contraste d'au moins 3:1).

L'état « jour manqué » (`climber-tent`) est une pause tranquille à la tente : aucun élément triste, gris ou barré.

## 4. Ajouter un asset

1. Exporter le SVG depuis l'outil de dessin (Figma : « Exporter → SVG »).
2. Le nommer selon le tableau (ex. `climber-walk.svg`) et le déposer dans `src/themes/mountain/assets/svg/`.
3. Lancer `npm run assets:optimize` : le fichier est nettoyé sur place (métadonnées, attributs d'éditeur, coordonnées arrondies à 2 décimales) et contrôlé (nom, proportions, contenu interdit, poids).
4. Lancer `npm run dev` et vérifier la scène (écran « Aujourd'hui » et « Panorama », dans les quatre ambiances via Réglages → Ambiance).
5. Committer le fichier. La CI relance `npm run assets:check` (échoue si un fichier n'est pas optimisé ou enfreint une règle) et les tests de poids.

Pour un asset qui n'est pas encore au manifeste (nouvel élément de décor) : l'ajouter dans `manifest.ts` avec ses dimensions, son ancrage et sa description, puis l'afficher via `<SceneAsset id="…">forme provisoire</SceneAsset>`.

## 5. Comment le repli fonctionne

- `resolve.ts` découvre les fichiers de `svg/` **à la compilation** (`import.meta.glob`) : aucun appel réseau pour savoir si un fichier existe.
- `SceneAsset` affiche l'illustration (`<image>` SVG) si le fichier existe, sinon la forme provisoire passée en enfant.
- Si le fichier existe mais ne se charge pas (fichier corrompu), l'erreur de chargement fait aussi retomber sur la forme provisoire.
- Les petits fichiers (moins de 4 Ko) sont intégrés au code par Vite ; les autres sont servis à part et mis en cache par le service worker (hors ligne).

## 6. Budget de performance

Seuils définis dans `src/themes/mountain/assets/budget.ts` :

| Mesure | Seuil | Vérification |
| --- | --- | --- |
| Une illustration SVG optimisée | ≤ 12 Ko | tests + `assets:check` |
| Poids de la scène (toutes les illustrations) | ≤ 150 Ko non compressé | tests + `assets:check` + `check:budget` |
| Polices (woff2, 2 graisses) | ≤ 40 Ko (actuel : 31,8 Ko) | `check:budget` (CI, après le build) |
| JavaScript compressé (gzip) | ≤ 130 Ko (actuel : 88 Ko) | `check:budget` |
| CSS compressé (gzip) | ≤ 12 Ko (actuel : 4 Ko) | `check:budget` |
| Images par seconde | 60 visées, 50 minimum acceptable sur un téléphone moyen (ex. Android de milieu de gamme de 3 ans), sans saccade pendant une coche | manuel (voir ci-dessous) |
| Mise en page à la coche | aucun recalcul de la scène : seules `transform` et `opacity` sont animées, la scène a une taille fixe | test « n'anime que transform et opacity » |

Règles qui tiennent ce budget :

- une seule animation principale à la fois : le geste de l'alpiniste sur « Aujourd'hui » ; dans le panorama, les nuages (matin, jour, soir) ou le scintillement (nuit), jamais les deux ;
- le ciel des cartes d'habitude est immobile : la vie du ciel est réservée au panorama ;
- les couleurs changent par transition, seulement au changement d'ambiance (quatre fois par jour au plus) ;
- le parallaxe écrit au plus une variable CSS par image (`requestAnimationFrame`), et rien si les animations sont réduites ;
- pas de filtre SVG, pas de flou, pas d'ombre portée.

Vérification manuelle des images par seconde (avant une version) : Chrome → DevTools → Performance, profil « 4× slowdown », cocher une habitude puis faire défiler le panorama ; aucune image au-delà de 20 ms ne doit apparaître en rouge.
