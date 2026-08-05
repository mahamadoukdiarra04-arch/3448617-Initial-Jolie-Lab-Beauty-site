# Plan de developpement

## Vision

Le site doit passer d'un parcours "panier puis WhatsApp" a un parcours "panier puis commande enregistree sur le site".

WhatsApp reste disponible avec la bulle flottante, mais il ne doit plus etre l'etape obligatoire pour convertir.

## Decisions fonctionnelles validees

- Paiement uniquement a la livraison.
- Frais de livraison non calcules automatiquement.
- Livraison affichee comme `A determiner`.
- Montant final communique apres validation humaine par l'admin.
- Le bouton final client devient `Passer commande`.
- Une page merci confirme que la commande est prise en compte.
- La page merci doit afficher un ticket de caisse stylise avec une animation de check.
- Les commandes doivent etre visibles dans un espace admin.
- L'admin doit pouvoir ajouter, modifier, masquer ou retirer les produits.
- L'admin doit pouvoir etre installe comme icone sur telephone.
- Les nouvelles commandes doivent declencher des notifications push admin, meme hors page ouverte.
- Pas de notification e-mail automatique.
- Le Pixel Meta doit mesurer le tunnel sans declarer un achat paye trop tot.

## Phases

| Phase | Nom | Resultat attendu | Audit requis |
| --- | --- | --- | --- |
| 01 | Tunnel commande client | Checkout simplifie, bouton `Passer commande`, suppression de l'obligation WhatsApp | Oui |
| 02 | Backend commandes | Commande enregistree cote serveur avec base de donnees | Oui |
| 03 | Page merci | Confirmation avec numero de commande, ticket de caisse et check anime | Oui |
| 04 | Admin commandes | Tableau admin prive pour lire et traiter les commandes | Oui |
| 05 | Admin produits | Gestion produits sans dependance obligatoire a Sanity | Oui |
| 06 | Notifications internes et Pixel | Alertes admin pendant session + events Meta propres | Oui |
| 07 | Push et deploy | Git propre, deploiement Hostinger, verification live mobile/desktop | Oui |
| 08 | Admin mobile et Web Push | Admin installable sur telephone + notifications push hors page, sans e-mail | Oui |

## Regle de progression

Une phase est terminee uniquement si :
- le comportement attendu fonctionne ;
- l'audit de phase est documente dans `AUDIT_LOG.md` ;
- les corrections bloquantes sont faites ;
- le site reste utilisable sur mobile ;
- aucune regression evidente du panier, des pages produit ou du checkout n'est detectee.
