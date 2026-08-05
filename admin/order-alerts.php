<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/../includes/response.php';

jolie_require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jolie_json_response([
        'ok' => false,
        'code' => 'method_not_allowed',
        'message' => 'Methode non autorisee.',
    ], 405);
}

try {
    $afterId = max(0, (int) ($_GET['after'] ?? 0));
    jolie_json_response([
        'ok' => true,
        'alerts' => jolie_admin_order_alert_snapshot($afterId),
    ]);
} catch (JolieSetupException $exception) {
    jolie_json_response([
        'ok' => false,
        'code' => 'setup_missing',
        'message' => "La base MySQL n'est pas encore configuree.",
    ], 503);
} catch (Throwable $exception) {
    jolie_json_response([
        'ok' => false,
        'code' => 'server_error',
        'message' => 'Les alertes commandes sont indisponibles.',
    ], 500);
}
