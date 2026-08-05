# Phase 08 - Admin mobile et notifications push

## Objectif

Permettre a la cliente d'utiliser l'espace admin comme une icone sur son telephone et de recevoir les nouvelles commandes par notification push, que l'admin soit ouvert ou non.

## Decisions

- Pas de notification e-mail automatique.
- WhatsApp reste une bulle de contact, mais la gestion des commandes passe par l'admin.
- Les notifications hors page sont des Web Push associees au telephone/navigateur admin.
- La notification affiche un message generique et ouvre la liste des nouvelles commandes.
- Les details complets de commande restent visibles dans l'admin apres connexion.

## Elements developpes

- Manifeste PWA admin : `admin/manifest.webmanifest`.
- Service worker admin : `admin/sw.js`.
- Endpoint public key VAPID protege admin : `admin/push-key.php`.
- Endpoint d'enregistrement appareil protege admin : `admin/push-subscription.php`.
- Table SQL : `admin_push_subscriptions`.
- Migration separee : `database/phase-08-push-notifications.sql`.
- Outil local de generation des cles : `tools/generate_vapid_keys.php`.
- Bandeau admin avec action `Installer` et action `Activer`.

## Points serveur requis

- Importer `database/phase-08-push-notifications.sql` si la base existe deja.
- Generer une paire de cles VAPID en local.
- Coller ces cles dans `includes/config.php` sur Hostinger.
- Ne pas ajouter de configuration mail pour les commandes.
- Verifier que le site est servi en HTTPS.

## Audit attendu

- `php -l` sur les endpoints push, notifications et outil VAPID.
- `node --check` sur `admin/assets/admin.js` et `admin/sw.js`.
- Verification du manifeste admin.
- Verification mobile de l'admin sans debordement horizontal.
- Verification live apres upload : `/admin/manifest.webmanifest`, `/admin/sw.js`, `/admin/push-key.php`.
