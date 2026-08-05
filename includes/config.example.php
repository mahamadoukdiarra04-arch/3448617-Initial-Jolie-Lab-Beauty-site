<?php

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'hostinger_database_name',
        'user' => 'hostinger_database_user',
        'password' => 'hostinger_database_password',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'timezone' => 'Africa/Bamako',
        'url' => 'https://jolielabbeauty.com',
    ],
    'notifications' => [
        'push_enabled' => true,
        'vapid_subject' => 'mailto:ramatabore31@gmail.com',
        'vapid_public_key' => 'GENERATE_WITH_tools_generate_vapid_keys',
        'vapid_private_key_pem' => <<<'PEM'
-----BEGIN PRIVATE KEY-----
GENERATE_WITH_tools_generate_vapid_keys
-----END PRIVATE KEY-----
PEM,
    ],
];
