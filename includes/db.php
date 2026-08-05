<?php

declare(strict_types=1);

class JolieSetupException extends RuntimeException
{
}

class JolieValidationException extends RuntimeException
{
    /** @var array<string, string> */
    public array $errors;

    /** @param array<string, string> $errors */
    public function __construct(array $errors, string $message = 'Validation failed')
    {
        parent::__construct($message);
        $this->errors = $errors;
    }
}

function jolie_config(): array
{
    static $config = null;

    if ($config !== null) {
        return $config;
    }

    $configPath = __DIR__ . '/config.php';
    if (!is_file($configPath)) {
        throw new JolieSetupException('Missing includes/config.php');
    }

    $loaded = require $configPath;
    if (!is_array($loaded)) {
        throw new JolieSetupException('Invalid includes/config.php');
    }

    $config = $loaded;
    return $config;
}

function jolie_pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = jolie_config();
    $db = $config['db'] ?? [];
    foreach (['host', 'name', 'user', 'password'] as $key) {
        if (!array_key_exists($key, $db) || $db[$key] === '') {
            throw new JolieSetupException("Missing database config: {$key}");
        }
    }

    $timezone = $config['app']['timezone'] ?? 'Africa/Bamako';
    date_default_timezone_set((string) $timezone);

    $charset = $db['charset'] ?? 'utf8mb4';
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $db['host'], $db['name'], $charset);

    $pdo = new PDO($dsn, (string) $db['user'], (string) $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
