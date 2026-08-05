<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/orders.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jolie_json_response([
        'ok' => false,
        'code' => 'method_not_allowed',
        'message' => 'Cette action attend une requete POST.',
    ], 405);
}

try {
    $payload = jolie_read_json_body();
    $order = jolie_create_order($payload);

    jolie_json_response([
        'ok' => true,
        'order' => $order,
    ], 201);
} catch (JolieSetupException $error) {
    jolie_json_response([
        'ok' => false,
        'code' => 'setup_missing',
        'message' => 'Le stockage des commandes doit etre configure sur le serveur.',
    ], 503);
} catch (JolieValidationException $error) {
    jolie_json_response([
        'ok' => false,
        'code' => 'validation_error',
        'message' => 'Certaines informations de commande sont invalides.',
        'errors' => $error->errors,
    ], 422);
} catch (Throwable $error) {
    error_log('Jolie order create failed: ' . $error->getMessage());
    jolie_json_response([
        'ok' => false,
        'code' => 'server_error',
        'message' => 'La commande ne peut pas etre enregistree pour le moment.',
    ], 500);
}
