# Journal des audits

Chaque audit doit etre ajoute ici apres la phase correspondante.

## Modele d'entree

### Phase XX - Nom de la phase

Date :
Commit :
Environnement :

Resultat :
- Statut : `OK`, `OK avec reserves` ou `Bloque`
- Pages testees :
- Points valides :
- Points corriges :
- Points restants :

Commandes ou controles effectues :
```text

```

Decision :
- Passer a la phase suivante : oui/non
- Notes :

### Phase 01 - Tunnel commande client

Date : 2026-08-04
Commit : non committe
Environnement : local `http://127.0.0.1:8765`

Resultat :
- Statut : `OK avec reserves`
- Pages testees : `index.html`, `checkout.html`
- Points valides :
  - bouton principal checkout remplace par `Passer commande`
  - aucun popup WhatsApp automatique apres validation
  - paiement force a `Paiement a la livraison`
  - livraison forcee a `A determiner`
  - objet commande prepare dans `localStorage`
  - panier avec variante teste, dont `Complet Luxe Hair - Petit`
  - accueil mobile sans debordement horizontal
  - checkout mobile sans debordement horizontal
  - checkout desktop sans debordement horizontal
  - message de validation formulaire incomplet teste
  - aucune erreur JavaScript console apres neutralisation du fetch Sanity en local
- Points corriges :
  - textes visibles encore orientes `commande WhatsApp`
  - mentions `Orange Money`, `Moov Money` et `Wave` sur accueil/checkout
  - bruit CORS Sanity en environnement local
- Points restants :
  - la commande est seulement preparee localement tant que la phase 02 backend n'est pas developpee
  - la redirection vers la page merci sera traitee en phase 03

Commandes ou controles effectues :
```text
node --check checkout.js
node --check catalog-source.js
rg -n 'Envoyer la commande sur WhatsApp|Commander WhatsApp|Commande WhatsApp|Orange Money|Moov Money|Wave|deliveryZone|paymentMethod' index.html checkout.html checkout.js catalog-source.js
git diff --check
Playwright mobile 390x844 : index + checkout + soumission commande test
Playwright desktop 1365x900 : checkout + validation formulaire incomplet
```

Decision :
- Passer a la phase suivante : oui
- Notes : reserve normale de phase 01, car l'enregistrement serveur et l'admin arrivent en phase 02.

### Phase 02 - Backend commandes

Date : 2026-08-05
Commit : non committe
Environnement : local `http://127.0.0.1:8766`

Resultat :
- Statut : `OK avec reserves`
- Pages/API testees : `checkout.html`, `api/orders/create.php`
- Points valides :
  - schema MySQL cree pour `orders`, `order_items` et `admin_users`
  - fichier `includes/config.php` ignore par Git
  - fichier `includes/config.example.php` ajoute sans secret reel
  - API `POST api/orders/create.php` ajoutee
  - validation serveur des champs client et lignes produit
  - total produits recalcule cote serveur
  - paiement force a `Paiement a la livraison`
  - livraison gardee sans frais automatiques
  - endpoint retourne `405` si la methode n'est pas `POST`
  - endpoint retourne `422` si le JSON ou les champs sont invalides
  - endpoint retourne `503 setup_missing` tant que MySQL n'est pas configure
  - checkout appelle l'API et garde un fallback local si la configuration serveur manque
  - mobile checkout 390px sans debordement horizontal apres appel API
- Points corriges :
  - logs PHP locaux ajoutes au `.gitignore`
  - API protegee contre JSON vide, invalide ou trop volumineux
  - protection `.htaccess` simplifiee pour compatibilite Apache Hostinger
- Points restants :
  - insertion reelle en base a valider apres creation MySQL Hostinger et ajout de `includes/config.php`
  - redirection vers page merci prevue en phase 03
  - lecture/gestion admin des commandes prevue en phase 04

Commandes ou controles effectues :
```text
node --check checkout.js
php -l includes/db.php
php -l includes/response.php
php -l includes/orders.php
php -l api/orders/create.php
php -l includes/config.example.php
PHP local : jolie_normalize_order_payload avec commande valide
PHP local : jolie_normalize_order_payload avec commande invalide
POST http://127.0.0.1:8766/api/orders/create.php avec commande valide sans config MySQL -> 503 setup_missing
POST http://127.0.0.1:8766/api/orders/create.php avec commande invalide -> 422 validation_error
GET http://127.0.0.1:8766/api/orders/create.php -> 405 method_not_allowed
Playwright mobile 390x844 : checkout + soumission vers API + fallback local
git diff --check
```

Decision :
- Passer a la phase suivante : oui
- Notes : reserve attendue, car la base MySQL Hostinger n'est pas encore configuree dans ce repo local.

### Phase 03 - Page merci

Date : 2026-08-05
Commit : non committe
Environnement : local fichier + audit navigateur headless

Resultat :
- Statut : `OK avec reserves`
- Pages testees : `checkout.html`, `merci.html`
- Points valides :
  - checkout redirige vers `merci.html?commande=...` apres soumission valide
  - page merci affiche `Commande prise en compte`
  - ticket de caisse stylise cree
  - numero de commande visible
  - statut visible : `En attente de confirmation`
  - paiement visible : `A la livraison`
  - livraison visible : `A determiner`
  - total produits et lignes produits affiches depuis la commande stockee
  - bouton secondaire `Ecrire sur WhatsApp`
  - page generique stable si aucune commande n'est stockee
  - animation du check et du ticket ajoutee
  - `prefers-reduced-motion` respecte
  - tracking Meta `Lead` avec `content_name: OrderSubmitted`
  - anti-doublon Pixel par numero de commande dans `localStorage`
  - mobile 390px sans debordement horizontal
  - desktop 1365px sans debordement horizontal
- Points corriges :
  - bulle WhatsApp masquee uniquement sur la page merci mobile pour ne pas chevaucher le ticket
- Points restants :
  - la recuperation publique d'une commande depuis la base pourra etre ajoutee apres configuration MySQL
  - les commandes seront consultables dans l'admin a partir de la phase 04

Commandes ou controles effectues :
```text
node --check checkout.js
node --check merci.js
rg -n "fbq|Lead|Purchase|OrderSubmitted|prefers-reduced-motion|check-badge|receipt-ticket" merci.html merci.js checkout.js styles.css
git diff --check
Playwright mobile 390x844 : checkout -> merci avec commande test
Playwright desktop 1365x900 : merci.html sans commande stockee
Capture mobile inspectee : ticket lisible, check visible, pas de chevauchement
```

Decision :
- Passer a la phase suivante : oui
- Notes : reserve normale, car le resume vient encore du stockage local tant que l'admin/base n'est pas pleinement configure.

### Phase 04 - Admin commandes

Date : 2026-08-05
Commit : non committe
Environnement : local `http://127.0.0.1:8770`

Resultat :
- Statut : `OK avec reserves`
- Pages testees : `admin/login.php`, `admin/index.php`, `admin/orders.php`, `admin/order.php`
- Points valides :
  - page de connexion admin creee
  - pages admin protegees par session
  - utilisateur non connecte redirige vers `login.php`
  - authentification basee sur `admin_users` et `password_verify`
  - logout admin cree
  - tableau de bord commandes cree
  - liste commandes avec recherche et filtre statut creee
  - page detail commande creee
  - changement de statut code cote serveur
  - prix de livraison modifiable cote serveur
  - montant final calcule apres saisie livraison
  - bouton WhatsApp client dans le detail commande
  - protection CSRF sur mise a jour commande
  - styles admin mobile/desktop ajoutes
  - outil de generation de hash admin ajoute
  - aucun secret reel ajoute au repository
  - login mobile 390px sans debordement horizontal
- Points corriges :
  - redirection apres login protegee contre URL externe
  - message clair si MySQL n'est pas encore configure
- Points restants :
  - creer la base MySQL Hostinger
  - importer `database/schema.sql`
  - creer `includes/config.php` sur le serveur
  - creer le premier utilisateur dans `admin_users`
  - tester une vraie commande en base et sa mise a jour depuis l'admin

Commandes ou controles effectues :
```text
php -l includes/auth.php
php -l includes/admin_orders.php
php -l admin/_bootstrap.php
php -l admin/login.php
php -l admin/logout.php
php -l admin/index.php
php -l admin/orders.php
php -l admin/order.php
php -l tools/generate_admin_hash.php
node --check admin/assets/admin.js
php tools/generate_admin_hash.php "motdepasse-admin-test"
rg -n "secret hostinger ou mot de passe reel" admin includes database tools
GET /admin/login.php -> 200
GET /admin/index.php sans session -> 302 login
POST /admin/login.php sans config MySQL -> message configuration
Playwright mobile 390x844 : login admin sans debordement
git diff --check
```

Decision :
- Passer a la phase suivante : oui
- Notes : reserve attendue, car l'admin depend de MySQL pour afficher et modifier de vraies commandes.

### Phase 05 - Admin produits

Date : 2026-08-05
Commit : non committe
Environnement : local `http://127.0.0.1:8770`

Resultat :
- Statut : `OK avec reserves`
- Pages/API testees : `index.html`, `produit.html`, `admin/login.php`, `admin/products.php`, `admin/product.php`, `api/products/list.php`
- Points valides :
  - tables produits ajoutees au schema principal
  - migration separee `database/phase-05-products.sql` ajoutee pour une base deja existante
  - API catalogue admin ajoutee
  - site public branche sur catalogue admin avec fallback Sanity/catalogue local
  - produit ajoute depuis l'API admin simulee visible sur la boutique
  - produit masque via slug retire de la boutique dans la simulation
  - video produit admin affichee sur une card via balise `video`
  - page admin liste produits creee avec recherche, categorie et statut
  - page admin creation/modification produit creee
  - variantes dynamiques ajoutees, dont format petit/grand possible
  - descriptions gardees telles quelles dans la normalisation PHP
  - navigation admin mise a jour avec `Produits`
  - texte fiche produit `Livraison & paiement` aligne sur paiement a la livraison
  - pages produit statiques alignees sur le meme texte paiement/livraison
  - mobile 390px sans debordement horizontal sur accueil, fiche produit et login admin
- Points corriges :
  - les champs de formulaire admin n'heritent plus du style uppercase des labels
  - cache-busting mis a jour pour `catalog-source.js` et `admin.css`
  - messages admin/API clarifies
- Points restants :
  - importer `database/phase-05-products.sql` sur Hostinger si la base existe deja
  - configurer `includes/config.php` sur le serveur
  - tester creation, modification et masquage avec une vraie base MySQL
  - decider plus tard si une suppression physique produit doit etre ajoutee avec garde-fous

Commandes ou controles effectues :
```text
php -l includes/admin_products.php
php -l admin/products.php
php -l admin/product.php
php -l api/products/list.php
node --check admin/assets/admin.js
node --check catalog-source.js
node --check product-detail.js
git diff --check
GET /api/products/list.php sans config MySQL -> 503 setup_missing
POST /api/products/list.php -> 405 method_not_allowed
GET /admin/products.php sans session -> 302 login
GET /admin/product.php sans session -> 302 login
PHP local : jolie_admin_normalize_product_payload avec emoji, image, video, variantes petit/grand
Playwright Chrome mobile 390x844 : index, produit generique, admin login sans debordement
Playwright Chrome avec API produits simulee : ajout produit, masquage par slug, video card
rg -n "Orange Money|Moov Money|Wave" . -> restants uniquement dans docs d'audit/dev
Playwright Chrome mobile 390x844 : page produit statique `produits/18-complet-luxe-hair.html`
```

Decision :
- Passer a la phase suivante : oui
- Notes : reserve attendue, car la validation complete d'ecriture produit depend de la base MySQL Hostinger.

### Phase 06 - Notifications et Pixel

Date : 2026-08-05
Commit : non committe
Environnement : local `http://127.0.0.1:8770`

Resultat :
- Statut : `OK avec reserves`
- Pages/API testees : `index.html`, `checkout.html`, `merci.html`, `produit.html`, `admin/login.php`, `admin/order-alerts.php`, `api/orders/create.php`
- Points valides :
  - email automatique admin branche apres creation reelle d'une commande
  - contenu email teste sans envoi reel : sujet, cliente, telephone, produits, total, livraison a determiner, lien admin
  - notification email ne bloque pas la commande si `mail()` echoue
  - configuration email ajoutee dans `includes/config.example.php` sans secret
  - dashboard admin affiche une alerte si des commandes `new` existent
  - endpoint `admin/order-alerts.php` protege par session admin
  - notifications navigateur declenchables depuis l'admin si l'appareil autorise les notifications
  - `PageView` conserve
  - `AddToCart` declenche depuis accueil, fiche produit generique et anciennes fiches statiques
  - `InitiateCheckout` declenche sur checkout avec panier non vide
  - `InitiateCheckout` ne se redouble pas au refresh du meme panier pendant la session
  - `Lead` conserve sur page merci avec `content_name: OrderSubmitted`
  - `Lead` ne se redouble pas au refresh pour le meme numero de commande
  - aucun `Purchase` automatique dans le code actif
  - mobile 390px sans debordement horizontal sur accueil, checkout, merci, fiche produit et login admin
- Points corriges :
  - scripts principaux et anciennes fiches statiques versionnes pour contourner le cache navigateur
  - `Lead` n'est marque comme suivi que si `fbq` est disponible
- Points restants :
  - tester un vrai envoi email sur Hostinger apres configuration de `includes/config.php`
  - tester `admin/order-alerts.php` connecte avec une vraie base contenant une nouvelle commande
  - la vraie push notification en arriere-plan reste une phase future si necessaire

Commandes ou controles effectues :
```text
php -l includes/notifications.php
php -l includes/orders.php
php -l includes/admin_orders.php
php -l admin/order-alerts.php
php -l admin/_bootstrap.php
php -l admin/index.php
php -l admin/login.php
php -l includes/config.example.php
node --check pixel-events.js
node --check script.js
node --check product-detail.js
node --check product-page.js
node --check checkout.js
node --check merci.js
node --check admin/assets/admin.js
PHP local : jolie_order_notification_subject + jolie_build_order_notification_body
GET /admin/order-alerts.php sans session -> 302 login
GET /api/orders/create.php -> 405 method_not_allowed
POST /api/orders/create.php avec payload valide sans config MySQL -> 503 setup_missing
Playwright Chrome Pixel : AddToCart present apres ajout panier
Playwright Chrome Pixel : InitiateCheckout present puis absent au refresh du meme panier
Playwright Chrome Pixel : Lead present puis absent au refresh de la meme commande
Playwright Chrome mobile 390x844 : index, checkout, merci, produit, admin login sans debordement
rg -n "Purchase" --glob "!dev/**" . -> aucune occurrence active
rg -n "secrets hostinger connus" . -> aucune occurrence
git diff --check
```

Decision :
- Passer a la phase suivante : oui
- Notes : reserve attendue, car l'envoi email et le polling admin complet demandent une base MySQL Hostinger configuree.
