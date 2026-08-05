# Checklist d'audit par phase

Utiliser cette checklist a la fin de chaque phase developpee.

## Audit fonctionnel

- Le parcours principal fonctionne du debut a la fin.
- Les anciens comportements utiles sont conserves.
- Les messages visibles sont clairs pour une cliente non technique.
- Les erreurs sont affichees proprement.
- Les champs obligatoires bloquent bien la validation.
- Le panier conserve les produits, variantes et quantites attendues.
- Le prix produit reste base sur les donnees existantes.
- La livraison reste affichee comme `A determiner`.
- Le paiement reste affichee comme `Paiement a la livraison`.

## Audit mobile

- Largeur mobile sans debordement horizontal.
- Menu mobile utilisable.
- Panier accessible au premier appui.
- Checkout lisible sans elements coupes.
- Boutons assez grands pour le tactile.
- Page merci lisible sur petit ecran.
- Ticket de caisse centre, non coupe, et animation visible.

## Audit admin

- Les pages admin sont protegees par connexion.
- Une personne non connectee ne peut pas acceder aux commandes.
- Les actions admin refusent les requetes non autorisees.
- Les statuts de commande se mettent a jour correctement.
- Les modifications produits apparaissent cote site.
- Les suppressions ou masquages ne cassent pas les anciennes commandes.

## Audit donnees

- Une commande cree un enregistrement unique.
- Le numero de commande est stable.
- Les lignes produit sont enregistrees avec nom, quantite, prix produit et variante.
- Les infos client sont enregistrees correctement.
- Les notes client sont conservees.
- Les frais de livraison peuvent rester vides tant que l'admin ne les renseigne pas.
- Les donnees sensibles ne sont pas exposees dans le code public.

## Audit Pixel Meta

- `PageView` reste present.
- `AddToCart` se declenche a l'ajout panier.
- `InitiateCheckout` se declenche au checkout.
- `Lead` ou `OrderSubmitted` se declenche sur la page merci.
- `Purchase` n'est pas envoye tant que le montant final n'est pas valide.
- Les evenements ne se doublonnent pas lors d'un retour arriere ou refresh.

## Audit technique

- Pas d'erreur JavaScript console visible.
- Pas d'erreur PHP cote serveur.
- Pas de secret dans le repository.
- Validation HTML/CSS de base.
- Requetes serveur avec retours d'erreur geres.
- Base de donnees migree proprement.
- Sauvegarde ou rollback possible avant deploy.

## Audit deploiement

- Git status controle avant commit.
- Commit clair.
- Push sur la bonne branche.
- Upload Hostinger ou workflow deploy execute.
- Verification live sur accueil, produit, checkout, merci et admin login.
- Verification mobile live.
