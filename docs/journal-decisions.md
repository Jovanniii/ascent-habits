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
