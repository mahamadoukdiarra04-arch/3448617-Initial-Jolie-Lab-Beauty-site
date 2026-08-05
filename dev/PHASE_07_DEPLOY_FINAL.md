# Phase 07 - Push et deploy final

## Objectif

Mettre en ligne la version stable sans casser le site existant.

## Preparation

- Verifier le statut Git.
- Identifier les fichiers modifies.
- Exclure les fichiers temporaires ou archives zip.
- Verifier les secrets et mots de passe.
- Creer ou verifier la sauvegarde Hostinger avant remplacement.
- Verifier la base MySQL et les identifiants serveur.

## Validation locale

- Accueil.
- Boutique.
- Fiche produit.
- Panier.
- Checkout.
- Page merci.
- Login admin.
- Liste commandes.
- Detail commande.
- Gestion produits si incluse dans la release.

## Validation live

Apres deploy :
- verifier `https://jolielabbeauty.com/` ;
- verifier une fiche produit ;
- verifier `checkout.html` ;
- passer une commande test ;
- verifier la page merci ;
- verifier l'arrivee de la commande dans l'admin ;
- verifier l'email ou notification ;
- verifier mobile.

## Rollback

Avant deploy, garder une version stable :
- commit Git stable ;
- sauvegarde des fichiers Hostinger ;
- export SQL si schema modifie.

Rollback possible :
- restaurer les fichiers precedents ;
- restaurer la base si necessaire ;
- repasser le site en tunnel WhatsApp temporaire si le backend bloque.

## Critere d'acceptation

- Site public accessible.
- Commande test recue dans l'admin.
- Page merci affichee.
- Pas d'erreur mobile critique.
- Pixel actif.
- Git push effectue.
- Deploiement Hostinger verifie.
