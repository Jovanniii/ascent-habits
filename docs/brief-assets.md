# Brief d'illustration : thème Montagne

Destinataire : un illustrateur ou une illustratrice indépendant(e), ou Victor sous Figma.
Sources : `docs/07-direction-artistique-montagne.md` (Doc 07, la direction artistique), `docs/pipeline-assets.md` (comment les fichiers entrent dans l'application) et `src/themes/mountain/assets/manifest.ts` (la liste typée des fichiers attendus, qui fait foi).

Ce brief dit **quoi dessiner, à quelles contraintes, et quoi livrer**. Les noms de fichiers, proportions et limites de poids ci-dessous sont ceux que l'application vérifie automatiquement : un fichier qui s'en écarte est refusé à l'intégration.

---

## 1. Le projet en deux phrases

Ascent est une application mobile de suivi d'habitudes, de tâches et d'objectifs. On l'ouvre, on coche, on repart en moins d'une minute ; l'illustration est un décor agréable qui récompense le geste, jamais une pression.

Chaque habitude est un alpiniste sur sa propre montagne. Cocher l'habitude le fait monter d'un pas ; les tâches sont de petits obstacles sur le sentier ; un objectif est un grand sommet à l'horizon, jalonné de fanions.

## 2. Intention artistique

**Une montagne douce et lumineuse qui donne envie d'avancer pas à pas.** Ambiance contemplative, jamais dramatique : l'alpinisme comme une promenade inspirante, pas comme une épreuve.

Garde-fous (Doc 07, section 2) :

- **Formes simples et arrondies**, aplats de couleur, **aucun contour dur** (pas de trait noir autour des formes).
- **Palette limitée** : 5 à 6 couleurs de base, déclinées par moment de la journée (section 3).
- **Lumière douce** : dégradés légers, silhouettes, pas d'ombre portée ni de flou.
- **Profondeur par plans** : 4 couches de montagnes qui se superposent (section 6).
- **Une seule animation principale à la fois** : l'alpiniste bouge, le reste respire à peine.
- **Rien de négatif ni de culpabilisant.** Un jour manqué, c'est un alpiniste qui se repose à la tente, pas un échec : aucun élément triste, gris, cassé, barré, aucune larme, aucun ciel d'orage.

Ce que l'on veut ressentir en ouvrant l'écran : « j'ai envie de cocher ». Le test de l'écran pilote (Doc 07, section 11) posera exactement cette question à cinq personnes.

## 3. Palette par moment de la journée

Le ciel suit l'heure réelle. Il est **dessiné par l'application** (dégradé), pas par l'illustrateur ; il est donné ici pour que les illustrations s'y accordent.

Valeurs de référence (fichier `src/themes/mountain/scene/palettes.ts`) :

| Rôle | Matin | Jour | Soir | Nuit |
| --- | --- | --- | --- | --- |
| Ciel, haut (dessiné par l'appli) | `#FFD9B0` pêche | `#BCD4EE` | `#6C5B9E` violet doux | `#1F2A4D` bleu nuit |
| Ciel, bas (dessiné par l'appli) | `#FFF3E6` | `#EEF3F8` | `#F2B8A2` | `#3A3F73` |
| Plan lointain | `#A8B8D8` bleu brume | `#A8B8D8` | `#9D8FBF` | `#3E4F7A` |
| Plan intermédiaire | `#8FA3C6` | `#8FA3C6` | `#7A6FA6` | `#485E8A` |
| Plan proche | `#4F6D8F` bleu ardoise | `#4F6D8F` | `#4B4A7D` | `#5D7BA0` |
| Neige | `#F7F4EF` blanc chaud | `#F7F4EF` | `#F6ECE8` | `#E9EDF5` |
| Halo (sous les éléments qui comptent) | `#F7F4EF` | `#F7F4EF` | `#F7F4EF` | `#F7F4EF` |
| Accent (alpiniste, flamme, drapeau) | `#E8573C` rouge orangé | idem | idem | idem |
| Encre (mâts, petits traits) | `#1F2A4D` | idem | idem | idem |
| Nuages (dessinés par l'appli) | `#FFFAF4` | `#FFFFFF` | `#F9D4C4` | `#5A6796` |
| Étoiles (dessinées par l'appli) | — | — | `#FFF6D8` discrètes | `#FFF6D8` |

Règles de couleur :

- **Le matin réutilise les illustrations de jour** : seul le ciel change. Il y a donc trois lumières à dessiner : `day`, `evening`, `night`.
- Une illustration chargée comme fichier ne reçoit pas les couleurs de la page : **les couleurs sont figées dans le fichier**. C'est pourquoi les plans de montagnes existent en trois variantes de lumière.
- Les personnages et objets (alpiniste, camp, flamme, obstacles, drapeaux) ont **un seul fichier pour toutes les lumières** : ils doivent rester lisibles sur le jour clair comme sur le bleu nuit. D'où le halo clair (`#F7F4EF`) qui les détoure discrètement.
- **L'accent `#E8573C` est réservé** à l'alpiniste, à la flamme de série et au drapeau du sommet : c'est lui qui guide l'œil. Pas d'accent dans le décor, les obstacles ou les icônes neutres.
- Contrastes (vérifiés par les tests de l'application) : accent sur halo ≥ 3:1 ; tentes et sentier sur la montagne proche ≥ 3:1, dans les quatre ambiances.
- Vous pouvez ajouter des nuances intermédiaires (ombre de neige, reflet), tant qu'elles restent dans la famille de couleur du plan et que l'ensemble tient en 5 à 6 teintes de base.

## 4. Liste exhaustive des assets

**31 fichiers SVG** au manifeste. Le nom de fichier est l'identifiant du manifeste suivi de `.svg`, en minuscules et tirets. Un nom absent du manifeste est refusé.

Lecture des colonnes :

- **viewBox** : taille du cadre SVG en unités, qui fixe les **proportions** (tolérance 2 %). Vous pouvez dessiner plus grand dans Figma (voir « Cadre de travail ») tant que les proportions sont identiques.
- **Ancrage** : le point du dessin posé sur le décor par l'application. Le dessin doit toucher ce point (les pieds au bas du cadre, le pied du mât dans le coin…).
- **Affichage** : taille approximative à l'écran d'un téléphone de 360 px de large (estimée d'après la scène actuelle, à vérifier sur l'écran pilote).

### 4.1 Plans de montagnes (12 fichiers)

| Fichier | Variantes | viewBox | Cadre de travail Figma | Ancrage | Poids visé |
| --- | --- | --- | --- | --- | --- |
| `plane-1-day.svg`, `plane-1-evening.svg`, `plane-1-night.svg` | chaîne lointaine × 3 lumières | 1280 × 120 | 1280 × 120 | bas gauche | ≤ 6 Ko |
| `plane-2-day.svg`, `plane-2-evening.svg`, `plane-2-night.svg` | chaîne intermédiaire × 3 lumières | 1280 × 120 | 1280 × 120 | bas gauche | ≤ 6 Ko |
| `plane-3-day.svg`, `plane-3-evening.svg`, `plane-3-night.svg` | collines proches × 3 lumières | 1280 × 120 | 1280 × 120 | bas gauche | ≤ 6 Ko |
| `plane-4-day.svg`, `plane-4-evening.svg`, `plane-4-night.svg` | premier plan × 3 lumières | 1280 × 120 | 1280 × 120 | bas gauche | ≤ 6 Ko |

Les trois lumières d'un même plan partagent **exactement la même silhouette** : seules les couleurs changent (dupliquer le calque, recolorer). Règles de superposition en section 6.

### 4.2 Alpiniste (6 états, 6 fichiers)

| Fichier | État | Quand il apparaît | viewBox | Cadre Figma | Ancrage | Affichage | Poids visé |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `climber-rest.svg` | Au repos | Habitude pas encore cochée aujourd'hui : debout ou assis, détendu | 24 × 32 | 240 × 320 | pieds, bas centre | ~25 × 34 px | ≤ 3 Ko |
| `climber-walk.svg` | Marche | Habitude cochée : pose de montée, un pied en avant, bâton ou sac | 24 × 32 | 240 × 320 | pieds, bas centre | ~25 × 34 px | ≤ 3 Ko |
| `climber-tent.svg` | Pause à la tente | Jour non validé : assis devant sa tente, tasse à la main, serein | 24 × 32 | 240 × 320 | pieds, bas centre | ~25 × 34 px | ≤ 3 Ko |
| `climber-celebrate.svg` | Célébration | Palier atteint (21 jours, 2 mois, 6 mois, 1 an) : bras levés, drapeau | 24 × 32 | 240 × 320 | pieds, bas centre | ~25 × 34 px | ≤ 3 Ko |
| `climber-summit.svg` | Au sommet | Cycle terminé : regarde l'horizon, prêt à repartir vers une montagne plus haute | 24 × 32 | 240 × 320 | pieds, bas centre | ~25 × 34 px | ≤ 3 Ko |
| `climber-recovery.svg` | Récupération | Rattrapage d'un jour manqué : il tient une petite corde qui « répare » le chemin | 24 × 32 | 240 × 320 | pieds, bas centre | ~25 × 34 px | ≤ 3 Ko |

À cette taille, **la silhouette doit se lire à elle seule** : tête ronde, sac, bonnet ou vêtement à l'accent `#E8573C`, posture très marquée d'un état à l'autre. Les six états doivent être reconnaissables en noir pur (test de silhouette). Le personnage reste neutre (pas de genre marqué, pas de visage détaillé) pour que chacun s'y projette.

### 4.3 Éléments de progression (5 fichiers)

| Fichier | Rôle | Variantes | viewBox | Cadre Figma | Ancrage | Affichage | Poids visé |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `camp.svg` | Camp de base à chaque palier : tente et petit fanion | 1 | 24 × 24 | 240 × 240 | bas centre | ~20 × 20 px | ≤ 3 Ko |
| `flame-1.svg` | Flamme de série, intensité douce (petit feu de camp) | niveau 1 | 16 × 20 | 160 × 200 | bas centre | ~14 × 18 px | ≤ 1,5 Ko |
| `flame-2.svg` | Flamme de série, intensité vive (dès le premier palier) | niveau 2 | 16 × 20 | 160 × 200 | bas centre | ~14 × 18 px | ≤ 1,5 Ko |
| `summit-flag.svg` | Drapeau planté au sommet d'une habitude | 1 | 20 × 20 | 200 × 200 | pied du mât, bas gauche | ~18 × 18 px | ≤ 1,5 Ko |
| `pennant.svg` | Fanion de jalon planté sur le chemin d'un objectif | 1 | 12 × 20 | 120 × 200 | pied du mât, bas gauche | ~10 × 18 px | ≤ 1 Ko |

Les deux flammes ont la même base (bûches) ; le niveau 2 est plus haut et plus lumineux, pas plus « agressif ».

### 4.4 Obstacles de tâche (4 fichiers)

| Fichier | Obstacle | viewBox | Cadre Figma | Ancrage | Poids visé |
| --- | --- | --- | --- | --- | --- |
| `obstacle-rock.svg` | Rocher arrondi sur le sentier | 32 × 24 | 320 × 240 | bas centre | ≤ 2 Ko |
| `obstacle-low-cloud.svg` | Nuage bas qui traverse le chemin | 32 × 24 | 320 × 240 | bas centre | ≤ 2 Ko |
| `obstacle-branch.svg` | Branche tombée | 32 × 24 | 320 × 240 | bas centre | ≤ 2 Ko |
| `obstacle-scree.svg` | Petit éboulis (trois ou quatre cailloux) | 32 × 24 | 320 × 240 | bas centre | ≤ 2 Ko |

Les obstacles sont **amicaux** : on a plaisir à les dégager, ils ne menacent pas. Couleurs du décor, pas d'accent. La disparition est animée par l'application (section 5.4).

### 4.5 Objectif (1 fichier)

| Fichier | Rôle | viewBox | Cadre Figma | Ancrage | Poids visé |
| --- | --- | --- | --- | --- | --- |
| `goal-summit.svg` | Grand sommet lointain à l'horizon, drapeau à la cime | 160 × 120 | 640 × 480 | bas centre | ≤ 8 Ko |

Le sommet est vu de loin (couleurs du plan lointain, neige à la cime) ; le drapeau à l'accent est le seul point vif. Il sera rapproché par l'application au fil des jalons. Pas encore affiché dans l'application : il remplacera le sommet calculé actuel.

### 4.6 Icônes de calendrier (3 fichiers)

| Fichier | Jour | viewBox | Cadre Figma | Ancrage | Affichage | Poids visé |
| --- | --- | --- | --- | --- | --- | --- |
| `calendar-validated.svg` | Jour validé : petit sommet ou étoile, tampon de carnet de randonnée | 24 × 24 | 240 × 240 | bas centre | 12 à 20 px | ≤ 1 Ko |
| `calendar-recovered.svg` | Jour rattrapé : même pictogramme, avec la petite corde de récupération | 24 × 24 | 240 × 240 | bas centre | 12 à 20 px | ≤ 1 Ko |
| `calendar-missed.svg` | Jour non validé : **neutre**, une simple empreinte discrète ou un point | 24 × 24 | 240 × 240 | bas centre | 12 à 20 px | ≤ 1 Ko |

Les icônes s'affichent sur une grille claire comme sur un fond sombre : prévoir un halo ou une forme pleine qui reste lisible sur les deux. L'icône « non validé » n'est ni grise, ni barrée, ni rouge.

### 4.7 Hors manifeste (à ne pas livrer en fichier)

Pour éviter tout travail en double, ces éléments du Doc 07 sont **dessinés par le code** ou **déjà couverts** :

- le ciel, ses dégradés, les nuages et les étoiles (code) ;
- la montagne de chaque habitude et la nouvelle montagne plus haute après le sommet (calculées selon la progression) ;
- la corde ou le pont de récupération : porté par `climber-recovery.svg` et `calendar-recovered.svg` ;
- les composants d'interface (case à cocher, cartes, boutons) : réalisés en CSS. Une maquette Figma de leur style est bienvenue (livrable optionnel, section 10), pas de fichier SVG.

## 5. Animations

### 5.1 Comment l'application anime

À connaître avant de dessiner, parce que cela change ce qu'il faut produire :

- L'application **déplace, agrandit ou fait apparaître l'illustration entière** (transformations CSS `transform` et `opacity`). Elle ne peut pas animer l'intérieur d'un fichier SVG.
- Les animations internes au fichier (SMIL, `<animate>`), les GIF, Lottie et vidéos sont **refusés** (poids, et impossible à couper pour les personnes qui demandent à réduire les animations).
- **Une seule animation principale à la fois.** Boucles courtes, mouvements doux (`ease-in-out`), petite amplitude.
- Tout s'arrête si l'utilisateur a désactivé les animations : **chaque fichier doit donc se suffire en image fixe**.

Conséquence : au MVP, **chaque état = une pose clé unique** (le fichier du manifeste), que l'application fait vivre par de petits mouvements d'ensemble. Les images clés supplémentaires (section 5.2) préparent une animation plus riche, image par image, à intégrer ensuite.

Mouvements d'ensemble actuels, à garder en tête pour la pose :

| Geste | Mouvement appliqué au fichier | Durée |
| --- | --- | --- |
| Respiration au repos | étirement vertical de 5 %, depuis les pieds | boucle de 4 s |
| Pas de montée (coche) | glisse de 2 unités à droite et 4 vers le haut, puis revient | 600 ms |
| Petit retour (décoche) | léger recul | 300 ms |
| Sauts de célébration | deux petits sauts de 4 unités | 900 ms |

Une pose qui marche bien avec ces mouvements : centre de gravité au-dessus des pieds, rien qui dépasse du cadre, pieds posés exactement sur le bas du cadre.

### 5.2 Images clés à produire

Livrées **en plus** du fichier principal, dans un dossier séparé (section 9), avec la convention proposée `<id>-frame-<n>.svg` (n à partir de 1). Même viewBox, même ancrage, même cadre de travail que le fichier principal ; d'une image à l'autre, **les pieds ne bougent pas** sauf quand c'est le pas lui-même.

| Animation | Fichier principal | Images clés | Contenu de chaque image | Boucle |
| --- | --- | --- | --- | --- |
| Marche de l'alpiniste | `climber-walk.svg` (= image 1) | `climber-walk-frame-1.svg` à `climber-walk-frame-4.svg` | 1 contact pied droit en avant, 2 passage (jambes croisées, corps au plus haut), 3 contact pied gauche en avant, 4 passage | 1 à 2 s, en boucle, cadence lente de promenade |
| Célébration | `climber-celebrate.svg` (= image 3) | `climber-celebrate-frame-1.svg` à `climber-celebrate-frame-3.svg` | 1 anticipation (légère flexion, bras bas), 2 élan (bras à mi-hauteur), 3 bras levés, drapeau déployé | joué une fois (environ 900 ms), puis reste sur l'image 3 |
| Pause à la tente | `climber-tent.svg` (= image 1) | `climber-tent-frame-1.svg` à `climber-tent-frame-3.svg` | 1 assis, tasse basse ; 2 tasse portée aux lèvres ; 3 tête légèrement levée vers le ciel (fumée de la tasse qui monte) | boucle lente de 3 à 4 s, presque immobile |

Optionnel, si le temps le permet : `flame-1-frame-1.svg` et `flame-1-frame-2.svg` (deux formes de flamme pour une oscillation), idem pour `flame-2`.

Ces noms **ne sont pas encore au manifeste** : l'application les refuserait dans le dossier des illustrations. Ils seront ajoutés au manifeste quand l'animation image par image sera développée (voir « À confirmer » en section 11).

### 5.3 Sommet et récupération

Pas d'images clés demandées : `climber-summit.svg` et `climber-recovery.svg` sont des poses fixes, animées par la position de l'alpiniste sur le sentier.

### 5.4 Disparition des obstacles et victoire d'objectif

Animées par l'application sur le fichier entier (fondu, glissement ou envol selon l'obstacle : le nuage bas s'envole, la branche glisse, le rocher roule, l'éboulis s'affaisse). Rien à produire en plus ; dessiner chaque obstacle comme **un seul bloc** compact, sans élément qui déborde du cadre. Même principe pour la victoire au sommet d'objectif : le drapeau de `goal-summit.svg` est déjà déployé.

## 6. Superposition des plans et parallaxe

Le panorama empile, de l'arrière vers l'avant :

1. **ciel** (code) ;
2. **`plane-1`** : chaîne lointaine, la plus claire, sommets les plus hauts, peu de détails ;
3. **`plane-2`** : chaîne intermédiaire, un ton plus soutenu ;
4. **`plane-3`** : collines proches (au manifeste, pas encore affiché) ;
5. **les montagnes des habitudes** avec leurs alpinistes (code + assets) ;
6. **`plane-4`** : premier plan, au plus près (au manifeste, pas encore affiché).

Règles :

- **Fond transparent** au-dessus de la silhouette : on doit voir les plans de derrière et le ciel.
- **Base pleine jusqu'au bas du cadre**, sur toute la largeur : aucun trou entre un plan et le bas de l'écran.
- **Hauteur décroissante vers l'avant** : le plan 1 peut occuper jusqu'à 70 % de la hauteur du cadre, le plan 2 environ 55 %, le plan 3 environ 35 %, le plan 4 au plus 20 % (pour ne pas masquer les alpinistes, qui marchent dans la moitié basse).
- **Contraste décroissant vers l'arrière** : le plus lointain est le plus pâle et le plus proche du ciel (perspective atmosphérique).
- **Largeur continue** : le cadre de 1280 est cadré depuis la gauche et coupé à droite selon l'écran. Mettre l'essentiel dans les 400 premières unités (largeur d'un téléphone), et faire en sorte que **les bords gauche et droit aient la même hauteur** pour pouvoir répéter le plan sans couture si la rangée s'allonge.
- **Vitesses de parallaxe** (pour juger l'effet) : plan 1 à 0,25 fois le défilement, plan 2 à 0,5 fois, montagnes des habitudes à 1 fois. Les plans 3 et 4 n'ont pas encore de vitesse (proposition : 0,75 et 1,25).
- Pas de détail fin ou de texture sur les plans 1 et 2 : ils bougent et doivent rester calmes.
- La silhouette du plan 4 peut porter quelques détails (herbes, sapins arrondis, rochers), toujours en aplats.

## 7. Contraintes techniques et de poids

Vérifiées automatiquement à l'intégration (`npm run assets:check`, tests de l'application) :

| Contrainte | Valeur |
| --- | --- |
| Format | **SVG uniquement** (pas de PNG, JPEG, WebP, GIF, Lottie, vidéo) |
| Proportions | celles du viewBox du manifeste, tolérance 2 % |
| Poids d'un fichier optimisé | **≤ 12 Ko** (objectifs par groupe en section 4, plus serrés) |
| Poids total des illustrations du manifeste | **≤ 150 Ko** non compressé |
| Interdits | texte (à vectoriser), script, gestionnaire `on…`, `foreignObject`, image intégrée (bitmap ou SVG externe), lien externe, filtre SVG (flou, ombre), animation SMIL |
| Autorisé | aplats, dégradés linéaires ou radiaux simples, `clipPath`, références internes `#id` |

Répartition indicative du budget de 150 Ko (somme des objectifs de la section 4) :

| Groupe | Fichiers | Objectif | Sous-total |
| --- | --- | --- | --- |
| Plans | 12 | 6 Ko | 72 Ko |
| Alpiniste | 6 | 3 Ko | 18 Ko |
| Camp, flammes, drapeau, fanion | 5 | 1 à 3 Ko | 8,5 Ko |
| Obstacles | 4 | 2 Ko | 8 Ko |
| Sommet d'objectif | 1 | 8 Ko | 8 Ko |
| Icônes de calendrier | 3 | 1 Ko | 3 Ko |
| **Total** | **31** | | **117,5 Ko** |

La marge d'environ 32 Ko est réservée aux images clés (section 5.2) quand elles entreront au manifeste : viser 2 Ko par image clé.

Conseils pour tenir le poids :

- peu de points par courbe, formes fusionnées (union) plutôt que superposées ;
- dégradés partagés plutôt que dupliqués, deux arrêts de couleur maximum ;
- pas de calque masqué ou vide dans l'export ;
- coordonnées arrondies : l'outil d'optimisation de l'application arrondit à 2 décimales, inutile d'aller plus loin.

Accessibilité : les illustrations sont décoratives (l'application donne toute l'information en texte) ; pas besoin de `title` ni de `desc`. En revanche, aucun sens ne doit reposer sur la seule couleur (les états de l'alpiniste se distinguent par la posture).

## 8. Références visuelles à décrire (sans copier)

Directions à explorer, **décrites et non reproduites** : aucune œuvre existante ne doit être calquée, recoloriée ou reprise, même partiellement.

- **Affiches de voyage des années 1930 à 1950** : grands aplats, ciel en dégradé, sommets simplifiés en trois ou quatre tons, impression de calme. Retenir la simplification des volumes, pas la typographie ni le grain.
- **Illustration « flat » contemporaine de paysage** : silhouettes empilées en bandes de couleur, perspective atmosphérique par simple éclaircissement des plans.
- **Livres illustrés pour enfants autour de la randonnée** : personnages ronds, expressions par la posture plutôt que par le visage, douceur générale.
- **Jeux vidéo contemplatifs en 2D** : plans en parallaxe, palette qui change avec l'heure, une seule chose qui bouge à la fois.
- **Carnet de randonnée** (pour le calendrier) : tampons, petites empreintes, pictogrammes comme apposés à l'encre.

À éviter : réalisme photographique, contours noirs épais, ombres portées, textures bruitées, ambiance héroïque ou dangereuse (crevasses, tempête, chute), symboles d'échec.

## 9. Droits d'usage attendus

Le contrat (ou le bon de commande) doit couvrir l'usage commercial. Deux formules acceptables, au choix de l'illustrateur :

1. **Cession des droits patrimoniaux** : reproduction, représentation et adaptation ;
2. **Licence non exclusive** couvrant au minimum les mêmes usages.

Dans les deux cas, le texte doit préciser, comme l'exige le droit français pour une cession :

- **usages** : application (web, PWA, magasins d'applications), pages de présentation, réseaux sociaux, portfolio de Victor, supports de présentation, **y compris dans une version payante ou commerciale** de l'application ;
- **adaptations autorisées** : recadrage, recoloration (nouvelles ambiances), animation, découpage en calques, déclinaisons et optimisation des fichiers ;
- **territoire** : monde entier ;
- **durée** : toute la durée de protection des droits (ou, pour une licence, une durée longue explicitement fixée) ;
- **rémunération** : forfaitaire, et ce qu'elle couvre (nombre d'allers-retours de correction compris).

Garanties attendues de l'illustrateur :

- œuvres **originales**, sans reprise d'éléments protégés de tiers ;
- **outils génératifs** (IA) : à déclarer s'ils ont servi, et à exclure pour les fichiers finaux sauf accord écrit ;
- fichiers sources livrés et utilisables sans logiciel ni police sous licence restrictive.

Crédit : l'illustrateur est cité dans l'écran « À propos » de l'application et dans le README du dépôt (droit moral), sauf souhait contraire.

Le dépôt de code est public sur GitHub : les fichiers livrés y seront visibles. Si l'illustrateur souhaite une licence restrictive sur les fichiers eux-mêmes (pas de réutilisation par des tiers), la mentionner dans le contrat ; elle sera reportée dans le dépôt.

Ce paragraphe donne les attentes, il ne remplace pas un contrat relu.

## 10. Livrables attendus

### 10.1 Lots

1. **Lot pilote** (Doc 07, section 11) : une montagne, un alpiniste, trois états : `plane-1-day`, `plane-2-day`, `climber-rest`, `climber-walk`, `climber-tent`. Il sert au test « Est-ce que ça te donne envie de cocher ? » auprès de cinq personnes, avant de lancer le reste.
2. **Lot 1** : le reste du manifeste (31 fichiers au total).
3. **Lot 2** : les images clés (section 5.2).

### 10.2 Contenu de chaque livraison

Une archive `.zip` organisée ainsi :

```
ascent-assets-<lot>-<AAAA-MM-JJ>/
├── svg/            fichiers du manifeste, nommés exactement comme en section 4
├── images-cles/    images clés <id>-frame-<n>.svg (lot 2)
├── sources/        fichier Figma (lien partagé ou .fig), calques nommés comme les fichiers
├── planche.pdf     planche de contrôle (voir ci-dessous)
└── LISEZMOI.txt    liste des fichiers, poids de chacun, points d'attention
```

La **planche de contrôle** montre :

- tous les assets à leur taille d'affichage (section 4) et agrandis 4 fois ;
- l'alpiniste et les objets posés sur les quatre ambiances (matin, jour, soir, nuit) ;
- les quatre plans superposés dans chaque lumière ;
- les six états de l'alpiniste côte à côte en silhouette noire.

### 10.3 Vérifications avant envoi

- [ ] Noms de fichiers identiques à la section 4, en minuscules et tirets.
- [ ] viewBox aux bonnes proportions, ancrage respecté (pieds ou pied du mât sur le bord du cadre).
- [ ] Aucun texte, filtre, image intégrée, lien externe ni animation dans les fichiers.
- [ ] Chaque fichier sous son objectif de poids, total sous 150 Ko.
- [ ] Accent `#E8573C` uniquement sur l'alpiniste, la flamme et les drapeaux.
- [ ] Rien de triste ni de culpabilisant, en particulier `climber-tent` et `calendar-missed`.

Côté intégration, il suffit ensuite de déposer `svg/` dans `src/themes/mountain/assets/svg/` et de lancer `npm run assets:optimize` (procédure : `docs/pipeline-assets.md`, section 4).

## 11. Points ouverts

À confirmer :

- **Convention des images clés** `<id>-frame-<n>.svg`, livrées hors du dossier `svg/` : elle n'existe pas encore dans le pipeline. Les intégrer demandera d'ajouter ces identifiants au manifeste et une technique d'affichage image par image (alterner l'opacité des images, ce qui reste dans la règle « `transform` et `opacity` seulement »).
- **Vitesses de parallaxe des plans 3 et 4** (proposition 0,75 et 1,25) et leurs hauteurs maximales : à valider quand ils seront affichés.
- **Tailles d'affichage** indiquées en section 4 : estimées d'après la scène actuelle (cartes d'environ 340 px de large), à vérifier sur l'écran pilote.
- **Répartition du budget par groupe** : proposée ici, seuls les 12 Ko par fichier et les 150 Ko au total sont contrôlés.
