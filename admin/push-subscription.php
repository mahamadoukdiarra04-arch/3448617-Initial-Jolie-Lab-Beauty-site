<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/notifications.php';

$user = jolie_require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'POST') {
        $payload = jolie_read_json_body();
        $subscription = jolie_save_push_subscription(
            $payload,
            (int) ($user['id'] ?? 0),
            (string) ($_SERVER['HTTP_USER_AGENT'] ?? '')
        );

        jolie_json_response([
            'ok' => true,
            'endpoint' => $subscription['endpoint'],
        ]);
    }

    if ($method === 'DELETE') {
        $payload = jolie_read_json_body();
        jolie_disable_push_subscription((string) ($payload['endpoint'] ?? ''));
        jolie_json_response(['ok' => true]);
    }

    jolie_json_response([
        'ok' => false,
        'code' => 'method_not_allowed',
        'message' => 'Cette action attend une requete POST ou DELETE.',
    ], 405);
} catch (JolieSetupException $error) {
    jolie_json_response([
        'ok' => false,
        'code' => 'setup_missing',
        'message' => 'La configuration serveur est manquante.',
    ], 503);
} catch (JolieValidationException $error) {
    jolie_json_response([
        'ok' => false,
        'code' => 'validation_error',
        'message' => 'Abonnement push invalide.',
        'errors' => $error->errors,
    ], 422);
} catch (Throwable $error) {
    error_log('Jolie push subscription failed: ' . $error->getMessage());
    jolie_json_response([
        'ok' => false,
        'code' => 'server_error',
        'message' => 'Impossible de sauvegarder cet appareil.',
    ], 500);
}
