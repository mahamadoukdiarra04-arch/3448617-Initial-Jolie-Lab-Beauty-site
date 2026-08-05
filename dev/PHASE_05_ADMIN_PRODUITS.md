# Phase 05 - Admin produits

## Objectif

Permettre a la cliente de gerer les produits depuis une interface admin simple.

## Decision a confirmer

Deux chemins sont possibles :

1. Garder Sanity pour les produits et garder notre admin pour les commandes.
2. Centraliser produits + commandes dans notre admin PHP/MySQL.

Recommandation actuelle :
centraliser progressivement dans notre admin pour que la cliente ait un seul portail.

## Fonctions attendues

- Ajouter un produit.
- Modifier un produit.
- Masquer un produit sans supprimer son historique.
- Supprimer un produit si aucune dependance sensible.
- Gerer prix, categorie, images, videos.
- Gerer les variantes, notamment `Complet Luxe Hair` petit/grand.
- Garder les descriptions produit telles quelles.
- Previsualiser la fiche produit avant publication si possible.

## Tables possibles

### `products`

- `id`
- `slug`
- `name`
- `category`
- `price`
- `price_note`
- `description`
- `summary`
- `usage`
- `suited_for`
- `is_active`
- `created_at`
- `updated_at`

### `product_media`

- `id`
- `product_id`
- `type`
- `url`
- `alt`
- `sort_order`

### `product_variants`

- `id`
- `product_id`
- `variant_key`
- `name`
- `price`
- `is_default`

## Critere d'acceptation

- Un produit ajoute depuis l'admin apparait sur le site.
- Un produit masque disparait du site mais reste dans les commandes historiques.
- Une video produit peut apparaitre sur une card.
- Les descriptions ne sont pas reformulees automatiquement.
- Mobile toujours propre sur la boutique et les fiches produit.

## Audit de fin de phase

Utiliser `AUDIT_CHECKLIST.md`, puis ajouter le resultat dans `AUDIT_LOG.md`.

## Etat phase 05

Statut : realise en local.

Livrables :

- tables `products`, `product_media`, `product_variants`
- migration `database/phase-05-products.sql`
- API publique `api/products/list.php`
- helpers `includes/admin_products.php`
- pages admin `admin/products.php` et `admin/product.php`
- apercu admin produit + medias
- variantes dynamiques dans l'admin
- fusion catalogue admin + catalogue existant cote site

Reserve :

- les tests d'ecriture en base reelle restent a faire apres import SQL et configuration MySQL Hostinger.
- la suppression physique reste volontairement non exposee; le masquage protege mieux l'historique des commandes.
