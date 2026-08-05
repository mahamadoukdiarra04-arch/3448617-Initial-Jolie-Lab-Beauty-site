# Base de donnees Jolie Lab Beauty

## Installation Hostinger

1. Creer une base MySQL dans hPanel.
2. Creer ou recuperer l'utilisateur MySQL associe.
3. Importer `schema.sql` dans phpMyAdmin.
4. Copier `includes/config.example.php` vers `includes/config.php` sur le serveur.
5. Renseigner les vraies valeurs Hostinger dans `includes/config.php`.
6. Creer un compte admin dans `admin_users`.

`includes/config.php` est ignore par Git pour eviter de publier les identifiants de base de donnees.

Si la base existe deja avec les tables commandes, importer aussi `phase-05-products.sql` pour ajouter la gestion produits sans toucher aux commandes existantes.

Pour les notifications push admin, importer aussi `phase-08-push-notifications.sql` si la table `admin_push_subscriptions` n'existe pas encore.

## Tables creees

- `orders` : informations client, statut, paiement et montants.
- `order_items` : lignes produits au moment de la commande.
- `admin_users` : base future pour la connexion admin.
- `products` : fiches produits gerables depuis l'admin.
- `product_media` : images et videos reliees aux produits.
- `product_variants` : formats/prix alternatifs, par exemple petit et grand complet.
- `admin_push_subscriptions` : telephones ou navigateurs admin autorises a recevoir les notifications push.

## Regles metier

- Le paiement reste `Paiement a la livraison`.
- Les frais de livraison restent vides au depart.
- Le montant final reste vide tant que l'admin ne valide pas.
- Les prix produits sont copies dans la commande pour garder l'historique.
- Masquer un produit le retire du site public sans supprimer les commandes passees.
- Les descriptions produits doivent etre collees/modifiees telles quelles dans l'admin.
- Les notifications e-mail automatiques sont desactivees.
- Les notifications push utilisent l'admin installe sur le telephone et ouvrent les nouvelles commandes.

## Activer les notifications push admin

Generer les cles VAPID en local :

```text
php tools/generate_vapid_keys.php
```

Copier uniquement les valeurs generees dans `includes/config.php` sur Hostinger :

```php
'notifications' => [
    'push_enabled' => true,
    'vapid_subject' => 'mailto:ramatabore31@gmail.com',
    'vapid_public_key' => 'CLE_PUBLIQUE_GENEREE',
    'vapid_private_key_pem' => <<<'PEM'
CLE_PRIVEE_GENEREE
PEM,
],
```

Ne pas committer `includes/config.php` ni les cles VAPID privees.

Ensuite, sur le telephone de la cliente :
- ouvrir `/admin/login.php` en HTTPS ;
- se connecter ;
- installer l'admin sur l'ecran d'accueil quand le navigateur le propose ;
- ouvrir l'admin depuis l'icone ;
- appuyer sur `Activer` dans le bandeau `Notifications commandes`.

## Creer le premier admin

Generer un hash de mot de passe en local :

```text
php tools/generate_admin_hash.php "mot-de-passe-long"
```

Puis inserer l'utilisateur dans phpMyAdmin en remplacant le hash :

```sql
INSERT INTO admin_users (email, password_hash, name, role)
VALUES ('admin@example.com', 'HASH_GENERE_ICI', 'Jolie Lab Admin', 'admin');
```

Ne jamais committer le vrai mot de passe ni le fichier `includes/config.php`.
