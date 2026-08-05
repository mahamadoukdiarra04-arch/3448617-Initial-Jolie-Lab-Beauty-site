<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/admin_orders.php';
require_once __DIR__ . '/../includes/admin_products.php';

function jolie_admin_asset(string $path): string
{
    return 'assets/' . ltrim($path, '/') . '?v=20260805-phase6';
}

function jolie_admin_setup_text(Throwable $error): string
{
    if ($error instanceof JolieSetupException) {
        return "La base MySQL n'est pas encore configuree. Creez `includes/config.php`, importez `database/schema.sql`, puis ajoutez un utilisateur admin.";
    }

    return "Une erreur serveur empeche de charger cette section pour le moment.";
}

function jolie_admin_page_start(string $title, ?array $user = null): void
{
    $safeTitle = jolie_admin_h($title);
    $userName = jolie_admin_h($user['name'] ?? 'Admin');
    echo <<<HTML
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{$safeTitle} | Admin Jolie Lab Beauty</title>
    <link rel="icon" type="image/png" href="../assets/brand/logo.png" />
    <link rel="stylesheet" href="{$GLOBALS['adminCss']}" />
  </head>
  <body class="admin-shell">
    <aside class="admin-sidebar">
      <a class="admin-brand" href="index.php">
        <img src="../assets/brand/logo.png" alt="" />
        <span>Jolie Lab <small>Admin</small></span>
      </a>
      <nav>
        <a href="index.php">Tableau de bord</a>
        <a href="orders.php">Commandes</a>
        <a href="products.php">Produits</a>
        <a href="../index.html">Voir le site</a>
      </nav>
      <div class="admin-user">
        <span>{$userName}</span>
        <a href="logout.php">Deconnexion</a>
      </div>
    </aside>
    <main class="admin-main">
      <div class="admin-notification-strip" data-admin-notifications hidden>
        <div>
          <strong>Alertes commandes</strong>
          <span data-admin-notification-text>Surveille les nouvelles commandes.</span>
        </div>
        <button class="admin-button is-muted" type="button" data-enable-admin-notifications>Activer</button>
      </div>
HTML;
}

function jolie_admin_page_end(): void
{
    echo <<<HTML
    </main>
    <script src="{$GLOBALS['adminJs']}"></script>
  </body>
</html>
HTML;
}

$GLOBALS['adminCss'] = jolie_admin_asset('admin.css');
$GLOBALS['adminJs'] = jolie_admin_asset('admin.js');
