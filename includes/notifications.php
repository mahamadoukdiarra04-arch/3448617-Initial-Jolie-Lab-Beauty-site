<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function jolie_notification_config(): array
{
    $config = jolie_config();
    $notifications = is_array($config['notifications'] ?? null) ? $config['notifications'] : [];
    $app = is_array($config['app'] ?? null) ? $config['app'] : [];

    return [
        'app_url' => rtrim((string) ($app['url'] ?? ''), '/'),
        'push_enabled' => (bool) ($notifications['push_enabled'] ?? true),
        'vapid_subject' => (string) ($notifications['vapid_subject'] ?? 'mailto:ramatabore31@gmail.com'),
        'vapid_public_key' => trim((string) ($notifications['vapid_public_key'] ?? '')),
        'vapid_private_key_pem' => trim((string) ($notifications['vapid_private_key_pem'] ?? '')),
    ];
}

function jolie_notification_admin_url(int $orderId): string
{
    $config = jolie_notification_config();
    if ($config['app_url'] === '') {
        return '';
    }

    return $config['app_url'] . '/admin/order.php?id=' . $orderId;
}

function jolie_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function jolie_base64url_decode(string $value): string
{
    $value = strtr($value, '-_', '+/');
    $padding = strlen($value) % 4;
    if ($padding > 0) {
        $value .= str_repeat('=', 4 - $padding);
    }

    $decoded = base64_decode($value, true);
    if ($decoded === false) {
        throw new RuntimeException('Invalid base64url value');
    }

    return $decoded;
}

function jolie_der_read_length(string $der, int &$offset): int
{
    $length = ord($der[$offset]);
    $offset++;
    if (($length & 0x80) === 0) {
        return $length;
    }

    $bytes = $length & 0x7f;
    $length = 0;
    for ($i = 0; $i < $bytes; $i++) {
        $length = ($length << 8) | ord($der[$offset]);
        $offset++;
    }

    return $length;
}

function jolie_der_read_integer(string $der, int &$offset): string
{
    if (ord($der[$offset]) !== 0x02) {
        throw new RuntimeException('Invalid ECDSA signature integer');
    }
    $offset++;
    $length = jolie_der_read_length($der, $offset);
    $integer = substr($der, $offset, $length);
    $offset += $length;

    return ltrim($integer, "\x00");
}

function jolie_ecdsa_der_to_jose(string $derSignature, int $partLength = 32): string
{
    $offset = 0;
    if (ord($derSignature[$offset]) !== 0x30) {
        throw new RuntimeException('Invalid ECDSA signature sequence');
    }
    $offset++;
    jolie_der_read_length($derSignature, $offset);

    $r = jolie_der_read_integer($derSignature, $offset);
    $s = jolie_der_read_integer($derSignature, $offset);

    if (strlen($r) > $partLength) {
        $r = substr($r, -$partLength);
    }
    if (strlen($s) > $partLength) {
        $s = substr($s, -$partLength);
    }

    return str_pad($r, $partLength, "\x00", STR_PAD_LEFT)
        . str_pad($s, $partLength, "\x00", STR_PAD_LEFT);
}

function jolie_vapid_audience(string $endpoint): string
{
    $parts = parse_url($endpoint);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        throw new RuntimeException('Invalid push endpoint');
    }

    $audience = $parts['scheme'] . '://' . $parts['host'];
    if (!empty($parts['port'])) {
        $audience .= ':' . $parts['port'];
    }

    return $audience;
}

function jolie_vapid_jwt(string $endpoint, string $subject, string $privateKeyPem): string
{
    if (!function_exists('openssl_pkey_get_private') || !function_exists('openssl_sign')) {
        throw new RuntimeException('OpenSSL is required for Web Push');
    }

    $header = jolie_base64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'ES256'], JSON_THROW_ON_ERROR));
    $payload = jolie_base64url_encode(json_encode([
        'aud' => jolie_vapid_audience($endpoint),
        'exp' => time() + 43200,
        'sub' => $subject,
    ], JSON_THROW_ON_ERROR));
    $signingInput = $header . '.' . $payload;

    $privateKey = openssl_pkey_get_private($privateKeyPem);
    if ($privateKey === false) {
        throw new RuntimeException('Invalid VAPID private key');
    }

    $signature = '';
    $signed = openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);
    if (!$signed) {
        throw new RuntimeException('Unable to sign VAPID JWT');
    }

    return $signingInput . '.' . jolie_base64url_encode(jolie_ecdsa_der_to_jose($signature));
}

function jolie_push_public_key(): string
{
    try {
        $config = jolie_notification_config();
        $publicKey = trim($config['vapid_public_key']);
        $privateKey = trim($config['vapid_private_key_pem']);
        if (!$config['push_enabled'] || $publicKey === '' || $privateKey === '' || str_contains($publicKey, 'GENERATE_WITH')) {
            return '';
        }

        return $publicKey;
    } catch (Throwable) {
        return '';
    }
}

function jolie_normalize_push_subscription(array $payload): array
{
    $endpoint = trim((string) ($payload['endpoint'] ?? ''));
    $keys = is_array($payload['keys'] ?? null) ? $payload['keys'] : [];
    $p256dh = trim((string) ($keys['p256dh'] ?? ''));
    $auth = trim((string) ($keys['auth'] ?? ''));

    $errors = [];
    if ($endpoint === '' || !str_starts_with($endpoint, 'https://')) {
        $errors['endpoint'] = 'Endpoint push invalide.';
    }
    if ($p256dh === '') {
        $errors['p256dh'] = 'Cle push manquante.';
    }
    if ($auth === '') {
        $errors['auth'] = 'Secret push manquant.';
    }

    if ($errors) {
        throw new JolieValidationException($errors);
    }

    return [
        'endpoint' => mb_substr($endpoint, 0, 2048),
        'p256dh' => mb_substr($p256dh, 0, 255),
        'auth' => mb_substr($auth, 0, 255),
    ];
}

function jolie_save_push_subscription(array $payload, ?int $adminUserId, string $userAgent): array
{
    $subscription = jolie_normalize_push_subscription($payload);
    $pdo = jolie_pdo();
    $stmt = $pdo->prepare(
        'INSERT INTO admin_push_subscriptions (
            admin_user_id,
            endpoint,
            p256dh,
            auth,
            user_agent,
            is_active,
            failure_count
        ) VALUES (
            :admin_user_id,
            :endpoint,
            :p256dh,
            :auth,
            :user_agent,
            1,
            0
        )
        ON DUPLICATE KEY UPDATE
            admin_user_id = VALUES(admin_user_id),
            p256dh = VALUES(p256dh),
            auth = VALUES(auth),
            user_agent = VALUES(user_agent),
            is_active = 1,
            failure_count = 0,
            updated_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([
        'admin_user_id' => $adminUserId,
        'endpoint' => $subscription['endpoint'],
        'p256dh' => $subscription['p256dh'],
        'auth' => $subscription['auth'],
        'user_agent' => mb_substr($userAgent, 0, 500),
    ]);

    return $subscription;
}

function jolie_disable_push_subscription(string $endpoint): void
{
    $endpoint = trim($endpoint);
    if ($endpoint === '') {
        return;
    }

    $stmt = jolie_pdo()->prepare(
        'UPDATE admin_push_subscriptions
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE endpoint = :endpoint'
    );
    $stmt->execute(['endpoint' => mb_substr($endpoint, 0, 2048)]);
}

function jolie_push_subscriptions(): array
{
    $stmt = jolie_pdo()->query(
        'SELECT id, endpoint
        FROM admin_push_subscriptions
        WHERE is_active = 1
        ORDER BY updated_at DESC
        LIMIT 100'
    );

    return $stmt->fetchAll() ?: [];
}

function jolie_mark_push_subscription_result(int $id, bool $success, ?int $statusCode = null): void
{
    if ($success) {
        $stmt = jolie_pdo()->prepare(
            'UPDATE admin_push_subscriptions
            SET last_success_at = CURRENT_TIMESTAMP,
                last_error_at = NULL,
                last_status_code = :status_code,
                failure_count = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id'
        );
    } else {
        $stmt = jolie_pdo()->prepare(
            'UPDATE admin_push_subscriptions
            SET last_error_at = CURRENT_TIMESTAMP,
                last_status_code = :status_code,
                failure_count = failure_count + 1,
                is_active = IF(:status_code IN (404, 410), 0, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id'
        );
    }

    $stmt->execute([
        'id' => $id,
        'status_code' => $statusCode,
    ]);
}

function jolie_send_web_push(string $endpoint, array $config): array
{
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'status' => 0, 'error' => 'curl_missing'];
    }

    $jwt = jolie_vapid_jwt($endpoint, $config['vapid_subject'], $config['vapid_private_key_pem']);
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_POSTFIELDS => '',
        CURLOPT_HTTPHEADER => [
            'TTL: 86400',
            'Urgency: high',
            'Content-Length: 0',
            'Authorization: vapid t=' . $jwt . ', k=' . $config['vapid_public_key'],
        ],
    ]);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    return [
        'ok' => $response !== false && $status >= 200 && $status < 300,
        'status' => $status,
        'error' => $error ?: null,
    ];
}

function jolie_send_order_pushes(array $order): array
{
    try {
        $config = jolie_notification_config();
        if (!$config['push_enabled'] || $config['vapid_public_key'] === '' || $config['vapid_private_key_pem'] === '' || str_contains($config['vapid_public_key'], 'GENERATE_WITH')) {
            return ['push' => 'disabled', 'sent' => 0, 'failed' => 0];
        }

        $sent = 0;
        $failed = 0;
        foreach (jolie_push_subscriptions() as $subscription) {
            $result = jolie_send_web_push((string) $subscription['endpoint'], $config);
            $ok = (bool) $result['ok'];
            jolie_mark_push_subscription_result((int) $subscription['id'], $ok, (int) ($result['status'] ?? 0));
            if ($ok) {
                $sent++;
            } else {
                $failed++;
            }
        }

        return ['push' => 'done', 'sent' => $sent, 'failed' => $failed];
    } catch (Throwable $error) {
        error_log('Jolie push notification failed: ' . $error->getMessage());
        return ['push' => 'failed', 'sent' => 0, 'failed' => 1];
    }
}

function jolie_notify_new_order(array $order): array
{
    return jolie_send_order_pushes($order);
}
