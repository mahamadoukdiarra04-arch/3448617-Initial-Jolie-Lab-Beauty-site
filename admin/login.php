<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

$next = (string) ($_GET['next'] ?? 'index.php');
if ($next === '' || str_contains($next, '://') || str_starts_with($next, '//')) {
    $next = 'index.php';
}

if (jolie_current_admin()) {
    header('Location: ' . $next);
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = (string) ($_POST['email'] ?? '');
    $password = (string) ($_POST['password'] ?? '');

    try {
        if (jolie_login_admin($email, $password)) {
            header('Location: ' . $next);
            exit;
        }
        $error = 'Email ou mot de passe incorrect.';
    } catch (Throwable $exception) {
        $error = $exception instanceof JolieSetupException
            ? "La base MySQL n'est pas encore configuree pour l'espace admin."
            : "Connexion indisponible pour le moment.";
    }
}
?>
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Connexion admin | Jolie Lab Beauty</title>
    <link rel="icon" type="image/png" href="../assets/brand/logo.png" />
    <link rel="apple-touch-icon" href="../assets/brand/admin-icon-180.png" />
    <link rel="manifest" href="manifest.webmanifest" />
    <meta name="theme-color" content="#15120f" />
    <link rel="stylesheet" href="assets/admin.css?v=20260805-phase10" />
  </head>
  <body class="admin-login-page">
    <main class="login-card">
      <img src="../assets/brand/logo.png" alt="" />
      <span class="admin-kicker">Jolie Lab Beauty</span>
      <h1>Connexion admin</h1>
      <p>Accedez aux commandes recues sur le site.</p>

      <?php if ($error !== ''): ?>
        <div class="admin-alert is-error"><?= jolie_admin_h($error) ?></div>
      <?php endif; ?>

      <form method="post" action="login.php?next=<?= urlencode($next) ?>">
        <label>
          Email
          <input name="email" type="email" autocomplete="username" required />
        </label>
        <label>
          Mot de passe
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Se connecter</button>
      </form>
    </main>
    <script src="assets/admin.js?v=20260805-phase10"></script>
  </body>
</html>
