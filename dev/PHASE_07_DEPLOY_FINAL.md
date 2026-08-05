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

## Execution du 2026-08-05

Etat atteint :
- validation locale OK ;
- commit Git cree : `d42ac71 Build order admin and checkout flow` ;
- push GitHub effectue sur `main` ;
- archive Hostinger preparee : `jolie-lab-release-20260805-072037.zip` ;
- archive verifiee : admin, API, includes, merci et pixel presents ; dossiers `dev`, `database`, `sanity-studio` exclus.

Blocage :
- le domaine live `https://jolielabbeauty.com/` sert encore l'ancienne version ;
- `merci.html`, `pixel-events.js` et `admin/login.php` retournent encore `404` en live ;
- la page GIT Hostinger n'est pas connectee a GitHub ;
- l'upload via File Manager n'a pas pu etre termine depuis le navigateur integre a cause du blocage d'acces Hostinger/File Browser.

Suite recommandee :
- finaliser le deploy via Hostinger File Manager, FTP/SFTP, ou connecter GitHub via OAuth Hostinger ;
- extraire l'archive dans `public_html` sans supprimer une eventuelle configuration serveur non versionnee ;
- importer le schema SQL ou la migration produits selon l'etat de la base ;
- verifier ensuite le site public, `merci.html`, `pixel-events.js`, `admin/login.php`, une commande test et le mobile.

## Recontrole apres upload manuel du 2026-08-05

Etat atteint :
- fichiers extraits au bon emplacement `public_html` ;
- `https://jolielabbeauty.com/` et `index.html` servent la nouvelle version ;
- `checkout.html`, `merci.html`, `pixel-events.js`, `merci.js` et `admin/login.php` repondent en `200` ;
- l'archive ZIP et le sous-dossier extrait par erreur ne sont plus accessibles en public ;
- verification mobile 390px OK sur accueil, checkout, merci et login admin.

Reserve :
- `api/products/list.php` retourne encore `503` ;
- `api/orders/create.php` retourne encore `503` avec un payload valide ;
- la configuration serveur/MySQL doit encore etre terminee pour enregistrer les commandes et administrer les produits.
