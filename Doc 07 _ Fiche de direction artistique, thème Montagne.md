### **Doc 07 : Fiche de direction artistique, thème Montagne**

#### **1\. Intention**

Une montagne douce et lumineuse qui donne envie d'avancer pas à pas. Ambiance contemplative, jamais dramatique : l'alpinisme comme une promenade inspirante, pas comme une épreuve.

#### **2\. Principes (garde-fous)**

1. **Formes simples et arrondies**, aplats de couleur, pas de contours durs.  
2. **Palette limitée** : 5 à 6 couleurs de base, déclinées par moment de la journée.  
3. **Lumière douce**, avec des dégradés légers et des silhouettes.  
4. **Profondeur par plans** : 3 à 4 couches de montagnes qui se superposent (effet parallaxe léger).  
5. **Une seule animation principale à la fois** : l'alpiniste bouge, le reste respire à peine (nuages lents, léger scintillement).  
6. **Aucun élément négatif ou culpabilisant** : un jour manqué, c'est un alpiniste qui se repose à la tente, pas un échec.

#### **3\. Palette de départ (à affiner)**

| Rôle | Couleur indicative |
| ----- | ----- |
| Ciel du matin | `#FFD9B0` (pêche) |
| Ciel du soir | `#6C5B9E` (violet doux) |
| Ciel de nuit | `#1F2A4D` (bleu nuit) |
| Montagnes lointaines | `#A8B8D8` (bleu brume) |
| Montagnes proches | `#4F6D8F` (bleu ardoise) |
| Neige | `#F7F4EF` (blanc chaud) |
| Accent (alpiniste, drapeau) | `#E8573C` (rouge orangé) |

L'accent rouge orangé doit rester **réservé aux éléments qui comptent** (alpiniste, drapeau du sommet, flamme de série), ce qui guide l'œil.

#### **4\. Typographie (pistes)**

Une police arrondie et lisible : Nunito ou Quicksand (Google Fonts, gratuites). Deux graisses maximum.

#### **5\. Les éléments de la scène**

| Élément produit | Représentation montagne |
| ----- | ----- |
| **Habitude** | Un alpiniste sur sa propre montagne. Plusieurs habitudes \= plusieurs montagnes côte à côte, chacune avec son alpiniste. |
| **Série** | Une petite flamme (feu de camp) au-dessus ou à côté de l'alpiniste. |
| **Palier** | Un camp de base (tente, drapeau) à chaque étape : 21 jours, 2 mois, 6 mois, 1 an. |
| **Après le sommet** | L'alpiniste célèbre, puis une nouvelle montagne plus haute apparaît : l'habitude reste sans fin. |
| **Tâche** | Un obstacle sur le sentier (rocher, nuage bas, branche) que l'on dégage en cochant. |
| **Objectif** | Un grand sommet lointain à l'horizon, avec un drapeau, qui se rapproche avec les jalons. |
| **Jalons** | Des petits fanions plantés sur le chemin vers le sommet. |
| **Récupération** | Une petite corde ou un pont temporaire qui « répare » le chemin quand on rattrape un jour manqué. |

#### **6\. Les états visuels de l'alpiniste (à illustrer)**

1. **Au repos** (pas encore validé aujourd'hui) : debout ou assis, respire doucement.  
2. **Marche** (habitude validée) : animation courte de montée, boucle de 1 à 2 secondes.  
3. **Pause à la tente** (jour manqué, sans culpabilité).  
4. **Célébration** (palier atteint, bras levés, drapeau).  
5. **Sommet et départ vers une nouvelle montagne.**  
6. **Récupération** (il rattrape le chemin).

#### **7\. Le calendrier de réalisations**

Idée : un **carnet de randonnée** où chaque jour validé ajoute un tampon ou une petite empreinte.

* Vue par habitude : une grille de jours, chaque jour validé affiche un petit pictogramme de sommet ou d'étoile ; les séries forment des « chaînes de montagnes » visibles.  
* Vue globale : une carte de chaleur dont l'intensité va du blanc neige au rouge orangé selon le nombre d'habitudes validées dans la journée.  
* Objectif ressenti : voir d'un coup d'œil un mois rempli.

#### **8\. Cycle jour et nuit**

Le ciel suit l'heure réelle : matin pêche, jour clair, soir violet, nuit étoilée. C'est un effet peu coûteux à produire (changement de dégradé et de palette) qui donne beaucoup de vie.

#### **9\. Liste d'assets à produire (MVP)**

* 4 plans de montagnes (lointain à proche), en 3 variantes de lumière (jour, soir, nuit).  
* 1 alpiniste, 6 états (voir section 6).  
* Camp de base (tente, drapeau), flamme de série (2 niveaux d'intensité).  
* 4 obstacles de tâche \+ animation de disparition.  
* Sommet d'objectif \+ fanions de jalons \+ animation de victoire.  
* Icônes de calendrier (jour validé, jour rattrapé, jour manqué neutre).  
* Composants d'interface (case à cocher, cartes, boutons) dans le style du thème.

#### **10\. Contraintes techniques à garder en tête**

Illustrations vectorielles en couches, animations légères (boucles courtes), poids de l'appli maîtrisé. Cela préparera l'ajout futur des autres thèmes.

#### **11\. Prochaine étape**

Réaliser un **écran pilote** (une montagne, un alpiniste, trois états) dans Figma, puis le soumettre à 5 personnes avec la question « Est-ce que ça te donne envie de cocher ? ».

---

**Journal de décisions : entrées à ajouter**

| Décision | Raison | À vérifier |
| ----- | ----- | ----- |
| Récupération d'un jour manqué le lendemain | Éviter l'abandon après un oubli | Taux de rétention à J30, usage de la récupération |
| Le personnage ne recule jamais quand on ajoute un jalon | Ne pas décourager | Retours bêta |
| Stockage sur l'appareil | Simplicité du MVP | Pertes de données signalées |
| Thème pilote montagne | Préférence et lisibilité de la progression | Test visuel avec les autres thèmes |

