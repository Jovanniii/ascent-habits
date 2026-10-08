# Étude de cas : Ascent

> Squelette à compléter au fil des bêtas. Les passages entre crochets sont à remplir ; les décisions renvoient au [journal de décisions](journal-decisions.md).

## En bref

- **Produit :** application d'habitudes, de tâches et d'objectifs, installable sur téléphone (PWA), gamifiée par un décor de montagne.
- **Mon rôle :** product manager et porteur du projet, de la vision à la mise en ligne, avec un assistant de code IA pour l'implémentation.
- **Durée :** [dates de début et de fin]
- **Résultat clé :** [une phrase, à remplir après la bêta : par exemple « X coches par testeur et par semaine, Y % de rétention à J7 »]

## 1. Le problème

Les gens répartissent leurs tâches, leurs habitudes et leurs objectifs dans plusieurs outils (notes, agendas, applications de suivi) et finissent par abandonner, faute de vue d'ensemble et de motivation visuelle. Voir [Problème et vision](01-probleme-vision.md).

- **Constat de départ :** [ce qui m'a amené à ce sujet, observations, chiffres publics éventuels]
- **Pourquoi les applications existantes ne suffisent pas :** [séries punitives, notifications culpabilisantes, outils séparés…]

## 2. Les utilisateurs

Hypothèses de départ (personas) :

- **« Le dispersé »** : actif de 25 à 40 ans, beaucoup de choses en tête, plusieurs outils sans satisfaction.
- **« Le démarreur d'habitudes »** : veut installer une routine et décroche au bout de quelques semaines.
- **« Le duo »** : deux personnes qui veulent tenir des objectifs ensemble (reporté en v2).

Ce que les tests ont confirmé ou infirmé : [à remplir après les tests du [protocole](protocole-test-utilisateur.md)]

## 3. La vision et le positionnement

- Ouvrir, cocher, repartir : moins d'une minute par jour.
- La gamification est un décor agréable, pas un levier de rétention.
- Aucune culpabilisation : pas de pénalité, pas de message négatif, un jour manqué se rattrape.
- Données sur l'appareil, sans compte.

## 4. Décisions clés

| Décision | Ce qui a été choisi | Alternative écartée | Pourquoi | Journal |
| --- | --- | --- | --- | --- |
| Unité de la série | Validations des jours prévus, paliers en durée | Paliers en nombre de validations | Équitable quelle que soit la fréquence | D1 |
| Jour manqué | Récupération le lendemain, une par semaine | Série remise à zéro sans recours | Indulgence sans tricherie | D2, D3, D10 |
| Objectif atteint | L'utilisateur décide (« Marquer comme atteint ») | Atteint automatiquement à 100 % des jalons | Les jalons évoluent en route | D6 |
| Stockage | Sur l'appareil, export et import manuels | Comptes et serveur | Rapidité, vie privée, coût nul | D8, décisions techniques |
| Thème | Moteur séparé de l'habillage, montagne en pilote | Interface dessinée pour un seul univers | D'autres thèmes sans réécrire le moteur | D18 à D20 |
| Mesure | Statistiques anonymes envoyées volontairement | Outil d'analyse tiers | Cohérent avec la promesse « rien ne sort » | P6-D5 à P6-D8 |
| Qualité | Parcours, accessibilité et Lighthouse en CI | Tests manuels uniquement | Chaque PR protège l'expérience | P6-D1 à P6-D4 |
| [Décision suivante] | | | | |

Arbitrages de périmètre (ce que j'ai choisi de **ne pas** faire) : [réseau social, classements, notifications, mode à deux…]

## 5. Les métriques

| Métrique | Rôle | Définition | Cible |
| --- | --- | --- | --- |
| **Coches par testeur et par semaine** | Indicateur principal (usage réel) | Coches d'habitudes ÷ semaines observées, moyenne entre testeurs (P6-D8) | [à fixer] |
| Rétention à J7 | Le produit donne-t-il envie de revenir ? | Part des testeurs actifs à partir du 7e jour | [à fixer] |
| Rétention à J30 | L'habitude tient-elle ? | Part des testeurs actifs à partir du 30e jour | [à fixer] |
| Habitude créée le premier jour | Activation | Part des testeurs ayant créé une habitude dès le premier jour | [à fixer] |
| Usage de la récupération | La règle indulgente est-elle comprise et utile ? | Testeurs l'ayant utilisée, part des coches par récupération | [à fixer] |
| Première habitude créée et cochée | Critère du MVP | Temps observé en test | < 2 min |
| Éléments du jour cochés | Critère du MVP | Temps observé en test | < 1 min |
| Univers visuel | Critère du MVP | « Agréable » ou « très agréable » | > 70 % des testeurs |

Contre-métriques surveillées : [par exemple, ne pas augmenter les coches au prix de messages plus insistants]

Mesure sans serveur : voir P6-D5 (aucun outil tiers, envoi volontaire) et le script `npm run stats:analyse -- <dossier>`.

## 6. Résultats

> À remplir après chaque vague de tests.

- **Testeurs :** [nombre, profils, période]
- **Tableau des indicateurs :** [coller ici la sortie de `npm run stats:analyse`]
- **Tests utilisateurs (15 min) :** [taux de réussite par tâche, temps médians, verbatims marquants]
- **Univers visuel :** [répartition des réponses]
- **Qualité :** [score Lighthouse, nombre de violations axe, parcours couverts]

## 7. Ce que j'ai appris

- **Sur les utilisateurs :** [ce qui m'a surpris]
- **Sur le produit :** [hypothèse confirmée, hypothèse abandonnée]
- **Sur la méthode :** [travail en petites itérations, journal de décisions, sessions d'IA en parallèle…]
- **Ce que je ferais différemment :** [à remplir]

## 8. Et ensuite

- [Prochaines étapes priorisées, avec la métrique qu'elles doivent faire bouger]
