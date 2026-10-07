# Journal de décisions

Chaque entrée indique la décision, les alternatives écartées, la raison et, si besoin, ce qu'il faudra vérifier.

Les décisions déjà actées dans les docs 06 et 07 restent valables : stockage sur l'appareil au MVP, thème pilote montagne, récupération d'un jour manqué le lendemain, et règle « le personnage ne recule jamais quand on ajoute un jalon ».

---

## Itération 1 : fondations (octobre 2026)

### D1. Unité de la série et mesure des paliers

- **Décision :**
  - La série compte les **validations** des jours prévus. Une habitude prévue le lundi, le mercredi et le vendredi, validée deux semaines de suite, a une série de 6.
  - Les paliers se mesurent en **durée calendaire** de la série : du premier au dernier jour validé, sans compter les jours de pause.
  - Valeurs des paliers : 21 jours, 2 mois (60 j), 6 mois (180 j), 1 an (365 j). Elles sont définies dans `STREAK_TIERS` (`src/engine/config.ts`).
  - L'interface affiche toujours l'unité, par exemple « Série actuelle : 6 validations ».
- **Alternatives écartées :**
  - Paliers en nombre de validations. Une habitude à 3 fois par semaine mettrait 7 semaines à atteindre « 21 jours », ce qui rend les libellés trompeurs.
  - Série comptée en jours calendaires. Un jour non prévu compterait alors comme un jour accompli.
- **Raison :** la série reflète ce que l'utilisateur a réellement fait. Les paliers, exprimés en durée, restent équitables quelle que soit la fréquence.
- **À vérifier en bêta :** compréhension de la différence entre validations et durée.

### D2. Délai de récupération pour une habitude non quotidienne

- **Décision :**
  - Le jour rattrapable est le **dernier jour prévu avant aujourd'hui**, s'il n'est pas validé.
  - Il reste rattrapable **jusqu'au prochain jour prévu inclus**. Pour une habitude quotidienne, cela correspond exactement au lendemain.
  - Un seul jour peut être rattrapé : deux jours prévus manqués d'affilée cassent la série.
  - Dans l'interface, le bouton nomme le jour concerné : « Rattraper mercredi ». Il précise la date quand le jour manqué n'est pas la veille, par exemple « Rattraper ven. 2 oct. ».
- **Alternatives écartées :**
  - Strictement le lendemain calendaire. Ce jour tombe souvent un jour où l'habitude n'est pas affichée : un vendredi manqué ne pourrait se rattraper que le samedi.
  - Plusieurs jours rattrapables : trop indulgent et plus complexe à comprendre.
- **Raison :** c'est la généralisation naturelle de « le lendemain », et la règle reste identique pour une habitude quotidienne.
- **Amendée par D10 :** le rattrapage n'est proposé que s'il existe une série à sauver.

### D3. Limite de récupération

- **Décision :**
  - Une récupération par habitude et par **semaine calendaire (du lundi au dimanche) du jour rattrapé**.
  - La valeur est réglable par la constante `RECOVERY_LIMIT_PER_WEEK` (`src/engine/config.ts`). Avec 0, la récupération est désactivée.
  - Annuler un rattrapage libère le quota.
- **Alternatives écartées :**
  - Une fenêtre glissante de 7 jours : plus difficile à expliquer.
  - La semaine du jour où l'on rattrape : un dimanche manqué et rattrapé le lundi changerait de semaine selon le moment de l'action.
- **Raison :**
  - La règle est simple à expliquer : « une par semaine, remise à zéro le lundi ».
  - Elle est déterministe : elle se calcule à partir des seules données, sans horodatage de l'action.
- **À vérifier en bêta (doc 07) :** usage de la récupération, rétention à J30.
- **Précisée par D10 :** quand il n'y a aucune série à sauver, ni le bouton ni le message « limite atteinte » ne s'affichent.

### D4. Paliers après une rupture de série

- **Décision :**
  - Le moteur fournit séparément la série en cours avec son palier, et le **plus haut palier jamais atteint**.
  - Le thème conservera le décor du plus haut palier : pas de retour en arrière visuel.
  - L'interface affiche un indicateur de la **série actuelle**, distinct de l'information « Plus haut palier atteint ». Ce palier est exposé au futur thème via `data-highest-tier`.
- **Alternatives écartées :**
  - Un décor qui recule avec la série : vécu comme une pénalité, ce qui est contraire au positionnement.
  - Masquer la série actuelle après une rupture : on perd une information utile.
- **Raison :** aucune pénalité visuelle, tout en gardant une information honnête sur la série en cours.
- **Précisée par D17 :** le décor peut redescendre, mais uniquement quand l'utilisateur corrige son historique.
- **Précisée par D18 et D20 :** l'alpiniste peut revenir au dernier camp atteint (jamais au pied), et le palier n'est plus exposé par `data-highest-tier` mais par les données neutres transmises au thème.

### D5. Changement de fréquence d'une habitude

- **Décision :**
  - La nouvelle fréquence s'applique à **tout l'historique**.
  - Avant d'enregistrer, un **écran de confirmation** prévient que la série affichée peut changer. Il montre la série actuelle avant et après le changement (`previewFrequencyChange`).
- **Alternatives écartées :**
  - Un historique daté des fréquences, avec une migration du schéma : reporté, car plus complexe.
  - Un changement sans avertissement : manque de transparence.
- **Raison :** simplicité du MVP, et l'utilisateur sait exactement ce qui va changer avant de confirmer.

### D6. Atteinte d'un objectif

- **Décision :**
  - L'objectif est atteint par une **action explicite** : « Marquer comme atteint ».
  - Cette action est mise en avant quand tous les jalons sont terminés, mais reste possible à tout moment.
  - Elle est réversible avec « Remettre en cours ».
  - La progression affichée est arrondie à l'inférieur : 100 % n'apparaît que lorsque tout est terminé.
- **Alternative écartée :** un passage automatique à 100 %. Il est incompatible avec l'ajout de jalons à tout moment et imposerait une célébration que l'utilisateur n'a pas choisie.
- **Raison :** c'est l'utilisateur qui décide qu'il est arrivé.

### D7. Habitudes et tâches liées à un objectif (réduction de périmètre)

- **Décision :**
  - Le lien entre une habitude ou une tâche et un objectif est enregistré et affiché.
  - Il **n'a pas d'effet sur la progression**, qui reste égale aux jalons terminés divisés par le nombre total de jalons.
  - **L'effet des habitudes liées sur la progression d'un objectif (US-13) est reporté à une itération ultérieure.**
- **Alternative écartée :** pondérer la progression par la régularité des habitudes liées dès maintenant. Les règles de calcul ne sont pas encore définies, et la jauge risquerait de baisser.
- **Raison :** le périmètre de cette itération est limité aux fondations. La règle de contribution des habitudes est à concevoir à part.

### D8. Import d'une sauvegarde

- **Décision :**
  - L'import **remplace toutes les données** après confirmation.
  - Avant le remplacement, un **export de sécurité** des données actuelles est proposé automatiquement : une case est cochée par défaut, et elle n'apparaît que s'il existe déjà des données.
  - Un fichier invalide ne modifie rien, et les anomalies sont détaillées.
- **Alternatives écartées :**
  - La fusion : conflits d'identifiants et validations en double.
  - Le remplacement sans filet de sécurité.
- **Raison :** un comportement simple et prévisible, avec un filet en cas d'erreur de fichier.

### D9 à D17 : arbitrages de la PR #1 (octobre 2026)

Les huit points laissés ouverts dans la PR #1 ont été tranchés avec les recommandations proposées ; D17 consigne en plus une dette assumée sur le décor.

#### D9. Valeurs des paliers

- **Décision :** 2 mois = 60 jours et 6 mois = 180 jours (chiffres ronds), dans `STREAK_TIERS`.
- **Alternative écartée :** 61 et 182 jours (durées calendaires moyennes).
- **Raison :** plus simple à expliquer ; la constante reste facile à modifier.

#### D10. Rattrapage seulement s'il y a une série à sauver

- **Décision :**
  - Le rattrapage n'est proposé que si le jour prévu **qui précède** le jour manqué est validé, normalement ou par un rattrapage.
  - Sinon (deux jours manqués d'affilée, ou jour manqué qui est le premier jour prévu de l'habitude), aucun bouton n'apparaît, et le message « limite atteinte » non plus.
  - Ordre des vérifications dans `getRecoveryState` : habitude inactive, jour manqué déjà validé, série à sauver, limite hebdomadaire.
- **Alternative écartée :** proposer le rattrapage dès qu'un jour est manqué. Il consommait le quota de la semaine sans rien préserver.
- **Raison :** le rattrapage sert à sauver une série, pas à remplir l'historique.
- **Compromis assumé, à rouvrir à l'itération 3 (calendrier de réalisations) :** un jour fait en retard alors qu'il n'y a aucune série à sauver ne peut pas être enregistré. Le calendrier devra peut-être permettre de saisir un jour passé sans effet sur la série.
- **Modification du moteur :** `src/engine/habits/recovery.ts`, avec tests.

#### D11. Archivage traité comme une pause

- **Décision :** une habitude archivée puis restaurée retrouve sa série (voir aussi le tableau des décisions techniques).
- **Alternative écartée :** repartir de zéro à la restauration.
- **Raison :** aucune pénalité, et comportement cohérent avec la pause.

#### D12. Pause le jour même

- **Décision :** si l'habitude est déjà cochée aujourd'hui, la pause commence demain, pour que la coche du jour compte.
- **Alternative écartée :** pause immédiate, qui ignorerait la coche du jour.
- **Raison :** ne pas faire disparaître une action déjà faite.

#### D13. Tâches échues sur l'écran « Aujourd'hui »

- **Décision :** les tâches dont l'échéance est aujourd'hui ou passée s'affichent aussi sur « Aujourd'hui », sans mention « en retard ».
- **Alternative écartée :** un libellé ou une couleur de retard.
- **Raison :** vue du jour complète (US-15) sans culpabilisation.

#### D14. Messages de confirmation

- **Décision :**
  - Un message visible reste pour les créations, les rattrapages, l'import, les suppressions, les actions faites depuis une fenêtre (modification, pause, archivage…) et « Objectif atteint ».
  - Les coches n'affichent plus de message visible. Quand la coche fait changer l'élément de liste (tâche), le changement est annoncé aux seuls lecteurs d'écran et le focus passe à l'élément voisin.
- **Alternative écartée :** un message après chaque action, jugé trop bavard.
- **Raison :** sobriété visuelle, sans perdre le retour pour les lecteurs d'écran.

#### D15. Suppression d'une tâche avec « Annuler »

- **Décision :**
  - Toute tâche, à faire ou terminée, peut être supprimée.
  - La suppression est immédiate et enregistrée. Le message « Tâche supprimée. » propose « Annuler » pendant 8 secondes ; le délai se met en pause au survol ou au focus clavier, et le focus va au bouton « Annuler ».
  - « Annuler » remet la tâche à sa place grâce à la commande pure `restoreTask`.
  - Les annonces destinées aux lecteurs d'écran (coches) ne remplacent pas ce message ; un autre message visible, en revanche, le remplace et la suppression reste acquise.
- **Alternatives écartées :**
  - Une confirmation avant chaque suppression : plus lente pour une action fréquente.
  - Une suppression différée côté interface : perdue si l'application est fermée pendant le délai, et à masquer dans toutes les listes.
- **Raison :** rapidité d'usage et droit à l'erreur.
- **Modification du moteur :** commande `restoreTask` dans `src/engine/commands/tasks.ts`, avec tests.

#### D16. Priorité de l'itération 2

- **Décision :** l'itération 2 est consacrée au thème montagne (visuels provisoires). L'effet des habitudes liées sur la progression d'un objectif (US-13, voir D7) reste reporté.
- **Alternative écartée :** concevoir d'abord la règle de contribution des habitudes (US-13).
- **Raison :** l'univers visuel est le principal élément différenciant du produit ; US-13 demande d'abord de concevoir une règle de calcul.

#### D17. Le décor peut redescendre uniquement quand l'historique est corrigé

- **Décision :**
  - Le plus haut palier (et donc le décor) est recalculé à partir des validations ; il n'est pas mémorisé.
  - Il ne baisse jamais à cause d'un jour manqué. Il peut baisser seulement quand l'utilisateur corrige lui-même son historique : retirer la coche qui avait débloqué le palier, annuler un rattrapage, changer la fréquence (l'écran de confirmation l'annoncera) ou importer une sauvegarde.
- **Alternative écartée :** mémoriser le plus haut palier atteint dans chaque habitude. Cela demande un nouveau champ, une version 2 du schéma, une migration et l'adaptation de la validation et des sauvegardes.
- **Raison :** **dette assumée**, plutôt qu'une migration du schéma au MVP. Ces corrections sont volontaires et rares ; elles ne sont pas vécues comme une pénalité.
- **À rouvrir si :** les retours bêta montrent que ces baisses surprennent ou déçoivent.

---

## Itération 2 : thème montagne, visuels provisoires (octobre 2026)

### D18. Position de l'alpiniste

- **Décision :**
  - Le sentier va du pied au sommet en passant par les camps 21 jours, 60 jours et 180 jours ; le sommet correspond à 365 jours. Les camps sont régulièrement espacés et la position est interpolée en jours entre deux camps.
  - Le **décor** correspond au plus haut palier jamais atteint.
  - L'alpiniste se place selon la **progression de la série actuelle vers le prochain palier**.
  - **Si la série se brise, il revient au dernier camp atteint**, jamais au pied. Avec la nouvelle série, il **repart de ce camp vers le camp suivant, au prorata de la nouvelle série** : position = camp + (camp suivant − camp) × série / camp suivant. Il atteint le camp suivant exactement quand la série atteint le palier correspondant, sans saut ensuite.
  - Le texte « Prochain palier » vise le même camp que l'image, dans les deux thèmes : après une rupture, un palier déjà acquis n'est plus présenté comme « prochain ».
  - **Au-delà d'un an :** 365 jours = sommet (avec célébration) ; 366 jours = pied d'une nouvelle montagne plus haute, dont le sommet compte aussi comme camp (730, 1 095 jours…) et s'affiche comme palier (« 2 ans »). La hauteur visuelle est plafonnée.
  - Calcul : fonctions pures `computeHabitProgress` et `deriveHabitProgress` (`src/themes/progress.ts`), sans modification du moteur, testées (série à zéro, entre deux paliers, palier atteint, saut de durée, rupture après palier, reprise, 365/366/730 jours, propriétés de non-recul).
- **Alternatives écartées :**
  - **Retour au pied de la montagne** après une rupture : vécu comme une pénalité, contraire au positionnement et à D4.
  - **Immobilité au camp** jusqu'à ce que la nouvelle série dépasse ce camp (règle « max(série, camp) ») : après une rupture au-delà de 6 mois, l'alpiniste ne bougeait plus pendant des mois, même en cochant chaque jour (contraire à US-04).
- **Raison :** l'alpiniste bouge à chaque coche, ne recule jamais sous ce qui a été acquis, et l'image reste cohérente avec les paliers du moteur.
- **À vérifier en bêta :** les utilisateurs comprennent-ils l'alpiniste sans explication ?

### D19. Jour manqué encore rattrapable : bivouac à la même altitude

- **Décision :**
  - Tant que le jour manqué peut être rattrapé, l'alpiniste garde l'altitude qu'il aurait si le rattrapage était fait, en pose « bivouac » (corde provisoire).
  - Seule la position est « comme si » : elle reste juste sous la prochaine étape réellement non atteinte, sur la montagne réellement affichée. Le décor, les camps, le cycle, la flamme et les textes restent réels : le bivouac ne fait jamais apparaître puis disparaître un palier.
- **Alternative écartée :** redescendre au camp dès le lendemain d'un oubli, puis remonter d'un coup après le rattrapage.
- **Raison :** pas de chute visuelle au moment le plus sensible ; Doc 07 prévoit un état « récupération ».

### D20. Contrat de thème : l'interface garde le bouton, le thème dessine

- **Décision :**
  - L'interface garde tout ce qui est interactif et textuel : bouton de coche (un toucher, clavier, `aria-pressed`, libellé), série, paliers, rattrapage.
  - Un thème peut fournir une illustration **décorative** (`HabitScene`, `aria-hidden`), affichée dans le bouton de coche, à partir de données neutres (`HabitProgress`, geste en cours, animations permises).
  - La logique de progression, neutre, vit dans `src/themes/progress.ts` et resservira aux futurs thèmes.
  - Les thèmes sont découverts automatiquement (`src/themes/<id>/theme.ts`) ; c'est le thème qui se déclare par défaut (`isDefault`).
  - Isolation vérifiée :
    - règles ESLint : un thème n'importe ni l'interface, ni le stockage, ni le registre (sous toutes ses formes de chemin), et aucun import dynamique ; l'interface n'importe que `src/themes/index.ts` ;
    - test garde-fou : aucun vocabulaire montagne hors de `src/themes/mountain/`, CSS et tests compris, y compris dans les identifiants composés (`MountainScene`, `SUMMIT_DAYS`). Seule exception : le test de pureté du moteur, conservé, qui contient la liste des mots interdits.
- **Alternative écartée :** confier au thème le bouton et ses textes. Chaque thème aurait dû réimplémenter l'accessibilité, et les tests seraient devenus dépendants du thème.
- **Raison :** accessibilité et rapidité de coche identiques quel que soit le thème ; un nouveau thème n'a que du décor à fournir.

### D21. Thème par défaut

- **Décision :** les nouvelles installations démarrent avec le thème montagne. Les données existantes gardent leur thème (« Sobre ») ; le changement se fait dans Réglages → Thème.
- **Alternative écartée :** basculer automatiquement les données existantes vers la montagne (migration).
- **Raison :** respecter le réglage enregistré, sans migration du schéma.

### D22. Animations

- **Décision :**
  - Seuls les gestes de l'utilisateur sont animés : un pas court à la coche (montée), une petite descente à l'annulation, un petit saut à la célébration. Rien au chargement, à minuit ni au changement d'onglet.
  - Une respiration discrète, seulement au repos (une seule animation à la fois, boucles décalées d'une habitude à l'autre).
  - Animations en « opt-in » : coupées si le réglage de l'application est désactivé **ou** si l'appareil demande de réduire les animations, réglage suivi en direct. Aucune animation SMIL, aucun filtre SVG.
- **Alternative écartée :** animer le déplacement réel de l'alpiniste. Après deux mois, une coche le déplace de moins d'un pixel : l'animation aurait été invisible.
- **Raison :** un retour visible à chaque coche, sobre et respectueux des préférences.

### D23. Célébration

- **Décision :**
  - L'alpiniste célèbre, et un message positif est annoncé, quand la série du jour (coche faite) atteint une étape **jamais atteinte jusque-là** (palier ou sommet).
  - Repasser un palier déjà acquis ne déclenche pas de célébration.
  - Un palier atteint grâce à un rattrapage est célébré comme les autres, dès que la coche du jour est faite, quel que soit l'ordre des deux gestes (cocher puis rattraper, ou l'inverse).
- **Alternatives écartées :**
  - Célébrer chaque passage d'un palier, y compris après une rupture.
  - Ne jamais célébrer un palier atteint grâce à un rattrapage : la célébration dépendait alors de l'ordre des gestes.
- **Raison :** la célébration marque un vrai progrès ; le décor ne change d'ailleurs pas dans les autres cas.

### D24. Mise en page, contrastes et reports

- **Décision :**
  - Panorama de 76 px, nom et série sur une ligne, paliers sur une ligne (version complète lue par les lecteurs d'écran), pastille ✓ visible : au moins 3 habitudes visibles en 360 × 640 et 4 en 390 × 844.
  - Accent rouge orangé réservé à l'alpiniste, à la flamme et au drapeau du sommet, posés sur un halo couleur neige (contraste d'au moins 3:1). Les jetons d'interface du thème n'utilisent jamais l'accent.
  - **Provisoire :** mode sombre = nuit, en attendant le cycle jour/nuit selon l'heure.
  - **Reportés :** police Nunito, cycle jour/nuit, nuages et parallaxe, départ animé vers la nouvelle montagne, tâches en obstacles, objectifs en sommet lointain, calendrier de réalisations, choix du thème au démarrage (US-02), couleurs du manifeste PWA selon le thème.
- **Raison :** visuels provisoires pour tester l'univers ; l'effort ira au thème final après les retours.

---

## Décisions techniques de l'itération 1

| Décision | Raison | Alternatives écartées |
| --- | --- | --- |
| Dates métier au format local `AAAA-MM-JJ`, sans fuseau | Pas de bug à minuit ni au changement d'heure | Horodatages ISO (le jour dépendrait du fuseau) |
| Pauses enregistrées comme périodes (`Habit.pauses`), archivage traité comme une pause | « La pause ne casse pas la série » (US-07) et une habitude restaurée retrouve sa série | Statut seul (la reprise rendrait les jours de pause « manqués ») |
| Une coche n'est possible qu'un jour prévu ; les coches hors jours prévus sont ignorées par le calcul | Règle de série sans ambiguïté | Compter les coches hors jours prévus comme un bonus |
| Stockage localStorage (un document JSON versionné) derrière une interface asynchrone `AppRepository` | Volume faible (environ 200 Ko par an) et aucune dépendance ; IndexedDB ou un backend pourront se brancher sans toucher au reste | IndexedDB dès le MVP (plus complexe, sans bénéfice à ce volume) |
| Validation stricte des données lues et importées ; des données illisibles ne sont jamais écrasées sans accord | Données de l'utilisateur protégées | Réinitialisation silencieuse |
| Stockage persistant (`navigator.storage.persist()`) demandé au premier contenu, pas à l'ouverture | Certains navigateurs affichent une demande d'autorisation | Demande dès l'ouverture |
| Thème « Sobre » provisoire, décrit par des jetons de couleur | Valide le mécanisme de thème interchangeable avant le thème illustré | — |
| Moteur isolé par une règle ESLint et un test garde-fou (aucune référence au thème) | Règle du CLAUDE.md vérifiée automatiquement | Simple convention |
| TypeScript 6.0 plutôt que 7 | typescript-eslint ne prend pas encore en charge TypeScript 7 | — |

---

## Piste 4 : tâches en obstacles, objectifs en sommet (octobre 2026)

### P4-D1. Contrat de thème : deux emplacements optionnels

- **Décision :** `Theme` gagne `TaskIllustration` (illustration d'une tâche à faire, à partir de `taskId`, `clearing`, `motionAllowed`) et `GoalScene` (scène d'un objectif, à partir de `GoalProgress` du moteur, `achieved`, `celebrating`, `motionAllowed`). Les deux sont décoratifs (`aria-hidden`) et facultatifs : sans eux, l'interface sobre s'affiche. Ajout seulement dans `src/themes/types.ts`, rien de réorganisé.
- **Alternative écartée :** confier au thème la case à cocher ou la liste des jalons (même raison que D20 : accessibilité à réimplémenter par chaque thème).
- **Raison :** même principe que D20, l'interface garde tout ce qui est interactif et textuel.

### P4-D2. Position de l'alpiniste et hauteur du sommet d'un objectif

- **Décision :**
  - Le sentier est fixe. Le jalon terminé n° k correspond toujours au même point : `stepAt(k) = k / (k + 3)` (fraction du sentier). L'alpiniste est à `stepAt(jalons terminés)` : position **absolue**, indépendante du total.
  - Le sommet est un pas après le dernier jalon : `stepAt(total + 1)`. Ajouter un jalon le repousse plus haut et plus loin (« plus haut que prévu ») ; l'alpiniste ne bouge pas, seule la jauge baisse.
  - À 100 %, l'alpiniste est au dernier fanion, juste sous le sommet, et « Marquer comme atteint » est suggéré. Le dernier pas jusqu'au sommet, c'est cette action (cohérent avec D6). Un objectif atteint place l'alpiniste au sommet, même s'il restait des jalons.
  - `stepAt` tend vers 1 sans l'atteindre : le sommet reste toujours dans le cadre. Les premiers jalons font de grands pas, les suivants des pas plus courts (perspective).
  - Les fanions sont comptés, pas nommés : les k premiers fanions sont « plantés » quand k jalons sont terminés, quel que soit l'ordre.
  - Décocher ou supprimer un jalon **terminé** fait redescendre l'alpiniste d'un fanion : c'est une correction volontaire de l'historique, comme D17. Supprimer un jalon à faire abaisse seulement le sommet.
  - Calcul : fonction pure `goalLayout` (`src/themes/mountain/goals/geometry.ts`), testée.
- **Alternatives écartées :**
  - Position en pourcentage (`terminés / total`) : l'alpiniste recule à chaque ajout, contraire à la règle actée.
  - Mémoriser la position la plus haute atteinte : demande un nouveau champ, donc une version 2 du schéma.
  - Sommet à `stepAt(total)` : l'alpiniste serait au sommet avant que l'utilisateur ne déclare l'objectif atteint.
- **À vérifier en bêta :** le sommet qui grandit est-il compris comme « plus haut que prévu » et non comme « plus loin, donc moins avancé » ?

### P4-D3. Obstacles des tâches et dégagement

- **Décision :**
  - Quatre obstacles (rocher, nuage bas, branche, éboulis), choisis par une empreinte FNV-1a de l'identifiant de la tâche : stables d'une ouverture à l'autre, rien n'est enregistré.
  - Cocher fait passer la tâche dans « Terminées » immédiatement (données, focus et annonce inchangés) ; une **copie décorative** (`aria-hidden`, sans élément interactif) reste 0,7 s à sa place pour jouer le dégagement. Sans animation, aucune copie.
  - Une tâche en retard est dessinée exactement comme les autres.
  - Les obstacles s'affichent sur l'écran Tâches seulement, pas sur « Aujourd'hui ».
- **Alternative écartée :** retarder la coche réelle le temps de l'animation : la coche serait perdue si l'application est fermée, et le focus deviendrait imprévisible.
- **Raison :** satisfaction visuelle sans rien changer à l'accessibilité ni à la rapidité.

### P4-D4. Objectif atteint et tableau de trophées

- **Décision :**
  - « Marquer comme atteint » reste l'action explicite (D6), mise en avant à 100 %. L'objectif rejoint aussitôt le **tableau de trophées** (nouveau nom de « Objectifs atteints ») et le focus va à ce titre.
  - Une copie décorative joue la célébration 1,8 s à sa place dans « En cours » : alpiniste qui saute au sommet et drapeau qui flotte (montagne), pastille ✓ qui apparaît (thème sobre). Le message « … est atteint. Bravo ! » est annoncé comme avant.
  - Un trophée est compact : nom, date d'atteinte, scène au sommet, jalons repliés, « Remettre en cours » et « Supprimer ».
- **Alternative écartée :** une fenêtre de célébration plein écran, plus intrusive et à fermer.

### P4-D5. Jalons depuis la scène ou la liste

- **Décision :** la scène est décorative ; ajout, renommage, suppression et coche passent par la liste accessible placée juste sous la scène, dans la même carte.
- **Alternative écartée :** des fanions cliquables dans la scène : petites cibles tactiles, et les fanions sont comptés (P4-D2), pas liés à un jalon précis.
- **À confirmer :** si une interaction directe dans la scène est souhaitée (par exemple un bouton « + » sur le sentier).
