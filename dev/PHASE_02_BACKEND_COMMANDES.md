# Phase 02 - Backend commandes

Statut : executee le 2026-08-05, audit `OK avec reserves`.

## Objectif

Ajouter un stockage serveur pour que les commandes soient enregistrees et consultables dans l'admin.

## Choix technique recommande

Hostinger supporte bien PHP + MySQL. Pour ce site, c'est le choix le plus simple et le plus durable.

Structure possible :
- `api/orders/create.php`
- `api/orders/get.php`
- `api/orders/update-status.php`
- `includes/db.php`
- `includes/auth.php`
- `database/schema.sql`

## Tables recommandees

### `orders`

- `id`
- `order_number`
- `customer_name`
- `customer_phone`
- `customer_city`
- `customer_area`
- `customer_address`
- `customer_notes`
- `payment_method`
- `products_total`
- `delivery_fee`
- `final_total`
- `status`
- `created_at`
- `updated_at`

### `order_items`

- `id`
- `order_id`
- `product_id`
- `product_slug`
- `product_name`
- `variant_id`
- `variant_name`
- `unit_price`
- `quantity`
- `line_total`

### `admin_users`

- `id`
- `email`
- `password_hash`
- `name`
- `role`
- `created_at`

## Regles importantes

- Ne jamais faire confiance au panier local pour les droits admin.
- Verifier les champs obligatoires cote serveur.
- Generer un numero de commande lisible, par exemple `JLB-20260804-0001`.
- Garder le prix produit soumis au moment de la commande pour conserver l'historique.
- Ne pas inventer le prix de livraison.
- Laisser `delivery_fee` et `final_total` vides tant que l'admin n'a pas valide.

## Critere d'acceptation

- Une commande valide est enregistree en base.
- Le serveur retourne un numero de commande.
- Le checkout redirige vers la page merci avec ce numero.
- Une commande invalide retourne un message clair.
- Pas de secret visible dans le repository.

## Audit de fin de phase

Utiliser `AUDIT_CHECKLIST.md`, puis ajouter le resultat dans `AUDIT_LOG.md`.
