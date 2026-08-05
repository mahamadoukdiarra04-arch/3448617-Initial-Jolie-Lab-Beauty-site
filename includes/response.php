<?php

declare(strict_types=1);

function jolie_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jolie_read_json_body(int $maxBytes = 200000): array
{
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > $maxBytes) {
        throw new JolieValidationException(['payload' => 'La commande est trop volumineuse.']);
    }

    $rawBody = file_get_contents('php://input');
    if ($rawBody === false || trim($rawBody) === '') {
        throw new JolieValidationException(['payload' => 'La commande est vide.']);
    }

    $payload = json_decode($rawBody, true);
    if (!is_array($payload) || json_last_error() !== JSON_ERROR_NONE) {
        throw new JolieValidationException(['payload' => 'Le format de commande est invalide.']);
    }

    return $payload;
}
