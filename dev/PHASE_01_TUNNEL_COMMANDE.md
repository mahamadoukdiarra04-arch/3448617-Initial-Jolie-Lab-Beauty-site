# Phase 01 - Tunnel commande client

Statut : executee le 2026-08-04, audit `OK avec reserves`.

## Objectif

Transformer le checkout actuel pour que la cliente puisse passer commande directement sur le site, sans devoir ouvrir WhatsApp.

## Changements prevus

Pages et fichiers probables :
- `checkout.html`
- `checkout.js`
- `styles.css`
- `script.js` si le panier ou les boutons du drawer doivent etre ajustes

Modifications :
- remplacer le bouton `Envoyer la commande sur WhatsApp` par `Passer commande` ;
- retirer les moyens de paiement `Orange Money`, `Moov Money` et `Wave` du checkout principal ;
- afficher uniquement `Paiement a la livraison` ;
- afficher `Livraison : A determiner` ;
- rendre le formulaire plus court et plus clair ;
- conserver le bouton bulle WhatsApp sur le site ;
- afficher un message d'erreur clair si le panier est vide ou le formulaire incomplet ;
- preparer un objet commande propre cote JavaScript ;
- ajouter un etat de chargement sur le bouton `Passer commande`.

## Champs client

Champs recommandes :
- nom complet ;
- telephone ;
- ville ;
- quartier ou zone ;
- adresse / repere ;
- note optionnelle.

## Donnees commande a preparer

```json
{
  "customer": {
    "name": "",
    "phone": "",
    "city": "",
    "area": "",
    "address": "",
    "notes": ""
  },
  "paymentMethod": "Paiement a la livraison",
  "deliveryFee": null,
  "deliveryLabel": "A determiner",
  "items": [],
  "productsTotal": 0,
  "status": "new"
}
```

## Critere d'acceptation

- Le client peut remplir le checkout et cliquer sur `Passer commande`.
- Si le backend n'est pas encore pret, l'action peut afficher un mode temporaire clair.
- Aucun depart automatique vers WhatsApp.
- WhatsApp reste disponible en secondaire.
- Le panier fonctionne encore avec les variantes.
- Mobile sans debordement horizontal.

## Audit de fin de phase

Utiliser `AUDIT_CHECKLIST.md`, puis ajouter le resultat dans `AUDIT_LOG.md`.
