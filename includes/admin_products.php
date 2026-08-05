<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function jolie_product_default_categories(): array
{
    return [
        'Visage',
        'Corps',
        'Corps & Visage',
        'Cheveux',
        'Packs',
        'Accessoires',
        'Maquillage',
        'Homme',
        'Homme & Femme',
        'Parfum',
    ];
}

function jolie_product_slugify(string $value): string
{
    $value = trim($value);
    if (function_exists('transliterator_transliterate')) {
        $value = (string) transliterator_transliterate('Any-Latin; Latin-ASCII', $value);
    } else {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($ascii !== false) {
            $value = $ascii;
        }
    }

    $value = strtolower($value);
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    $value = trim($value, '-');

    return $value !== '' ? $value : 'produit-' . date('YmdHis');
}

function jolie_admin_clean_product_category_name(string $value): string
{
    $value = preg_replace('/\s+/u', ' ', trim($value)) ?? '';
    return trim($value);
}

function jolie_admin_ensure_product_categories_table(): void
{
    static $ensured = false;

    if ($ensured) {
        return;
    }

    $pdo = jolie_pdo();
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS product_categories (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(80) NOT NULL,
            slug VARCHAR(100) NOT NULL,
            sort_order INT UNSIGNED NOT NULL DEFAULT 9999,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_product_categories_name (name),
            UNIQUE KEY uq_product_categories_slug (slug),
            KEY idx_product_categories_sort (sort_order, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $insert = $pdo->prepare(
        'INSERT IGNORE INTO product_categories (name, slug, sort_order)
        VALUES (:name, :slug, :sort_order)'
    );

    foreach (jolie_product_default_categories() as $index => $category) {
        $insert->execute([
            'name' => $category,
            'slug' => mb_substr(jolie_product_slugify($category), 0, 100),
            'sort_order' => ($index + 1) * 10,
        ]);
    }

    $ensured = true;

    try {
        $productCategories = $pdo->query(
            "SELECT DISTINCT category FROM products WHERE TRIM(category) <> ''"
        )->fetchAll(PDO::FETCH_COLUMN) ?: [];
        foreach ($productCategories as $category) {
            $category = jolie_admin_clean_product_category_name((string) $category);
            if ($category === '' || mb_strlen($category) > 80) {
                continue;
            }
            jolie_admin_create_product_category($category, 9999);
        }
    } catch (Throwable) {
        // The products table may not exist yet during first setup.
    }
}

function jolie_admin_create_product_category(string $name, int $sortOrder = 9999): string
{
    $name = jolie_admin_clean_product_category_name($name);
    if ($name === '') {
        throw new JolieValidationException(['new_category' => 'Le nom de la categorie est obligatoire.']);
    }
    if (mb_strlen($name) > 80) {
        throw new JolieValidationException(['new_category' => 'Le nom de la categorie est trop long.']);
    }

    jolie_admin_ensure_product_categories_table();
    $pdo = jolie_pdo();

    $existing = $pdo->prepare('SELECT name FROM product_categories WHERE name = :name LIMIT 1');
    $existing->execute(['name' => $name]);
    $existingName = $existing->fetchColumn();
    if ($existingName !== false) {
        return (string) $existingName;
    }

    $baseSlug = mb_substr(jolie_product_slugify($name), 0, 92);
    $insert = $pdo->prepare(
        'INSERT IGNORE INTO product_categories (name, slug, sort_order)
        VALUES (:name, :slug, :sort_order)'
    );

    for ($attempt = 0; $attempt < 20; $attempt++) {
        $suffix = $attempt === 0 ? '' : '-' . ($attempt + 1);
        $slug = mb_substr($baseSlug . $suffix, 0, 100);
        $insert->execute([
            'name' => $name,
            'slug' => $slug,
            'sort_order' => $sortOrder,
        ]);

        $existing->execute(['name' => $name]);
        $existingName = $existing->fetchColumn();
        if ($existingName !== false) {
            return (string) $existingName;
        }
    }

    throw new JolieValidationException(['new_category' => "Impossible de creer cette categorie."]);
}

function jolie_product_categories(): array
{
    jolie_admin_ensure_product_categories_table();
    $rows = jolie_pdo()
        ->query('SELECT name FROM product_categories ORDER BY sort_order ASC, name ASC')
        ->fetchAll(PDO::FETCH_COLUMN) ?: [];
    $categories = array_values(array_filter(array_map('strval', $rows)));

    return $categories ?: jolie_product_default_categories();
}

function jolie_product_nullable_string(array $source, string $key, int $maxLength = 1000): ?string
{
    $value = trim((string) ($source[$key] ?? ''));
    if ($value === '') {
        return null;
    }

    return mb_substr($value, 0, $maxLength);
}

function jolie_product_required_string(array $source, string $key, string $label, array &$errors, int $maxLength = 255): string
{
    $value = trim((string) ($source[$key] ?? ''));
    if ($value === '') {
        $errors[$key] = "{$label} est obligatoire.";
        return '';
    }
    if (mb_strlen($value) > $maxLength) {
        $errors[$key] = "{$label} est trop long.";
        return mb_substr($value, 0, $maxLength);
    }

    return $value;
}

function jolie_product_positive_int(mixed $value, string $label, array &$errors, string $key, bool $allowZero = false): int
{
    $number = filter_var($value, FILTER_VALIDATE_INT);
    $min = $allowZero ? 0 : 1;
    if ($number === false || $number < $min) {
        $errors[$key] = "{$label} est invalide.";
        return 0;
    }

    return (int) $number;
}

function jolie_product_media_from_text(string $raw, string $type, array &$errors, string $field): array
{
    $media = [];
    $lines = preg_split('/\R/u', $raw) ?: [];

    foreach ($lines as $index => $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }

        $parts = array_map('trim', explode('|', $line, 2));
        $url = $parts[0] ?? '';
        $label = $parts[1] ?? '';

        if ($url === '') {
            continue;
        }
        if (mb_strlen($url) > 1000) {
            $errors["{$field}.{$index}"] = 'Une URL media est trop longue.';
            continue;
        }

        $media[] = [
            'type' => $type,
            'url' => $url,
            'title' => $type === 'video' ? ($label !== '' ? $label : null) : null,
            'alt' => $label !== '' ? $label : null,
            'sort_order' => count($media),
        ];
    }

    return $media;
}

function jolie_admin_uploaded_files(?array $files): array
{
    if (!$files || !isset($files['name'])) {
        return [];
    }

    $names = is_array($files['name']) ? $files['name'] : [$files['name']];
    $types = is_array($files['type'] ?? null) ? $files['type'] : [($files['type'] ?? '')];
    $tmpNames = is_array($files['tmp_name'] ?? null) ? $files['tmp_name'] : [($files['tmp_name'] ?? '')];
    $errors = is_array($files['error'] ?? null) ? $files['error'] : [($files['error'] ?? UPLOAD_ERR_NO_FILE)];
    $sizes = is_array($files['size'] ?? null) ? $files['size'] : [($files['size'] ?? 0)];
    $items = [];
    foreach ($names as $index => $name) {
        $items[] = [
            'name' => (string) $name,
            'type' => (string) ($types[$index] ?? ''),
            'tmp_name' => (string) ($tmpNames[$index] ?? ''),
            'error' => (int) ($errors[$index] ?? UPLOAD_ERR_NO_FILE),
            'size' => (int) ($sizes[$index] ?? 0),
        ];
    }

    return $items;
}

function jolie_admin_upload_error_message(int $error): string
{
    return match ($error) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Le fichier est trop lourd pour le serveur.',
        UPLOAD_ERR_PARTIAL => "L'envoi du fichier a ete interrompu.",
        UPLOAD_ERR_NO_TMP_DIR => 'Le dossier temporaire du serveur est indisponible.',
        UPLOAD_ERR_CANT_WRITE => "Le serveur n'a pas pu enregistrer le fichier.",
        UPLOAD_ERR_EXTENSION => "L'envoi du fichier a ete bloque par le serveur.",
        default => "Le fichier n'a pas pu etre importe.",
    };
}

function jolie_admin_media_upload_config(string $type): array
{
    if ($type === 'image') {
        return [
            'label' => 'image',
            'max_bytes' => 8 * 1024 * 1024,
            'mimes' => [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
            ],
            'extensions' => ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        ];
    }

    return [
        'label' => 'video',
        'max_bytes' => 80 * 1024 * 1024,
        'mimes' => [
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
            'video/quicktime' => 'mov',
            'video/x-m4v' => 'm4v',
        ],
        'extensions' => ['mp4', 'webm', 'mov', 'm4v'],
    ];
}

function jolie_admin_uploaded_file_mime(string $path): string
{
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $mime = finfo_file($finfo, $path);
            finfo_close($finfo);
            if (is_string($mime) && $mime !== '') {
                return $mime;
            }
        }
    }

    return function_exists('mime_content_type') ? (string) mime_content_type($path) : '';
}

function jolie_admin_upload_product_media(?array $files, string $type, array &$errors): array
{
    $items = jolie_admin_uploaded_files($files);
    if (!$items) {
        return [];
    }

    $config = jolie_admin_media_upload_config($type);
    $field = $type === 'image' ? 'image_files' : 'video_files';
    $activeItems = array_values(array_filter(
        $items,
        static fn (array $item): bool => (int) $item['error'] !== UPLOAD_ERR_NO_FILE
    ));
    if (count($activeItems) > 8) {
        $errors[$field] = 'Importez au maximum 8 fichiers a la fois.';
        return [];
    }

    $targetDir = dirname(__DIR__) . '/assets/products';
    if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
        $errors[$field] = "Le dossier d'upload produit est indisponible.";
        return [];
    }

    $uploaded = [];
    foreach ($activeItems as $index => $item) {
        $errorKey = "{$field}.{$index}";
        if ((int) $item['error'] !== UPLOAD_ERR_OK) {
            $errors[$errorKey] = jolie_admin_upload_error_message((int) $item['error']);
            continue;
        }
        if ((int) $item['size'] <= 0 || (int) $item['size'] > (int) $config['max_bytes']) {
            $errors[$errorKey] = "Ce fichier {$config['label']} est trop lourd.";
            continue;
        }

        $tmpName = (string) $item['tmp_name'];
        $mime = jolie_admin_uploaded_file_mime($tmpName);
        $originalExtension = strtolower((string) pathinfo((string) $item['name'], PATHINFO_EXTENSION));
        $extension = $config['mimes'][$mime] ?? null;
        if ($extension === null && in_array($originalExtension, $config['extensions'], true)) {
            $extension = $originalExtension === 'jpeg' ? 'jpg' : $originalExtension;
        }
        if ($extension === null) {
            $errors[$errorKey] = "Format {$config['label']} non accepte.";
            continue;
        }

        $fileName = 'admin-' . date('Ymd-His') . '-' . bin2hex(random_bytes(5)) . '.' . $extension;
        $destination = $targetDir . '/' . $fileName;
        if (!move_uploaded_file($tmpName, $destination)) {
            $errors[$errorKey] = "Impossible d'enregistrer ce fichier.";
            continue;
        }

        $label = jolie_admin_clean_product_category_name((string) pathinfo((string) $item['name'], PATHINFO_FILENAME));
        $uploaded[] = [
            'type' => $type,
            'url' => 'assets/products/' . $fileName,
            'label' => mb_substr($label, 0, 120),
        ];
    }

    return $uploaded;
}

function jolie_admin_append_media_upload_lines(string $raw, array $uploads): string
{
    $lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', $raw) ?: [])));
    foreach ($uploads as $upload) {
        $line = (string) ($upload['url'] ?? '');
        $label = trim((string) ($upload['label'] ?? ''));
        if ($line === '') {
            continue;
        }
        if ($label !== '') {
            $line .= ' | ' . $label;
        }
        $lines[] = $line;
    }

    return implode("\n", $lines);
}

function jolie_product_variants_from_payload(array $payload, array &$errors): array
{
    $keys = array_values((array) ($payload['variant_ids'] ?? []));
    $names = array_values((array) ($payload['variant_names'] ?? []));
    $prices = array_values((array) ($payload['variant_prices'] ?? []));
    $defaultIndex = (string) ($payload['variant_default'] ?? '');
    $rowCount = max(count($keys), count($names), count($prices));
    $variants = [];
    $seenKeys = [];

    for ($index = 0; $index < $rowCount; $index++) {
        $rawKey = trim((string) ($keys[$index] ?? ''));
        $name = trim((string) ($names[$index] ?? ''));
        $priceRaw = trim((string) ($prices[$index] ?? ''));

        if ($rawKey === '' && $name === '' && $priceRaw === '') {
            continue;
        }

        if ($name === '') {
            $errors["variant_names.{$index}"] = 'Le nom de la variante est obligatoire.';
            continue;
        }
        if (mb_strlen($name) > 180) {
            $errors["variant_names.{$index}"] = 'Le nom de la variante est trop long.';
            $name = mb_substr($name, 0, 180);
        }

        $price = jolie_product_positive_int($priceRaw, 'Le prix de variante', $errors, "variant_prices.{$index}");
        $variantKey = jolie_product_slugify($rawKey !== '' ? $rawKey : $name);
        if (isset($seenKeys[$variantKey])) {
            $errors["variant_ids.{$index}"] = 'Deux variantes utilisent la meme cle.';
            continue;
        }
        $seenKeys[$variantKey] = true;

        $variants[] = [
            'variant_key' => mb_substr($variantKey, 0, 80),
            'name' => $name,
            'price' => $price,
            'is_default' => (string) $index === $defaultIndex ? 1 : 0,
            'sort_order' => count($variants),
        ];
    }

    if ($variants && !array_filter($variants, static fn (array $variant): bool => (int) $variant['is_default'] === 1)) {
        $variants[0]['is_default'] = 1;
    }

    return $variants;
}

function jolie_admin_normalize_product_payload(array $payload): array
{
    $errors = [];
    $categories = jolie_product_categories();
    $name = jolie_product_required_string($payload, 'name', 'Le nom du produit', $errors, 255);
    $slugSource = trim((string) ($payload['slug'] ?? '')) ?: $name;
    $slug = mb_substr(jolie_product_slugify($slugSource), 0, 180);
    $category = jolie_product_required_string($payload, 'category', 'La categorie', $errors, 80);
    $newCategory = jolie_admin_clean_product_category_name((string) ($payload['new_category'] ?? ''));
    $categoryToCreate = null;
    if ($newCategory !== '') {
        if (mb_strlen($newCategory) > 80) {
            $errors['new_category'] = 'Le nom de la categorie est trop long.';
        } else {
            $category = $newCategory;
            $categoryToCreate = $newCategory;
        }
    } elseif ($category === '__new__') {
        $errors['new_category'] = 'Saisissez le nom de la nouvelle categorie.';
    } elseif ($category !== '' && !in_array($category, $categories, true)) {
        $errors['category'] = 'La categorie choisie est invalide.';
    }

    $price = jolie_product_positive_int($payload['price'] ?? null, 'Le prix', $errors, 'price');
    $sortOrder = jolie_product_positive_int($payload['sort_order'] ?? 9999, "L'ordre", $errors, 'sort_order', true);
    $description = (string) ($payload['description'] ?? '');
    if (trim($description) === '') {
        $errors['description'] = 'La description est obligatoire.';
    }

    $media = array_merge(
        jolie_product_media_from_text((string) ($payload['image_urls'] ?? ''), 'image', $errors, 'image_urls'),
        jolie_product_media_from_text((string) ($payload['video_urls'] ?? ''), 'video', $errors, 'video_urls')
    );
    $variants = jolie_product_variants_from_payload($payload, $errors);

    if ($errors) {
        throw new JolieValidationException($errors);
    }
    if ($categoryToCreate !== null) {
        $category = jolie_admin_create_product_category($categoryToCreate);
    }

    return [
        'slug' => $slug,
        'name' => $name,
        'category' => $category,
        'price' => $price,
        'price_note' => jolie_product_nullable_string($payload, 'price_note', 180),
        'description' => $description,
        'summary' => jolie_product_nullable_string($payload, 'summary', 1200),
        'usage_note' => jolie_product_nullable_string($payload, 'usage', 1200),
        'suited_for' => jolie_product_nullable_string($payload, 'suited_for', 1200),
        'sort_order' => $sortOrder,
        'is_active' => isset($payload['is_active']) ? 1 : 0,
        'media' => $media,
        'variants' => $variants,
    ];
}

function jolie_admin_product_empty_form(): array
{
    return [
        'id' => null,
        'name' => '',
        'slug' => '',
        'category' => 'Visage',
        'new_category' => '',
        'price' => '',
        'price_note' => '',
        'description' => '',
        'summary' => '',
        'usage' => '',
        'suited_for' => '',
        'sort_order' => 9999,
        'is_active' => 1,
        'image_urls' => '',
        'video_urls' => '',
        'variants' => [],
    ];
}

function jolie_admin_product_media_text(array $product, string $type): string
{
    $lines = [];
    foreach (($product['media'] ?? []) as $media) {
        if (($media['type'] ?? '') !== $type) {
            continue;
        }
        $label = trim((string) (($media['title'] ?? '') ?: ($media['alt'] ?? '')));
        $line = (string) ($media['url'] ?? '');
        if ($label !== '') {
            $line .= ' | ' . $label;
        }
        $lines[] = $line;
    }

    return implode("\n", $lines);
}

function jolie_admin_product_form_from_post(array $payload): array
{
    $form = jolie_admin_product_empty_form();
    foreach (['name', 'slug', 'category', 'new_category', 'price', 'price_note', 'description', 'summary', 'usage', 'suited_for', 'sort_order', 'image_urls', 'video_urls'] as $key) {
        $form[$key] = (string) ($payload[$key] ?? $form[$key]);
    }
    $form['is_active'] = isset($payload['is_active']) ? 1 : 0;
    $form['variants'] = [];

    $keys = array_values((array) ($payload['variant_ids'] ?? []));
    $names = array_values((array) ($payload['variant_names'] ?? []));
    $prices = array_values((array) ($payload['variant_prices'] ?? []));
    $defaultIndex = (string) ($payload['variant_default'] ?? '');
    $rowCount = max(count($keys), count($names), count($prices));
    for ($index = 0; $index < $rowCount; $index++) {
        $form['variants'][] = [
            'variant_key' => (string) ($keys[$index] ?? ''),
            'name' => (string) ($names[$index] ?? ''),
            'price' => (string) ($prices[$index] ?? ''),
            'is_default' => (string) $index === $defaultIndex ? 1 : 0,
        ];
    }

    return $form;
}

function jolie_admin_product_for_form(?array $product): array
{
    if (!$product) {
        return jolie_admin_product_empty_form();
    }

    return [
        'id' => $product['id'] ?? null,
        'name' => (string) ($product['name'] ?? ''),
        'slug' => (string) ($product['slug'] ?? ''),
        'category' => (string) ($product['category'] ?? 'Visage'),
        'new_category' => '',
        'price' => (string) ($product['price'] ?? ''),
        'price_note' => (string) ($product['price_note'] ?? ''),
        'description' => (string) ($product['description'] ?? ''),
        'summary' => (string) ($product['summary'] ?? ''),
        'usage' => (string) ($product['usage_note'] ?? ''),
        'suited_for' => (string) ($product['suited_for'] ?? ''),
        'sort_order' => (string) ($product['sort_order'] ?? 9999),
        'is_active' => (int) ($product['is_active'] ?? 1),
        'image_urls' => jolie_admin_product_media_text($product, 'image'),
        'video_urls' => jolie_admin_product_media_text($product, 'video'),
        'variants' => $product['variants'] ?? [],
    ];
}

function jolie_admin_product_status_class(int $isActive): string
{
    return $isActive === 1 ? 'is-delivered' : 'is-cancelled';
}

function jolie_admin_product_status_label(int $isActive): string
{
    return $isActive === 1 ? 'Publie' : 'Masque';
}

function jolie_admin_product_stats(): array
{
    $pdo = jolie_pdo();
    $totals = $pdo->query(
        'SELECT
            COUNT(*) AS total_products,
            SUM(is_active = 1) AS active_products,
            SUM(is_active = 0) AS hidden_products
        FROM products'
    )->fetch() ?: [];

    return [
        'total_products' => (int) ($totals['total_products'] ?? 0),
        'active_products' => (int) ($totals['active_products'] ?? 0),
        'hidden_products' => (int) ($totals['hidden_products'] ?? 0),
    ];
}

function jolie_admin_list_products(array $filters = [], int $limit = 100): array
{
    $pdo = jolie_pdo();
    $where = [];
    $params = [];
    $status = trim((string) ($filters['status'] ?? ''));
    $category = trim((string) ($filters['category'] ?? ''));
    $search = trim((string) ($filters['q'] ?? ''));

    if ($status === 'active') {
        $where[] = 'p.is_active = 1';
    } elseif ($status === 'hidden') {
        $where[] = 'p.is_active = 0';
    }

    if ($category !== '' && in_array($category, jolie_product_categories(), true)) {
        $where[] = 'p.category = :category';
        $params['category'] = $category;
    }

    if ($search !== '') {
        $where[] = '(p.name LIKE :search OR p.slug LIKE :search OR p.description LIKE :search)';
        $params['search'] = '%' . $search . '%';
    }

    $sql = "SELECT
        p.*,
        (SELECT url FROM product_media pm WHERE pm.product_id = p.id AND pm.type = 'image' ORDER BY pm.sort_order ASC, pm.id ASC LIMIT 1) AS image_url,
        (SELECT COUNT(*) FROM product_media pm WHERE pm.product_id = p.id AND pm.type = 'video') AS video_count,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) AS variant_count
    FROM products p";

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $limit = max(1, min(300, $limit));
    $sql .= " ORDER BY p.sort_order ASC, p.name ASC LIMIT {$limit}";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll() ?: [];
}

function jolie_admin_load_product_relations(array &$product): void
{
    $pdo = jolie_pdo();
    $media = $pdo->prepare('SELECT * FROM product_media WHERE product_id = :product_id ORDER BY sort_order ASC, id ASC');
    $media->execute(['product_id' => $product['id']]);
    $product['media'] = $media->fetchAll() ?: [];

    $variants = $pdo->prepare('SELECT * FROM product_variants WHERE product_id = :product_id ORDER BY sort_order ASC, id ASC');
    $variants->execute(['product_id' => $product['id']]);
    $product['variants'] = $variants->fetchAll() ?: [];
}

function jolie_admin_get_product(int $id): ?array
{
    $pdo = jolie_pdo();
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $product = $stmt->fetch();

    if (!$product) {
        return null;
    }

    jolie_admin_load_product_relations($product);
    return $product;
}

function jolie_admin_save_product(?int $id, array $payload): int
{
    $product = jolie_admin_normalize_product_payload($payload);
    $pdo = jolie_pdo();

    $check = $pdo->prepare('SELECT id FROM products WHERE slug = :slug AND id <> :id LIMIT 1');
    $check->execute(['slug' => $product['slug'], 'id' => $id ?: 0]);
    if ($check->fetch()) {
        throw new JolieValidationException(['slug' => 'Ce slug est deja utilise par un autre produit.']);
    }

    $pdo->beginTransaction();
    try {
        $params = [
            'slug' => $product['slug'],
            'name' => $product['name'],
            'category' => $product['category'],
            'price' => $product['price'],
            'price_note' => $product['price_note'],
            'description' => $product['description'],
            'summary' => $product['summary'],
            'usage_note' => $product['usage_note'],
            'suited_for' => $product['suited_for'],
            'sort_order' => $product['sort_order'],
            'is_active' => $product['is_active'],
        ];

        if ($id && jolie_admin_get_product($id)) {
            $params['id'] = $id;
            $stmt = $pdo->prepare(
                'UPDATE products
                SET slug = :slug,
                    name = :name,
                    category = :category,
                    price = :price,
                    price_note = :price_note,
                    description = :description,
                    summary = :summary,
                    usage_note = :usage_note,
                    suited_for = :suited_for,
                    sort_order = :sort_order,
                    is_active = :is_active
                WHERE id = :id'
            );
            $stmt->execute($params);
            $productId = $id;
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO products (
                    slug,
                    name,
                    category,
                    price,
                    price_note,
                    description,
                    summary,
                    usage_note,
                    suited_for,
                    sort_order,
                    is_active
                ) VALUES (
                    :slug,
                    :name,
                    :category,
                    :price,
                    :price_note,
                    :description,
                    :summary,
                    :usage_note,
                    :suited_for,
                    :sort_order,
                    :is_active
                )'
            );
            $stmt->execute($params);
            $productId = (int) $pdo->lastInsertId();
        }

        $pdo->prepare('DELETE FROM product_media WHERE product_id = :product_id')->execute(['product_id' => $productId]);
        $mediaInsert = $pdo->prepare(
            'INSERT INTO product_media (product_id, type, url, title, alt, sort_order)
            VALUES (:product_id, :type, :url, :title, :alt, :sort_order)'
        );
        foreach ($product['media'] as $media) {
            $mediaInsert->execute([
                'product_id' => $productId,
                'type' => $media['type'],
                'url' => $media['url'],
                'title' => $media['title'],
                'alt' => $media['alt'],
                'sort_order' => $media['sort_order'],
            ]);
        }

        $pdo->prepare('DELETE FROM product_variants WHERE product_id = :product_id')->execute(['product_id' => $productId]);
        $variantInsert = $pdo->prepare(
            'INSERT INTO product_variants (product_id, variant_key, name, price, is_default, sort_order)
            VALUES (:product_id, :variant_key, :name, :price, :is_default, :sort_order)'
        );
        foreach ($product['variants'] as $variant) {
            $variantInsert->execute([
                'product_id' => $productId,
                'variant_key' => $variant['variant_key'],
                'name' => $variant['name'],
                'price' => $variant['price'],
                'is_default' => $variant['is_default'],
                'sort_order' => $variant['sort_order'],
            ]);
        }

        $pdo->commit();
        return $productId;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function jolie_admin_set_product_active(int $id, bool $isActive): void
{
    $pdo = jolie_pdo();
    $stmt = $pdo->prepare('UPDATE products SET is_active = :is_active WHERE id = :id');
    $stmt->execute([
        'id' => $id,
        'is_active' => $isActive ? 1 : 0,
    ]);
}

function jolie_public_product_record(array $product): array
{
    $images = [];
    $videos = [];
    foreach (($product['media'] ?? []) as $media) {
        if (($media['type'] ?? '') === 'image') {
            $images[] = (string) $media['url'];
        }
        if (($media['type'] ?? '') === 'video') {
            $videos[] = [
                'url' => (string) $media['url'],
                'title' => (string) ($media['title'] ?? ''),
                'alt' => (string) ($media['alt'] ?? ''),
            ];
        }
    }

    $variants = array_map(
        static fn (array $variant): array => [
            'id' => (string) $variant['variant_key'],
            'name' => (string) $variant['name'],
            'price' => (int) $variant['price'],
        ],
        $product['variants'] ?? []
    );

    $price = (int) ($product['price'] ?? 0);
    if ($price <= 0 && $variants) {
        $price = (int) $variants[0]['price'];
    }

    return [
        'id' => 'admin-' . (int) $product['id'],
        'sourceId' => (int) $product['id'],
        'name' => (string) $product['name'],
        'slug' => (string) $product['slug'],
        'category' => (string) $product['category'],
        'price' => $price,
        'priceNote' => $product['price_note'] ?: null,
        'images' => $images,
        'videos' => $videos,
        'description' => (string) $product['description'],
        'summary' => $product['summary'] ?: '',
        'usage' => $product['usage_note'] ?: '',
        'suitedFor' => $product['suited_for'] ?: '',
        'variants' => $variants,
        'sortOrder' => (int) ($product['sort_order'] ?? 9999),
    ];
}

function jolie_public_products_payload(): array
{
    $pdo = jolie_pdo();
    $rows = $pdo->query('SELECT * FROM products ORDER BY sort_order ASC, name ASC')->fetchAll() ?: [];
    $products = [];
    $hidden = [];

    foreach ($rows as $product) {
        if ((int) $product['is_active'] !== 1) {
            $hidden[] = [
                'id' => 'admin-' . (int) $product['id'],
                'sourceId' => (int) $product['id'],
                'slug' => (string) $product['slug'],
            ];
            continue;
        }

        jolie_admin_load_product_relations($product);
        $products[] = jolie_public_product_record($product);
    }

    return [
        'products' => $products,
        'hiddenProducts' => $hidden,
    ];
}
