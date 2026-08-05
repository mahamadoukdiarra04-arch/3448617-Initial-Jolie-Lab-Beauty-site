<?php

declare(strict_types=1);

function jolie_tools_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function jolie_tools_openssl_config_path(): string
{
    $path = tempnam(sys_get_temp_dir(), 'jolie-openssl-');
    if ($path === false) {
        fwrite(STDERR, "Impossible de creer la configuration temporaire OpenSSL.\n");
        exit(1);
    }

    file_put_contents($path, "openssl_conf = openssl_init\n\n[openssl_init]\n");
    register_shutdown_function(static function () use ($path): void {
        if (is_file($path)) {
            @unlink($path);
        }
    });

    return $path;
}

if (!extension_loaded('openssl') || !defined('OPENSSL_KEYTYPE_EC')) {
    fwrite(STDERR, "OpenSSL avec support EC est requis.\n");
    exit(1);
}

$opensslConfigPath = jolie_tools_openssl_config_path();
$key = openssl_pkey_new([
    'config' => $opensslConfigPath,
    'private_key_type' => OPENSSL_KEYTYPE_EC,
    'private_key_bits' => 384,
    'curve_name' => 'prime256v1',
]);

if ($key === false) {
    fwrite(STDERR, "Impossible de generer la cle VAPID.\n");
    exit(1);
}

$privatePem = '';
if (!openssl_pkey_export($key, $privatePem, null, ['config' => $opensslConfigPath])) {
    fwrite(STDERR, "Impossible d'exporter la cle privee VAPID.\n");
    exit(1);
}

$details = openssl_pkey_get_details($key);
$ec = is_array($details) ? ($details['ec'] ?? []) : [];
$x = is_array($ec) ? ($ec['x'] ?? '') : '';
$y = is_array($ec) ? ($ec['y'] ?? '') : '';

if (!is_string($x) || !is_string($y) || strlen($x) !== 32 || strlen($y) !== 32) {
    fwrite(STDERR, "Impossible de lire la cle publique VAPID.\n");
    exit(1);
}

$publicKey = jolie_tools_base64url_encode("\x04" . $x . $y);

echo "vapid_public_key:\n";
echo $publicKey . "\n\n";
echo "vapid_private_key_pem:\n";
echo $privatePem . "\n";
