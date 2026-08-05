# Phase 04 - Admin commandes

Statut : executee le 2026-08-05, audit `OK avec reserves`.

## Objectif

Creer un espace admin prive pour voir et gerer les commandes.

## Pages probables

- `admin/login.php`
- `admin/logout.php`
- `admin/index.php`
- `admin/orders.php`
- `admin/order.php`
- `admin/assets/admin.css`
- `admin/assets/admin.js`

## Fonctions attendues

- Connexion admin.
- Liste des commandes recentes.
- Detail d'une commande.
- Changement de statut.
- Ajout du prix de livraison.
- Calcul du montant final apres saisie admin.
- Bouton pour contacter le client sur WhatsApp.
- Recherche par nom, telephone ou numero de commande.
- Filtres par statut.

## Statuts recommandes

- `Nouvelle`
- `En attente de confirmation`
- `Confirmee`
- `En preparation`
- `En livraison`
- `Livree`
- `Annulee`

## Design admin

L'admin doit etre simple, dense et lisible :
- tableau clair ;
- badges de statut ;
- actions visibles ;
- detail commande en panneau ou page dediee ;
- compatible mobile, mais priorite au confort desktop.

## Critere d'acceptation

- Une personne non connectee est redirigee vers login.
- L'admin voit les nouvelles commandes.
- L'admin peut changer le statut.
- L'admin peut renseigner la livraison.
- Les changements sont conserves en base.

## Audit de fin de phase

Utiliser `AUDIT_CHECKLIST.md`, puis ajouter le resultat dans `AUDIT_LOG.md`.
