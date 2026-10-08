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

## Itération 3 : calendrier de réalisations (octobre 2026)

### D25. Jour fait en retard sans série à sauver : « Noter comme fait », hors série

- **Contexte :** depuis D10, un jour fait en retard alors qu'il n'y a aucune série à sauver ne pouvait être enregistré nulle part. Le calendrier rend ces trous visibles.
- **Décision (option B, choisie par Victor) :**
  - Depuis le calendrier, un jour **passé et prévu**, non validé, peut être noté « fait après coup ». Aucune limite dans le temps (de la création de l'habitude jusqu'à hier). C'est réversible (« Retirer »).
  - **Séries :** aucun effet. Le jour ne compte ni dans la série actuelle, ni dans la meilleure série, ni dans les paliers, ni dans la position du personnage. Il coupe une chaîne de série comme un jour non validé.
  - **Quota de rattrapage :** non consommé. Un jour noté après coup n'ouvre pas non plus de rattrapage pour le jour suivant (sinon, noter mardi rendrait mercredi rattrapable et ressusciterait une série cassée).
  - **Priorité au rattrapage :** si le jour peut être rattrapé au sens de D2 et D10, le calendrier propose « Rattraper ce jour » (avec son quota) et la commande refuse de le noter après coup. Quand la limite de la semaine est atteinte, « Noter comme fait » reste possible.
  - **Carte de chaleur :** le jour compte comme fait (c'est un vrai accomplissement), et il est listé à part dans le détail du jour.
  - **Modèle :** nouvelle valeur `CompletionKind = 'late'`. Simple ajout : les données existantes restent valides, sans nouvelle version du schéma ni migration.
- **Alternatives écartées :**
  - **A. Statu quo** (le calendrier montre le trou, sans action) : l'historique restait faux par omission, à l'opposé de l'objectif de fierté du calendrier.
  - **C. Rattrapage élargi** (tout jour des 7 derniers jours, compté dans la série, avec le quota) : remettait en cause D2 et D10, rendait les séries « reconstructibles » après coup et consommait le quota pour remplir l'historique.
- **Raison :** un historique fidèle, sans faille dans les séries ; la règle « le rattrapage sert à sauver une série » (D10) reste vraie et simple.
- **Modifications du moteur (annoncées avant d'être faites) :**
  - `model.ts` : valeur `'late'` ;
  - `habits/schedule.ts` : `countsForStreak`, et `validatedDates` ignore les jours `late` (donc `computeStreak` aussi) ;
  - `habits/recovery.ts` : le jour précédant un jour manqué doit compter dans la série pour ouvrir un rattrapage ;
  - `commands/habits.ts` : commandes `logLateDay` et `removeLateDay` ;
  - hors moteur : `storage/validation.ts` accepte `'late'`, `themes/progress.ts` ne compte pas ces jours pour la pose du personnage.
- **À vérifier en bêta :** un jour visiblement « fait » qui ne prolonge pas la série surprend-il ?

### D26. États d'un jour pour une habitude

- **Décision :** `getHabitDayState` renvoie, par ordre de priorité : à venir, avant la création, validé / rattrapé / fait après coup, validé hors programme, en pause, non prévu, à faire (aujourd'hui), non validé.
  - Une validation tombée sur un jour qui n'est plus prévu (après un changement de fréquence, D5) s'affiche « validé, jour non prévu » : elle reste visible, mais hors chaîne et hors carte de chaleur, comme pour la série.
  - Aujourd'hui non validé est « à faire », jamais « non validé ».
  - Aucun libellé négatif : « non validé », jamais « manqué » ni « raté ». Un test d'interface vérifie l'absence de ces mots.
- **Alternative écartée :** masquer les validations hors programme. Elles correspondent à un effort réel.
- **Raison :** cohérence avec le calcul de la série, sans rien cacher de ce qui a été fait.

### D27. Carte de chaleur : part des habitudes prévues, par tiers

- **Décision :**
  - L'intensité dépend de la **part** des habitudes prévues ce jour-là qui sont validées (normalement, par rattrapage ou après coup), et non de leur nombre.
  - Niveaux : 0 = aucune ; 1 = moins d'un tiers ; 2 = moins de deux tiers ; 3 = au moins deux tiers sans être toutes ; 4 = toutes. Un jour sans habitude prévue n'a pas de niveau (case en pointillés), distinct du niveau 0.
  - Chaque case affiche aussi la fraction (« 2/3 ») : l'information ne repose pas sur la couleur.
- **Alternatives écartées :**
  - Le nombre d'habitudes validées (Doc 07 §7) : un jour parfait avec deux habitudes paraîtrait moins intense qu'un jour partiel avec cinq.
  - Des quarts : avec deux ou trois habitudes, les niveaux 1 et 3 n'apparaissaient presque jamais.
- **Raison :** un mois « rempli » se lit d'un coup d'œil, quel que soit le nombre d'habitudes.

### D28. Séries mises en évidence

- **Décision :** les chaînes de séries suivent exactement les règles de `computeStreak` (un jour non prévu ou en pause ne coupe pas, aujourd'hui en attente non plus, un jour noté après coup si). Elles sont calculées sur tout l'historique : une série commencée le mois précédent reste continue. Les jours non prévus à l'intérieur d'une chaîne sont des « ponts ».
- **Alternative écartée :** calculer les chaînes mois par mois, ce qui coupait les séries au 1er du mois.
- **Raison :** la plus longue chaîne affichée est égale à la meilleure série (testé).

### D29. Contrat de thème étendu, accent dans la carte de chaleur

- **Décision :**
  - Chaque thème déclare les jetons du calendrier : 5 niveaux de chaleur et leurs couleurs de texte, la couleur des symboles et celle de la bande de série. Contrastes AA vérifiés par test, pour chaque thème, en clair et en sombre.
  - Un thème peut fournir un décor de case (`CalendarDayMark`, décoratif, `aria-hidden`) à partir de données neutres (état, position dans la chaîne, pont). Sans lui, l'interface dessine des symboles simples (thème Sobre). L'interface garde les boutons, les textes et l'ARIA (D20).
  - Montagne : tampon à petit sommet (validé), pont de corde (rattrapé), crayon dans un tampon en pointillés (fait après coup), tente au repos (non validé), lune (pause), crêtes sous les séries ; carte de chaleur du blanc neige à l'accent rouge orangé.
  - **Élargissement de D24 :** l'accent est utilisé pour le niveau « toutes validées » de la carte de chaleur, comme le prévoit le Doc 07 §7. Le texte posé dessus est presque noir (contraste d'au moins 4,5:1).
- **Alternatives écartées :** confier toute la grille au thème (accessibilité à refaire dans chaque thème) ; un symbole de pied pour « validé » (il ressemblait à un point d'exclamation).
- **Raison :** même accessibilité dans tous les thèmes, et un rendu « carnet de randonnée » pour la montagne.

### D30. Navigation et accessibilité de la grille

- **Décision :**
  - Grille ARIA à une seule case dans l'ordre de tabulation : flèches (y compris d'un mois à l'autre), Début / Fin (semaine), Page précédente / Page suivante (mois), Entrée ou Espace pour afficher le détail.
  - Libellé complet par case, par exemple « 2 octobre : Lire validée, Méditer non validée, 1 tâche terminée » ou « 1er octobre : validé, série de 3 validations ».
  - Navigation bornée : du premier mois qui a une donnée (création d'une habitude ou tâche terminée) au mois en cours.
  - Le détail s'affiche sous la grille (pas de fenêtre), et le jour sélectionné par défaut est aujourd'hui.
  - Cases d'au moins 44 × 48 px en 360 px de large (marges latérales réduites à 12 px sur ce seul écran) ; un mois de 5 semaines tient en entier en 360 × 640.
  - Les tâches terminées sont rattachées au jour local de l'appareil où elles ont été cochées.
- **Alternative écartée :** une fenêtre de détail, qui masquait la grille et demandait un geste de plus pour passer d'un jour à l'autre.
- **Raison :** consultation rapide au pouce comme au clavier.
- **Reportés :** animation au remplissage du mois, décor de thème sur la carte de chaleur, annulation d'un rattrapage depuis le calendrier (elle reste sur « Aujourd'hui »), partage d'un mois en image.

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

---

## Piste 5 : socle visuel du thème montagne (octobre 2026)

### P5-D1. Typographie Nunito auto-hébergée

- **Décision :** Nunito en deux graisses (400 et 700), fichiers woff2 du sous-ensemble latin (français compris) copiés dans `src/themes/mountain/assets/fonts/` (31,8 Ko au total, licence SIL OFL jointe). `font-display: swap`, repli sur `ui-rounded` (police arrondie d'Apple) puis la police système. La police n'est active qu'avec le thème montagne, via la variable `--font-body` que l'interface lit avec un repli système. Le service worker met désormais les `.woff2` en cache.
- **Alternatives écartées :** Google Fonts (requête vers un serveur tiers, pas de hors-ligne garanti) ; le paquet `@fontsource/nunito` en dépendance (inutile pour deux fichiers) ; police variable (plus lourde pour deux graisses) ; 400 et 600 (le gras 700 marque mieux les titres ; les règles en 600 utilisent le fichier 700, sans gras synthétique).
- **Raison :** aucune requête externe, hors-ligne, poids maîtrisé.

### P5-D2. Tranches horaires fixes

- **Décision :** matin 6 h – 10 h, jour 10 h – 18 h, soir 18 h – 21 h, nuit 21 h – 6 h, à l'heure locale de l'appareil (`DAY_PERIOD_STARTS`, `src/themes/ambiance.ts`). Le moment est recalculé au prochain changement prévu (un seul minuteur) et au retour sur l'application. Le changement de palette est une transition de 2,4 s, seulement si les animations sont permises.
- **Alternatives écartées :** heures de lever et de coucher du soleil (demande la position, donc une donnée de localisation) ; dégradé continu minute par minute (plus coûteux, peu perceptible) ; interrogation de l'heure chaque minute.
- **Raison :** simple, prévisible, sans donnée personnelle.
- **À vérifier :** le soir à 18 h paraît tôt en été et tard en hiver ; à ajuster si les retours le signalent.

### P5-D3. Ambiance et mode sombre du téléphone : une règle simple

- **Décision :** **le mode sombre du téléphone règle l'interface (cartes, textes, fonds) ; le réglage « Ambiance » règle seulement le décor (ciel, montagnes, étoiles).** Les deux sont indépendants. Le réglage propose : Automatique (selon l'heure, par défaut), Toujours jour, Toujours nuit. Il n'apparaît que pour un thème qui le déclare (`followsAmbiance`).
- **Conséquence :** le provisoire de D24 (« mode sombre = nuit ») est remplacé : un téléphone en sombre à midi montre des cartes sombres avec un ciel de jour ; un téléphone en clair à 23 h montre des cartes claires avec un ciel étoilé.
- **Alternatives écartées :**
  - Mode sombre = nuit forcée en automatique : un utilisateur toujours en sombre ne verrait jamais le cycle.
  - L'ambiance pilote aussi l'interface : on ignorerait un réglage d'accessibilité du téléphone, et chaque thème devrait fournir quatre jeux de jetons d'interface.
- **Raison :** une phrase suffit à l'expliquer, le réglage du téléphone est toujours respecté, et les contrastes de l'interface restent ceux déjà testés.

### P5-D4. Réglage « Ambiance » enregistré sur l'appareil, hors des données

- **Décision :** le réglage est une préférence de l'appareil (clé `ascent:ambiance` du stockage local), ni exportée ni importée. Stockage indisponible : le réglage vaut jusqu'à la fermeture.
- **Alternative écartée :** un champ dans `AppData.settings`. C'est un changement du schéma (version 2, migration, validation), que la règle de travail réserve à une validation explicite.
- **À confirmer :** faut-il l'intégrer aux données (et donc à la sauvegarde) dans une prochaine version du schéma ?

### P5-D5. Vie discrète et « une seule animation principale à la fois »

- **Décision :**
  - Sur « Aujourd'hui », le ciel des cartes est **immobile** (étoiles visibles le soir et la nuit, un nuage fixe) : l'animation principale reste le geste de l'alpiniste (D22).
  - Dans le panorama, une seule animation d'ambiance : les nuages dérivent lentement (70 s) le matin, le jour et le soir ; la nuit, ils s'immobilisent et une étoile sur quatre scintille. Les alpinistes y sont immobiles.
  - Parallaxe léger dans le panorama : en faisant défiler la rangée de montagnes, le plan lointain glisse à 25 % et le plan intermédiaire à 50 % de la vitesse.
  - Tout est coupé si le réglage Animations est désactivé ou si l'appareil demande de réduire les animations, suivi en direct (CSS et `useMotionAllowed`) ; le parallaxe ne pose alors aucun écouteur.
- **Alternatives écartées :** nuages animés dans chaque carte (plusieurs animations simultanées à l'écran, contraire au Doc 07) ; parallaxe au gyroscope (autorisation à demander sur iPhone, donnée de capteur) ; parallaxe au défilement vertical de l'écran « Aujourd'hui » (mouvement pendant la coche).
- **Raison :** respecter le Doc 07 (« l'alpiniste bouge, le reste respire à peine ») et le budget de performance.

### P5-D6. Vue panorama

- **Décision :**
  - Écran en lecture seule ouvert par un bouton « Panorama » en haut de « Aujourd'hui » (retour par « Retour », le focus revient sur le bouton). Ce n'est pas un nouvel onglet.
  - Il montre les habitudes en cours et en pause (pas les archivées), chacune sur sa montagne avec son alpiniste, ses camps, sa flamme et une plaque à son nom (raccourci à 14 caractères). La rangée défile horizontalement au doigt : environ deux montagnes visibles en 360 px.
  - Le décor est fourni par le thème (`Theme.Panorama`, décoratif, `aria-hidden`) ; l'interface donne les mêmes informations en texte sous le décor (nom, série, palier). Un thème sans panorama (Sobre) n'affiche pas le bouton.
- **Alternatives écartées :** un onglet dédié (charge la barre d'onglets pour une vue de contemplation) ; toutes les montagnes réduites pour tenir dans la largeur (illisibles au-delà de trois habitudes).
- **Raison :** c'est la vue « beau paysage » de la vision d'origine, sans rien retirer à la rapidité de l'écran « Aujourd'hui ».

### P5-D7. Pipeline d'assets

- **Décision :** manifeste TypeScript typé (`assets/manifest.ts`) : un identifiant par asset, qui est aussi le nom du fichier. Fichiers découverts à la compilation ; un fichier absent fait retomber la scène sur sa forme provisoire, tout comme un fichier qui ne se charge pas. Script d'optimisation sans dépendance (`npm run assets:optimize`, `npm run assets:check` en CI). Détails : `docs/pipeline-assets.md`.
- **Branchement :** l'alpiniste (6 états), les camps, la flamme, le drapeau du sommet, les plans 1 et 2, les obstacles de tâche (variantes de la piste 4 : rocher, nuage bas, branche, éboulis) et les fanions de jalon retombent sur leur forme provisoire. Le sommet d'objectif, les plans 3 et 4 et les icônes de calendrier sont au manifeste mais pas encore affichés (pas de forme provisoire à remplacer).
- **Alternatives écartées :** SVGO en dépendance (plus complet, mais dépendance ajoutée pour des fichiers encore inexistants ; à reconsidérer à l'arrivée des vrais visuels) ; SVG intégrés en composants React (le graphiste ne pourrait pas livrer un fichier seul) ; chargement à l'exécution avec test d'existence (requêtes réseau, scintillement).
- **Raison :** l'illustrateur livre des fichiers, le code ne change pas, et l'application reste utilisable à chaque étape.

### P5-D8. Budget de performance

- **Décision :** seuils dans `assets/budget.ts` : 12 Ko par illustration, 150 Ko pour la scène, 40 Ko de polices, 130 Ko de JavaScript compressé, 12 Ko de CSS compressé ; 60 images par seconde visées et 50 au minimum sur un téléphone moyen ; aucune animation autre que `transform` et `opacity`. Vérifiés par les tests et par `npm run check:budget` (étape de la CI après le build). Les images par seconde se vérifient à la main (procédure dans `docs/pipeline-assets.md`).
- **Raison :** des seuils chiffrés évitent que la scène s'alourdisse au fil des livraisons d'illustrations.

### P5-D9. Contrastes dans les quatre ambiances

- **Décision :** pour chaque palette (matin, jour, soir, nuit), testé : accent sur halo ≥ 3:1, tentes et sentier sur la montagne proche ≥ 3:1, texte des plaques du panorama ≥ 4,5:1 (encre `#1F2A4D` sur halo neige). L'interface ne dépend pas de l'ambiance (P5-D3) : ses contrastes restent ceux déjà testés en clair et en sombre.

---

## Piste 6 : qualité automatisée, mesure sans serveur et dossier portfolio (octobre 2026)

### P6-D1. Tests de bout en bout : Chromium, téléphone et tablette, sur le build de production

- **Décision :**
  - Playwright lance les parcours clés sur deux appareils simulés dans Chromium : un téléphone (Pixel 7) et une tablette (Galaxy Tab S4).
  - Les tests tournent sur le build de production servi par `vite preview`, avec le service worker, comme sur GitHub Pages.
  - Ils vivent dans un workflow séparé, « Qualité » (`.github/workflows/qualite.yml`), qui tourne en parallèle du workflow CI existant.
- **Alternatives écartées :**
  - Safari (WebKit) et un iPhone simulé : installation plus lourde en CI et rendu WebKit de Playwright différent du vrai Safari iOS. Le test sur un vrai iPhone reste dans le protocole de test utilisateur.
  - Tests ajoutés au job CI existant : CI plus longue, et conflits avec les autres pistes qui modifient ce fichier.
- **Raison :** couvrir les parcours qui comptent pour l'utilisateur, au plus près du site publié, sans ralentir la CI rapide.

### P6-D2. Accessibilité automatique : zéro violation axe tolérée

- **Décision :** axe-core analyse chaque écran principal (Aujourd'hui vide et rempli, Tâches, Objectifs, Réglages, fenêtres « Nouvelle habitude » et de gestion), dans chaque thème, en clair et en sombre. Règles WCAG 2.0, 2.1 et 2.2 niveaux A et AA, plus les bonnes pratiques d'axe. Une seule violation fait échouer la CI.
- **Alternative écartée :** ne bloquer que les violations « critiques » ou « graves ». Aucune violation n'existe aujourd'hui : autant garder la barre au plus haut.
- **Raison :** l'accessibilité fait partie du positionnement ; une régression doit se voir dès la pull request.
- **Limite :** axe ne voit qu'une partie des problèmes. Les vérifications manuelles sont listées en annexe du protocole de test utilisateur.

### P6-D3. Critères PWA vérifiés par Playwright, pas par Lighthouse

- **Décision :** un test Playwright vérifie le manifeste (nom, langue, affichage autonome, icônes 192 et 512 px, icône « maskable », toutes téléchargeables) et le rechargement hors ligne avec les données.
- **Alternative écartée :** la catégorie PWA de Lighthouse. Elle a été retirée dans Lighthouse 12 ; épingler Lighthouse 11 aurait figé un outil obsolète.
- **Raison :** vérifier ce que l'utilisateur vit vraiment (installer, ouvrir sans réseau, retrouver ses données).

### P6-D4. Lighthouse en CI : seuils et rapports privés

- **Décision :**
  - Lighthouse CI (`@lhci/cli`, version épinglée et lancée par `npx`, pas installée dans le projet) mesure la page d'accueil du build de production, trois fois, en émulation mobile ; la médiane est comparée aux seuils.
  - Seuils bloquants : performance ≥ 0,90, accessibilité ≥ 0,95, bonnes pratiques ≥ 0,90, décalage de mise en page (CLS) ≤ 0,1.
  - Seuils indicatifs (avertissement) : SEO ≥ 0,80, plus grand affichage (LCP) ≤ 2,5 s, temps de blocage (TBT) ≤ 200 ms.
  - Mesure au moment de la décision : 0,99 en performance et 1 dans les trois autres catégories ; les seuils laissent de la marge pour les variations des machines de CI.
  - Les rapports sont gardés 14 jours comme artefacts GitHub Actions.
- **Alternatives écartées :**
  - Téléversement vers le stockage public temporaire de Lighthouse (serveurs de Google) : contraire au choix « aucun service tiers ».
  - Seuils à 1 partout : trop sensibles au bruit de mesure.
  - Lighthouse en dépendance du projet : installation lourde pour tous les contributeurs.
- **Raison :** détecter une régression nette sans faire échouer la CI pour du bruit.

### P6-D5. Mesure d'usage : aucun outil tiers, aucun envoi automatique

- **Décision :**
  - Aucun outil d'analyse tiers (Google Analytics, Plausible, Umami, Sentry…) et aucune requête réseau de mesure.
  - Dans les Réglages, « Exporter mes statistiques anonymes » télécharge un fichier JSON. Ce sont les testeurs qui choisissent de l'envoyer, par le canal de leur choix.
  - Le message de consentement du protocole de test dit exactement ce que contient le fichier.
- **Alternatives écartées :**
  - Un outil d'analyse respectueux de la vie privée : il faudrait un service tiers, un bandeau et un traitement à déclarer, pour un faible nombre de testeurs.
  - Un point de collecte maison : il faudrait un serveur, absent du MVP.
- **Raison :** cohérent avec la promesse « les données restent sur l'appareil » et avec l'absence de pression ; le testeur garde la main sur ce qu'il partage.

### P6-D6. Contenu du fichier de statistiques : liste blanche

- **Décision :**
  - Le fichier est construit champ par champ (liste blanche) : un nouveau champ du modèle n'est jamais exporté par accident.
  - Il contient seulement :
    - la date de création et le nombre de jours prévus par semaine de chaque habitude ;
    - chaque coche : rang de l'habitude, date, type (normale ou récupération) ;
    - les dates de création et de fin des tâches ;
    - les dates de création et d'atteinte des objectifs, avec leur nombre de jalons et de jalons terminés ;
    - l'identifiant du thème (s'il est dans la liste des thèmes connus, sinon « autre »), la version de l'application (sinon « inconnue ») et la date de l'export.
  - Jamais : aucun nom (habitude, tâche, objectif, jalon), aucun identifiant interne, aucune heure, aucune échéance, aucun réglage.
  - Un test (`src/storage/anonymousStats.test.ts`) parcourt tout le fichier produit à partir de noms piégés et vérifie que chaque texte est une date, un type de coche, le thème ou la version.
- **Alternative écartée :** exporter la sauvegarde complète en effaçant les noms. Tout nouveau champ texte ajouté plus tard aurait fui.
- **Raison :** prouver par un test, et pas seulement promettre, qu'aucun texte libre ne sort.

### P6-D7. Un fichier par testeur, sans identifiant

- **Décision :** le fichier ne contient aucun identifiant d'installation. Le script d'analyse considère chaque fichier comme un testeur ; si un testeur envoie plusieurs fichiers, on garde le plus récent.
- **Alternative écartée :** un identifiant aléatoire par installation, qui permettrait de dédoublonner mais servirait aussi à suivre une personne.
- **Raison :** moins de données, moins de risques ; le dédoublonnage manuel suffit pour un petit groupe de testeurs.

### P6-D8. Définition des indicateurs

- **Décision :** (calculs dans `src/storage/anonymousStats.ts`, script `scripts/analyse-stats.ts`)
  - **Premier jour** : première date présente dans le fichier (création ou coche).
  - **Jour actif** : jour avec au moins une création, une coche, une tâche terminée ou un objectif atteint.
  - **Indicateur principal, coches par testeur et par semaine** : coches d'habitudes ÷ semaines observées (du premier jour à l'export, au moins une semaine), puis moyenne et médiane entre testeurs.
  - **Rétention à J7 (J30)** : parmi les testeurs dont l'export date d'au moins 7 (30) jours après leur premier jour, part de ceux qui ont eu au moins un jour actif à partir du 7e (30e) jour.
  - **Habitude créée le premier jour** : part des testeurs dont une habitude a été créée le premier jour.
  - **Récupération** : part des testeurs qui l'ont utilisée au moins une fois, et part des coches faites par récupération.
- **Alternatives écartées :** rétention « bornée » (actif exactement le 7e jour, ou dans la semaine 2) : trop instable avec une dizaine de testeurs.
- **Limites connues :** une coche de récupération est datée du jour rattrapé, pas du jour du geste ; les jalons cochés et les coches annulées ne laissent pas de date. Les jours actifs sont donc légèrement sous-estimés.
- **Raison :** des définitions simples, calculables sans serveur, qu'on pourra comparer d'une bêta à l'autre.

### P6-D9. Script d'analyse sans dépendance

- **Décision :** les calculs sont des fonctions pures testées par Vitest ; le script `scripts/analyse-stats.ts` ne fait que lire le dossier et afficher le tableau Markdown. Il tourne avec Node 22 seul (exécution native de TypeScript), sans `tsx` ni `ts-node`.
- **Raison :** aucune dépendance de plus, et le calcul des indicateurs est couvert par les tests.

## Piste 5c : illustrations du thème montagne

### P5c-D1. Illustrations dessinées dans le dépôt, à défaut de visuels fournis

- **Décision :** aucun visuel n'ayant été produit, les 31 illustrations du manifeste sont dessinées en SVG à la main (formes arrondies, aplats, palette du Doc 07), puis passées par `npm run assets:optimize`. Les plans de montagnes reprennent la silhouette et la hauteur des chaînes provisoires (sommets entre y = 54 et 94 dans le repère 1280 × 120) pour ne pas cacher la montagne de l'habitude.
- **Alternatives écartées :** attendre une livraison (rien de prévu) ; générer des images bitmap (refusées par le pipeline).
- **Raison :** l'application gagne un vrai habillage sans toucher à la logique ; chaque fichier peut être remplacé plus tard par un visuel d'illustrateur, au même nom.

### P5c-D2. Obstacles et icônes de calendrier en clair et en sombre dans le fichier

- **Décision :** les obstacles de tâche portent leurs couleurs claires et sombres dans un `<style>` interne avec `@media (prefers-color-scheme: dark)`, mêmes valeurs que `tasks.css`. Les plans existent en trois lumières (jour, soir, nuit) comme prévu ; l'alpiniste, la flamme, le camp, les fanions et les drapeaux sont posés sur leur halo et gardent les mêmes couleurs partout.
- **Raison :** une image SVG ne reçoit pas les variables CSS de la page.

### P5c-D3. L'illustration reçoit la classe de la forme provisoire

- **Décision :** `SceneAsset` accepte une `className` posée sur l'image ; l'obstacle de tâche lui passe `task-obstacle__shape`, ce qui garde l'animation de disparition (roulé, envol, balancement, glissement) avec l'illustration.
- **Raison :** sans elle, un obstacle illustré ne jouait pas son animation de disparition à la coche.
