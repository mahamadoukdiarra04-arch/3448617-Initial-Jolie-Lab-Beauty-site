# Page merci avec ticket de caisse anime

## Objectif UX

Quand la cliente clique sur `Passer commande`, elle doit arriver sur une page rassurante qui confirme que la commande a ete prise en compte.

La page doit donner une sensation de validation immediate, sans faire croire que le paiement est deja effectue.

## Route proposee

`merci.html`

Alternative si le backend PHP devient obligatoire des la phase 02 :
`merci.php?order=JLB-XXXXXX`

## Contenu attendu

Titre :
`Commande prise en compte`

Message principal :
`Merci, votre commande a bien ete recue. Jolie Lab Beauty vous contactera pour confirmer la disponibilite et le prix de livraison.`

Rappels visibles :
- Paiement : `A la livraison`
- Livraison : `A determiner`
- Statut : `En attente de confirmation`
- Numero de commande : `JLB-XXXXXX`

## Ticket de caisse stylise

Le ticket doit contenir :
- logo Jolie Lab Beauty ;
- numero de commande ;
- date ;
- liste des produits ;
- quantites ;
- total produits si connu ;
- ligne `Livraison : A determiner` ;
- ligne `Montant final : Confirme par l'admin` ;
- nom et telephone du client ;
- bouton secondaire `Ecrire sur WhatsApp`.

Direction visuelle :
- ticket blanc casse ou ivoire tres leger ;
- effet papier premium, pas cartoon ;
- bord haut ou bas legerement crante possible en CSS ;
- ombre douce ;
- typographie claire ;
- check anime vert Jolie Lab, centre au-dessus du ticket ou integre en haut.

## Animation du check

Animation attendue :
1. Cercle de validation apparait avec un scale doux.
2. Le check se dessine progressivement.
3. Le ticket remonte legerement et devient net.
4. Les lignes du ticket apparaissent avec un leger decalage.

Contraintes :
- animation courte : 900 ms a 1400 ms ;
- pas de secousse ;
- respecter `prefers-reduced-motion` ;
- rester fluide sur mobile ;
- ne pas bloquer la lecture si JavaScript echoue.

## Tracking Meta

Sur cette page :
- envoyer `Lead` ou `OrderSubmitted` une seule fois par commande ;
- ne pas envoyer `Purchase` automatiquement ;
- stocker localement les numeros deja trackes pour eviter les doublons au refresh.

## Audit specifique

- La page s'affiche avec ou sans numero de commande.
- Le ticket ne deborde pas en mobile.
- L'animation est visible mais non intrusive.
- Le bouton WhatsApp reste secondaire.
- La commande n'est pas supprimee du panier tant que l'enregistrement serveur n'a pas reussi.
