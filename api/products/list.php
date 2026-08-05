<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/admin_products.php';
require_once __DIR__ . '/../../includes/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jolie_json_response([
        'ok' => false,
        'code' => 'method_not_allowed',
        'message' => 'Methode non autorisee.',
    ], 405);
}

try {
    $payload = jolie_public_products_payload();
    jolie_json_response([
        'ok' => true,
        'products' => $payload['products'],
        'hiddenProducts' => $payload['hiddenProducts'],
    ]);
} catch (JolieSetupException $exception) {
    jolie_json_response([
        'ok' => false,
        'code' => 'setup_missing',
        'message' => "Le catalogue admin n'est pas encore configure.",
    ], 503);
} catch (Throwable $exception) {
    jolie_json_response([
        'ok' => false,
        'code' => 'server_error',
        'message' => 'Le catalogue admin est indisponible.',
    ], 500);
}
