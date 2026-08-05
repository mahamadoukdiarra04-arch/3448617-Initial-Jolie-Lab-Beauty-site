# Phase 03 - Page merci

Statut : executee le 2026-08-05, audit `OK avec reserves`.

## Objectif

Creer une page de confirmation claire, premium et rassurante apres l'enregistrement d'une commande.

## Fichiers probables

- `merci.html` ou `merci.php`
- `merci.js`
- `styles.css`
- eventuellement `api/orders/read-public.php` pour recuperer un resume securise par numero de commande

## Experience attendue

- Animation de check courte et fluide.
- Ticket de caisse stylise.
- Numero de commande visible.
- Statut visible : `En attente de confirmation`.
- Paiement visible : `A la livraison`.
- Livraison visible : `A determiner`.
- Message clair indiquant que Jolie Lab Beauty contactera la cliente.
- Bouton retour boutique.
- Bouton WhatsApp secondaire.

## Points de vigilance

- Ne pas afficher d'informations sensibles si un numero de commande est devine.
- Si le resume commande n'est pas recuperable, afficher une confirmation generique.
- Eviter les doublons Pixel au refresh.
- Ne pas effacer le panier avant confirmation serveur reussie.

## Critere d'acceptation

- La page merci fonctionne apres une vraie commande.
- Le ticket s'affiche proprement sur mobile.
- L'animation respecte `prefers-reduced-motion`.
- Le Pixel envoie l'evenement de conversion qualifiee.

## Audit de fin de phase

Utiliser `AUDIT_CHECKLIST.md`, puis ajouter le resultat dans `AUDIT_LOG.md`.
