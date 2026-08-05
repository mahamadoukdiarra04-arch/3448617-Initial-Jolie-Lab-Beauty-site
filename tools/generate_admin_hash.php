<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This tool must be run from the command line.\n");
    exit(1);
}

$password = (string) ($argv[1] ?? '');
if (strlen($password) < 10) {
    fwrite(STDERR, "Usage: php tools/generate_admin_hash.php \"long-admin-password\"\n");
    fwrite(STDERR, "Use at least 10 characters.\n");
    exit(1);
}

echo password_hash($password, PASSWORD_DEFAULT) . PHP_EOL;
