<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/notifications.php';

jolie_require_admin();

try {
    $publicKey = jolie_push_public_key();
    if ($publicKey === '') {
        jolie_json_response([
            'ok' => false,
            'code' => 'push_not_configured',
            'message' => 'Les notifications push doivent etre configurees sur le serveur.',
        ], 503);
    }

    jolie_json_response([
        'ok' => true,
        'publicKey' => $publicKey,
    ]);
} catch (JolieSetupException $error) {
    jolie_json_response([
        'ok' => false,
        'code' => 'setup_missing',
        'message' => 'La configuration serveur est manquante.',
    ], 503);
} catch (Throwable $error) {
    error_log('Jolie push key failed: ' . $error->getMessage());
    jolie_json_response([
        'ok' => false,
        'code' => 'server_error',
        'message' => 'Les notifications push sont indisponibles.',
    ], 500);
}
