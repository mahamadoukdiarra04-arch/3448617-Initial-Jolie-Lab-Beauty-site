# Phase 06 - Notifications et Pixel

## Objectif

Notifier l'admin quand une commande arrive et rendre le tracking Meta Pixel plus utile.

## Notifications

Priorite recommandee :
1. Email automatique a l'admin.
2. Notification visible dans le dashboard admin.
3. Notification push navigateur si la cliente accepte les notifications.

Email :
- destinataire principal : `ramatabore31@gmail.com`
- sujet : `Nouvelle commande Jolie Lab Beauty - JLB-XXXXXX`
- contenu : nom, telephone, produits, total produits, livraison a determiner.

Push navigateur :
- demander l'autorisation depuis l'admin, pas cote client ;
- enregistrer l'appareil admin ;
- envoyer une notification seulement pour les nouvelles commandes ;
- prevoir un fallback email si le push echoue.

## Pixel Meta

Evenements recommandes :
- `PageView` : deja en place.
- `AddToCart` : ajout panier.
- `InitiateCheckout` : ouverture checkout.
- `Lead` ou `OrderSubmitted` : commande prise en compte sur page merci.

Evenement non recommande automatiquement :
- `Purchase`, car la commande n'est pas encore payee et la livraison n'est pas determinee.

## Critere d'acceptation

- Une commande declenche une notification email.
- L'admin voit visuellement les nouvelles commandes.
- Le Pixel ne double pas les conversions au refresh.
- Les events importants sont testables avec Meta Events Manager.

## Audit de fin de phase

Utiliser `AUDIT_CHECKLIST.md`, puis ajouter le resultat dans `AUDIT_LOG.md`.

## Etat phase 06

Statut : realise en local.

Livrables :

- email automatique admin apres creation reelle d'une commande
- configuration notification dans `includes/config.example.php`
- helper email `includes/notifications.php`
- alerte visuelle nouvelles commandes sur le dashboard admin
- endpoint admin protege `admin/order-alerts.php`
- notifications navigateur depuis l'admin quand l'appareil les autorise
- helper Pixel `pixel-events.js`
- tracking `AddToCart`
- tracking `InitiateCheckout` anti-doublon par panier/session
- tracking `Lead` page merci anti-doublon par numero de commande

Reserve :

- l'email reel depend de la configuration MySQL + PHP mail sur Hostinger.
- la notification navigateur fonctionne quand l'admin est ouvert; une vraie notification push en arriere-plan demanderait service worker + abonnement push.
- aucun evenement `Purchase` n'est envoye automatiquement.
