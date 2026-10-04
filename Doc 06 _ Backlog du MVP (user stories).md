### **Doc 06 : Backlog du MVP (user stories)**

**Principe** : le MVP livre le moteur commun (habitudes, tâches, objectifs) avec **un seul thème**. Priorités : **M** \= indispensable, **S** \= important, **C** \= souhaitable, **W** \= reporté.

#### **Epic 1 : Démarrage**

**US-01 (M)** En tant que nouvel utilisateur, je veux ouvrir l'appli et créer mon premier élément en moins d'une minute, afin de voir de la valeur immédiatement.

* Aucun compte n'est requis pour commencer (données stockées sur l'appareil).  
* Un écran d'accueil propose directement « Ajouter une habitude ».

**US-02 (S)** En tant qu'utilisateur, je veux choisir mon thème au démarrage, afin que l'univers me plaise dès le début.

* Au MVP, un seul thème disponible, mais le choix est prévu techniquement.

#### **Epic 2 : Habitudes**

**US-03 (M), Créer une habitude**

* L'habitude apparaît dans la scène avec **son propre élément visuel animé**. Dans le thème montagne, c'est un alpiniste sur sa montagne, qui bouge (marche, pause, célébration). Dans d'autres thèmes, l'élément peut être un ballon, un bateau, etc.

**US-04 (M)** En tant qu'utilisateur, je veux cocher une habitude du jour en un geste, afin de valider rapidement.

* Un seul toucher suffit.  
* Le personnage ou l'objet progresse visuellement, avec une animation courte.  
* Je peux annuler une coche faite par erreur.

**US-05 (M), Série et récupération**

* La série compte les jours consécutifs.  
* Si un jour est manqué, la série repart à zéro sans message culpabilisant, **sauf si l'utilisateur utilise la récupération**.  
* **Récupération** : le lendemain d'un jour manqué, l'utilisateur peut valider deux fois (jour manqué \+ jour en cours) et la série est préservée.  
* *À trancher (voir journal de décisions)* : limite de la récupération. Mon hypothèse par défaut : une récupération par habitude et par semaine, à ajuster après la bêta.

**US-06 (S)** En tant qu'utilisateur, je veux atteindre des paliers (21 jours, 2 mois, 6 mois, 1 an), afin de célébrer mes progrès sans que l'habitude ait de fin.

* Chaque palier déclenche un changement visuel (nouveau décor ou niveau).  
* L'habitude continue après le dernier palier.

**US-07 (S)** En tant qu'utilisateur, je veux modifier, mettre en pause ou archiver une habitude, afin de l'adapter à ma vie.

* La pause ne casse pas la série.

#### **Epic 3 : Tâches**

**US-08 (M)** En tant qu'utilisateur, je veux ajouter une tâche ponctuelle avec un nom et éventuellement une date, afin de ne rien oublier.

* La tâche apparaît dans la scène comme élément temporaire.

**US-09 (M)** En tant qu'utilisateur, je veux cocher une tâche pour la faire disparaître, afin de ressentir la satisfaction de « nettoyer » ma scène.

* Animation de disparition, puis la tâche passe dans l'historique.

**US-10 (C)** En tant qu'utilisateur, je veux un rappel pour les tâches datées, afin de ne pas les rater.

#### **Epic 4 : Objectifs**

**US-11 (M)** En tant qu'utilisateur, je veux créer un objectif avec un nom et une échéance optionnelle, afin de définir une destination.

* L'objectif apparaît comme un lieu fixe dans la scène (sommet, île...).

**US-12 (M), Jalons évolutifs**

* L'utilisateur peut **ajouter, modifier ou supprimer des jalons à tout moment**, y compris après avoir commencé l'objectif.  
* *Point de design* : ajouter un jalon fait baisser le pourcentage d'avancement. Pour ne pas décourager, le personnage ne recule jamais ; seule la jauge est recalculée, et le sommet est simplement « plus haut que prévu ». À noter comme décision.

**US-13 (S)** En tant qu'utilisateur, je veux lier une ou plusieurs habitudes à un objectif, afin que ma régularité fasse avancer mon objectif.

**US-14 (M)** En tant qu'utilisateur, je veux célébrer l'atteinte d'un objectif, afin de ressentir l'accomplissement.

* Animation de fin, objectif archivé dans un « tableau de trophées ».

#### **Epic 5 : Vue d'ensemble**

**US-15 (M)** En tant qu'utilisateur, je veux voir sur un seul écran ce que j'ai à faire aujourd'hui, afin de cocher en moins d'une minute.

**US-15 (M), Vue du jour**

* Vue d'ensemble dans la scène. La **liste simple alternative passe en priorité C** (non prioritaire).

**US-16 (C)** En tant qu'utilisateur, je veux consulter un historique simple (calendrier de réalisations), afin de voir mon parcours.

**US-16 (M, relevée), Calendrier de réalisations**

* Un calendrier visuel montre, jour après jour, ce qui a été accompli, avec un rendu satisfaisant (détails dans la fiche ci-dessous).  
* Il est consultable par habitude et en vue globale.

#### **Epic 6 : Thèmes et préférences**

**US-17 (S)** En tant qu'utilisateur, je veux désactiver les animations et les sons, afin d'utiliser l'appli de façon plus sobre.

**US-18 (W)** En tant qu'utilisateur, je veux changer de thème à tout moment, afin de varier les ambiances (v2).

#### **Epic 7 : Mode à deux (reporté)**

**US-19 (W)** En tant qu'utilisateur, je veux partager un objectif avec une autre personne, afin de le tenir ensemble (v2).

#### **Epic 8 : Notifications**

**US-20 (C)** En tant qu'utilisateur, je veux un rappel quotidien optionnel à l'heure de mon choix, afin de penser à cocher.

* Désactivé par défaut, en cohérence avec le positionnement « sans pression ».

---

#### **Définition du MVP**

Les stories **M** et **S** : US-01 à US-09, US-11 à US-15, US-17. Reporté : mode à deux, changement de thème à la volée, notifications avancées.

#### **Critères de réussite du MVP (liés au Doc 04\)**

* Un nouvel utilisateur crée une habitude et la coche en moins de 2 minutes.  
* L'ensemble des éléments du jour se coche en moins d'une minute.  
* Plus de 70 % des testeurs jugent l'univers visuel « agréable » ou « très agréable ».

#### **Points à trancher (à noter dans le journal de décisions)**

* **Stockage** : sur l'appareil au MVP, comptes et synchronisation en v2.  
* **Série manquée** : repartir à zéro est le plus simple ; une version plus indulgente (un « jour de grâce ») est une hypothèse à tester.  
* **Thème du MVP** : montagne ou ciel.

**Décisions actées** : stockage sur l'appareil au MVP, thème montagne.

*Risque à noter* : sur l'appareil, les données sont perdues si l'appli est désinstallée. Une simple fonction d'export/sauvegarde manuelle (US à ajouter, priorité S) limiterait ce risque sans comptes ni serveur. 

