<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function jolie_admin_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('jolie_admin');
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'use_strict_mode' => true,
    ]);
}

function jolie_admin_h(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function jolie_current_admin(): ?array
{
    jolie_admin_session_start();
    $user = $_SESSION['admin_user'] ?? null;
    return is_array($user) ? $user : null;
}

function jolie_require_admin(): array
{
    $user = jolie_current_admin();
    if ($user) {
        return $user;
    }

    $next = urlencode($_SERVER['REQUEST_URI'] ?? 'index.php');
    header("Location: login.php?next={$next}");
    exit;
}

function jolie_login_admin(string $email, string $password): bool
{
    $pdo = jolie_pdo();
    $stmt = $pdo->prepare('SELECT id, email, password_hash, name, role FROM admin_users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => trim($email)]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, (string) $user['password_hash'])) {
        return false;
    }

    jolie_admin_session_start();
    session_regenerate_id(true);
    $_SESSION['admin_user'] = [
        'id' => (int) $user['id'],
        'email' => (string) $user['email'],
        'name' => (string) $user['name'],
        'role' => (string) $user['role'],
    ];

    return true;
}

function jolie_logout_admin(): void
{
    jolie_admin_session_start();
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
    }

    session_destroy();
}

function jolie_csrf_token(): string
{
    jolie_admin_session_start();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return (string) $_SESSION['csrf_token'];
}

function jolie_verify_csrf(): void
{
    jolie_admin_session_start();
    $token = (string) ($_POST['csrf_token'] ?? '');
    if ($token === '' || !hash_equals((string) ($_SESSION['csrf_token'] ?? ''), $token)) {
        throw new JolieValidationException(['csrf' => 'Session expiree. Rechargez la page et recommencez.']);
    }
}
